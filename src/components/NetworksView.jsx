import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";

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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-5">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-gray-500 dark:text-gray-400"
                >
                  No networks found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      {flexRender(
                        cell.column.columnDef.cell ??
                          cell.column.columnDef.accessorKey,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default NetworksView;
