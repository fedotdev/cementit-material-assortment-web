import Link from 'next/link'

type MaterialRow = {
  id: number
  name: string
  normalizedName: string
  materialClass: string | null
  industrialUse: string | null
  weldability: string | null
  verificationStatus: string
  analogueCount: number
  standardCount: number
}

export function MaterialCatalogTable({ rows, section }: { rows: MaterialRow[]; section: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-4xl border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-secondary text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Марка</th>
            <th className="px-4 py-3 font-medium">Класс</th>
            <th className="px-4 py-3 font-medium">Применение</th>
            <th className="px-4 py-3 font-medium">Свариваемость</th>
            <th className="px-4 py-3 text-right font-medium">Аналоги</th>
            <th className="px-4 py-3 text-right font-medium">Стандарты</th>
            <th className="px-4 py-3 font-medium">Статус данных</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((material) => (
            <tr key={material.id} className="border-b border-border last:border-b-0 hover:bg-surface-secondary/60">
              <td className="px-4 py-3">
                <Link className="font-mono font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" href={`/materials/${section}/${encodeURIComponent(material.normalizedName.toLowerCase())}`}>
                  {material.name}
                </Link>
              </td>
              <td className="max-w-48 px-4 py-3 text-xs text-muted">{material.materialClass || 'Не указан'}</td>
              <td className="max-w-sm px-4 py-3 text-xs leading-relaxed text-muted">{material.industrialUse || 'Нет данных в демо-источнике'}</td>
              <td className="px-4 py-3 text-xs text-muted">{material.weldability || 'Не указана'}</td>
              <td className="px-4 py-3 text-right font-mono text-xs">{material.analogueCount} аналогов</td>
              <td className="px-4 py-3 text-right font-mono text-xs">{material.standardCount} упоминаний</td>
              <td className="px-4 py-3"><span className="inline-flex rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">Требует проверки</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
