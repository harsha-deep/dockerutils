import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import DataTable from "./DataTable";

function VolumesView() {
  const [data, setData] = useState([]);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchVolumes = useCallback(async () => {
    try {
      const result = await invoke("docker_volumes");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch volumes");
    }
  }, []);

  const setRowLoading = (key, loading) =>
    setLoadingRows((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });

  const handleRemove = async (name) => {
    const key = `remove-${name}`;
    setRowLoading(key, true);
    try {
      await invoke("docker_remove_volume", { name });
      toast.success(`Removed volume: ${name}`);
      await fetchVolumes();
    } catch (err) {
      toast.error(`Remove failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const columns = [
    { header: "Name", accessorKey: "Name" },
    { header: "Driver", accessorKey: "Driver" },
    { header: "Scope", accessorKey: "Scope" },
    { header: "Mountpoint", accessorKey: "Mountpoint" },
    { header: "Labels", accessorKey: "Labels" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const name = row.original.Name;
        const removing = loadingRows.has(`remove-${name}`);
        return (
          <button
            disabled={removing}
            onClick={() => handleRemove(name)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        );
      },
    },
  ];

  useEffect(() => {
    fetchVolumes();
  }, [fetchVolumes]);

  return (
    <div className="p-5">
      <DataTable data={data} columns={columns} emptyMessage="No volumes found" />
    </div>
  );
}

export default VolumesView;
