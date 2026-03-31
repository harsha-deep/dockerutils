import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import DataTable from "./DataTable";

function ServicesView() {
  const [data, setData] = useState([]);
  const [servicePath, setServicePath] = useState(null);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchServices = useCallback(async () => {
    if (!servicePath) {
      setData([]);
      return;
    }
    try {
      const result = await invoke("docker_services", { path: servicePath });
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch services");
    }
  }, [servicePath]);

  const setRowLoading = (key, loading) =>
    setLoadingRows((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });

  const handleBrowse = async () => {
    const dir = await open({
      directory: true,
      multiple: false,
      title: "Select compose directory",
    });
    if (dir) setServicePath(dir);
  };

  const handleStop = async (service) => {
    if (!servicePath) {
      toast.warning("Select the compose folder first");
      return;
    }
    const key = `stop-${service}`;
    setRowLoading(key, true);
    try {
      const stopped = await invoke("docker_compose_stop_service", {
        path: servicePath,
        service,
      });
      toast.success(`Stopped service: ${stopped}`);
      await fetchServices();
    } catch (err) {
      toast.error(`Stop failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const handleRemove = async (service) => {
    if (!servicePath) {
      toast.warning("Select the compose folder first");
      return;
    }
    const key = `remove-${service}`;
    setRowLoading(key, true);
    try {
      const removed = await invoke("docker_compose_remove_service", {
        path: servicePath,
        service,
      });
      toast.success(`Removed service: ${removed}`);
      await fetchServices();
    } catch (err) {
      toast.error(`Remove failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const columns = [
    { header: "Service", accessorKey: "Service" },
    { header: "Image", accessorKey: "Image" },
    { header: "Status", accessorKey: "Status" },
    { header: "Ports", accessorKey: "Ports" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const service = row.original.Service;
        const stopping = loadingRows.has(`stop-${service}`);
        const removing = loadingRows.has(`remove-${service}`);
        const busy = stopping || removing;
        return (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => handleStop(service)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                servicePath
                  ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60"
                  : "bg-gray-200 dark:bg-[#3C3C3C] text-gray-500 dark:text-[#9E9E9E] cursor-not-allowed"
              }`}
            >
              {stopping ? "Stopping…" : "Stop"}
            </button>
            <button
              disabled={busy}
              onClick={() => handleRemove(service)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                servicePath
                  ? "bg-red-500 hover:bg-red-600 text-white disabled:opacity-60"
                  : "bg-gray-200 dark:bg-[#3C3C3C] text-gray-500 dark:text-[#9E9E9E] cursor-not-allowed"
              }`}
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <div className="p-5">
      {/* Compose folder picker */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-white dark:bg-[#252526] rounded-xl shadow-sm">
        <button
          onClick={handleBrowse}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-[#3C3C3C] text-sm font-medium bg-gray-50 dark:bg-[#2D2D2D] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#2A2D2E] transition-colors cursor-pointer"
        >
          Browse
        </button>
        <span
          className={`text-sm font-mono ${
            servicePath
              ? "text-gray-900 dark:text-[#D4D4D4]"
              : "text-gray-400 dark:text-[#9E9E9E]"
          }`}
        >
          {servicePath ?? "No folder selected — pick the folder containing your compose file"}
        </span>
      </div>

      <DataTable data={data} columns={columns} emptyMessage="No services found" />
    </div>
  );
}

export default ServicesView;
