import { useEffect, useState, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import DataTable from "./DataTable";

function ImagesView() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(new Set());

  const fetchImages = useCallback(async () => {
    try {
      const result = await invoke("docker_images");
      setData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch images");
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

  const totalSize = useMemo(() => {
    const toBytes = (sizeStr) => {
      if (!sizeStr) return 0;
      const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|kB|MB|GB|TB)?$/i);
      if (!match) return 0;
      const n = parseFloat(match[1]);
      const unit = (match[2] ?? "B").toUpperCase();
      const units = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 };
      return n * (units[unit] ?? 1);
    };
    const bytes = data.reduce((sum, img) => sum + toBytes(img.Size), 0);
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
    if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3)  return `${(bytes / 1e3).toFixed(2)} kB`;
    return `${bytes} B`;
  }, [data]);

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
      {!loading && data.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-[#9E9E9E]">
          <span>{data.length} image{data.length !== 1 ? "s" : ""}</span>
          <span className="text-gray-300 dark:text-[#3C3C3C]">·</span>
          <span>Total size: <span className="font-semibold text-gray-800 dark:text-[#D4D4D4]">{totalSize}</span></span>
        </div>
      )}
      <DataTable data={data} columns={columns} loading={loading} emptyMessage="No images found" />
    </div>
  );
}

export default ImagesView;
