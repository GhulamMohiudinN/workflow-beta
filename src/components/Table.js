"use client";

import { colors } from "../theme";

/**
 * Table Component
 * Reusable data table
 */
export const Table = ({ columns, data, actions = null, striped = true }) => {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr
            className="border-b-2"
            style={{ borderColor: colors.neutral[200] }}
          >
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b transition-colors ${
                  striped && idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-gray-100`}
                style={{ borderColor: colors.neutral[200] }}
              >
                {columns.map((col) => (
                  <td
                    key={`${idx}-${col.key}`}
                    className="px-6 py-4 text-sm text-gray-700"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 text-sm space-x-2 flex">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
