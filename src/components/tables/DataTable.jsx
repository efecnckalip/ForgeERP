import React from "react";

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = "Kayıt bulunamadı.",
  className = "",
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/80 text-slate-400">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key || column.accessor || column.header}
                  className="whitespace-nowrap px-4 py-3 text-left font-semibold"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length || 1}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="transition hover:bg-slate-900/70"
                >
                  {columns.map((column) => {
                    const value = column.accessor
                      ? row[column.accessor]
                      : row[column.key];

                    return (
                      <td
                        key={column.key || column.accessor || column.header}
                        className="whitespace-nowrap px-4 py-3 text-slate-300"
                      >
                        {column.render
                          ? column.render(value, row, rowIndex)
                          : value ?? "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}