import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";

function ImagesView() {
  const [data, setData] = useState([]);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchImages = useCallback(async () => {
    try {
      const result = await invoke("docker_images");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch images");
    }
  }, []);

  const setRowLoading = (key, loading) =>
    setLoadingRows((prev) => {
      const next = new Set(prev);
      loading ? next.add(key) : next.delete(key);
      return next;
    });

  const handleDelete = async (id, label) => {
    const key = `delete-${id}`;
    setRowLoading(key, true);
    try {
      await invoke("docker_delete_image", { id });
      toast.success(`Deleted image: ${label}`);
      await fetchImages();
    } catch (err) {
      toast.error(`Delete failed: ${err}`);
    } finally {
      setRowLoading(key, false);
    }
  };

  const columns = [
    { header: "Repository", accessorKey: "Repository" },
    { header: "Tag", accessorKey: "Tag" },
    { header: "ID", accessorKey: "ID" },
    { header: "Created", accessorKey: "CreatedSince" },
    { header: "Size", accessorKey: "Size" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const id = row.original.ID;
        const label =
          row.original.Repository !== "<none>"
            ? `${row.original.Repository}:${row.original.Tag}`
            : id;
        const deleting = loadingRows.has(`delete-${id}`);
        return (
          <button
            disabled={deleting}
            onClick={() => handleDelete(id, label)}
            className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        );
      },
    },
  ];

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

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
                  No images found
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

export default ImagesView;
