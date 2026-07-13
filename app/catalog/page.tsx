import { Card } from '@heroui/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ProfileSketch } from '@/components/profile-sketch'
import { getCategories } from '@/lib/queries'
import type { ProfileType } from '@/lib/profile-config'

export const metadata: Metadata = {
  title: 'Каталог сортаментов — Цементит',
  description: 'Двутавры, швеллеры, уголки, трубы, круг, квадрат и лист по действующим ГОСТ.',
}

export default async function CatalogPage() {
  const cats = await getCategories()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Каталог сортаментов</h1>
      <p className="mt-1 text-sm text-muted">
        Выберите вид проката — внутри плотная таблица типоразмеров с фильтрами.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((cat) => (
          <Link key={cat.id} href={`/catalog/${cat.slug}`} className="group">
            <Card className="h-full transition-colors group-hover:border-accent">
              <Card.Content className="flex items-start gap-4 p-4">
                <div className="size-20 shrink-0 rounded-lg border border-border bg-surface-secondary p-1">
                  <ProfileSketch type={cat.profileType as ProfileType} className="size-full" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-medium leading-snug">{cat.name}</span>
                  <span className="text-xs leading-relaxed text-muted">{cat.description}</span>
                </div>
              </Card.Content>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
