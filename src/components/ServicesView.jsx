import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";

function ServicesView() {
  const [data, setData] = useState([]);
  const [servicePath, setServicePath] = useState(null);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchServices = useCallback(async () => {
    try {
      const result = await invoke("docker_services");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch services");
    }
  }, []);

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
    { header: "Name", accessorKey: "Name" },
    { header: "Mode", accessorKey: "Mode" },
    { header: "Replicas", accessorKey: "Replicas" },
    { header: "Image", accessorKey: "Image" },
    { header: "Ports", accessorKey: "Ports" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const service = row.original.Name;
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
                  : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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
                  : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-5">
      {/* Compose folder picker */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <button
          onClick={handleBrowse}
          className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          Browse
        </button>
        <span
          className={`text-sm font-mono ${
            servicePath
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {servicePath ?? "No folder selected — pick the folder containing your compose file"}
        </span>
      </div>

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
                  No services found
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

export default ServicesView;
