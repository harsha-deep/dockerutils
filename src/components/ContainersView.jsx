import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import DataTable from "./DataTable";

function ContainersView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchContainers = useCallback(async () => {
    try {
      const result = await invoke("docker_ps");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch containers");
    } finally {
      setLoading(false);
    }
  }, []);

  const setRowLoading = (key, loading) =>
    setLoadingRows((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });

  const handleStart = async (name) => {
    const key = `start-${name}`;
    setRowLoading(key, true);
    try {
      const started = await invoke("docker_start_container", { name });
      toast.success(`Started container: ${started}`);
      await fetchContainers();
    } catch (err) {
      toast.error(`Start failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const handleStop = async (name) => {
    const key = `stop-${name}`;
    setRowLoading(key, true);
    try {
      const stopped = await invoke("docker_stop_container", { name });
      toast.success(`Stopped container: ${stopped}`);
      await fetchContainers();
    } catch (err) {
      toast.error(`Stop failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const handleRemove = async (name) => {
    const key = `remove-${name}`;
    setRowLoading(key, true);
    try {
      const removed = await invoke("docker_remove_container", { name });
      toast.success(`Removed container: ${removed}`);
      await fetchContainers();
    } catch (err) {
      toast.error(`Remove failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "Names",
    },
    {
      header: "Image",
      accessorKey: "Image",
    },
    {
      header: "Status",
      accessorKey: "Status",
      cell: ({ getValue }) => {
        const status = getValue();
        const isRunning = status?.toLowerCase().includes("up");
        return (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isRunning
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Ports",
      accessorKey: "Ports",
      cell: ({ getValue }) => {
        const ports = getValue();
        if (!ports) return <span className="text-gray-400 dark:text-[#6B6B6B] text-xs">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {ports.split(", ").map((p) => (
              <span key={p} className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                {p}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const name = row.original.Names;
        const status = row.original.Status ?? "";
        const isRunning = status.toLowerCase().includes("up");
        const starting = loadingRows.has(`start-${name}`);
        const stopping = loadingRows.has(`stop-${name}`);
        const removing = loadingRows.has(`remove-${name}`);
        const busy = starting || stopping || removing;
        return (
          <div className="flex gap-2">
            {isRunning ? (
              <button
                disabled={busy}
                onClick={() => handleStop(name)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${stopping ? "opacity-60" : ""}`}
              >
                {stopping ? "Stopping…" : "Stop"}
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => handleStart(name)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium bg-green-500 hover:bg-green-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${starting ? "opacity-60" : ""}`}
              >
                {starting ? "Starting…" : "Start"}
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => handleRemove(name)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${removing ? "opacity-60" : ""}`}
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);

  return (
    <div className="p-5">
      <DataTable data={data} columns={columns} loading={loading} emptyMessage="No containers found" />
    </div>
  );
}

export default ContainersView;
