import React from "react";

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = "Kayıt bulunamadı.",
  className = "",
}) {
  return (
    <div
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-slate-800
        bg-slate-900
        ${className}
      `}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-5
                    py-3
                    text-left
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-400
                    ${column.className || ""}
                  `}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-slate-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className="
                    border-t
                    border-slate-800
                    transition-colors
                    hover:bg-slate-800/50
                    even:bg-slate-900
                    odd:bg-slate-950/40
                  "
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        whitespace-nowrap
                        px-5
                        py-4
                        text-sm
                        text-slate-200
                        ${column.cellClassName || ""}
                      `}
                    >
                      {column.render
                        ? column.render(row)
                        : row[column.key]}
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