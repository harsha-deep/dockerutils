import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

function DataTable({ data, columns, emptyMessage = "No data found" }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white dark:bg-[#252526] rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-50 dark:bg-[#2D2D2D] sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-[#D4D4D4] border-b border-gray-200 dark:border-[#3C3C3C]"
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
                className="px-4 py-10 text-center text-gray-500 dark:text-[#9E9E9E]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 dark:hover:bg-[#2A2D2E] transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 border-b border-gray-100 dark:border-[#3C3C3C] text-gray-900 dark:text-[#D4D4D4]"
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
  );
}

export default DataTable;
