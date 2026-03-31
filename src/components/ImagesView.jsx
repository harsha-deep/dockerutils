import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import DataTable from "./DataTable";

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

  return (
    <div className="p-5">
      <DataTable data={data} columns={columns} emptyMessage="No images found" />
    </div>
  );
}

export default ImagesView;
