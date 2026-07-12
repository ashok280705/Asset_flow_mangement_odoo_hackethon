import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
  keyField?: string
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No data found',
  className,
  keyField = 'id',
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#eceae4] bg-[#faf9f6]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left text-[11px] font-semibold text-[#8c8a80] uppercase tracking-wider px-4 py-3',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0eee9]">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-[#8c8a80] py-12"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={String(row[keyField]) || i}
                className="hover:bg-[#faf9f6] transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 text-[#57564f]', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
