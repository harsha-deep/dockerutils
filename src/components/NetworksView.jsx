import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import DataTable from "./DataTable";

const BUILTIN_NETWORKS = new Set(["bridge", "host", "none"]);

function NetworksView() {
  const [data, setData] = useState([]);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchNetworks = useCallback(async () => {
    try {
      const result = await invoke("docker_networks");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch networks");
    }
  }, []);

  const setRowLoading = (key, loading) =>
    setLoadingRows((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });

  const handleRemove = async (id, name) => {
    const key = `remove-${id}`;
    setRowLoading(key, true);
    try {
      await invoke("docker_remove_network", { id });
      toast.success(`Removed network: ${name}`);
      await fetchNetworks();
    } catch (err) {
      toast.error(`Remove failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const columns = [
    { header: "ID", accessorKey: "ID" },
    { header: "Name", accessorKey: "Name" },
    { header: "Driver", accessorKey: "Driver" },
    { header: "Scope", accessorKey: "Scope" },
    { header: "IPv6", accessorKey: "IPv6" },
    { header: "Internal", accessorKey: "Internal" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.ID;
        const name = row.original.Name;
        const isBuiltin = BUILTIN_NETWORKS.has(name);
        const removing = loadingRows.has(`remove-${id}`);
        return (
          <button
            disabled={isBuiltin || removing}
            onClick={() => handleRemove(id, name)}
            title={isBuiltin ? "Built-in network cannot be removed" : undefined}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        );
      },
    },
  ];

  useEffect(() => {
    fetchNetworks();
  }, [fetchNetworks]);

  return (
    <div className="p-5">
      <DataTable data={data} columns={columns} emptyMessage="No networks found" />
    </div>
  );
}

export default NetworksView;
