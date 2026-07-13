import type { Metadata } from 'next'
import { BySizeFinder, type CategoryOption } from '@/components/by-size-finder'
import { getCategories } from '@/lib/queries'
import type { ProfileType } from '@/lib/profile-config'

export const metadata: Metadata = {
  title: 'Подбор по размерам — Цементит',
  description:
    'Введите известные размеры сечения — сервис подберёт ближайшие стандартные типоразмеры проката.',
}

export default async function BySizePage() {
  const cats = await getCategories()
  const options: CategoryOption[] = cats.map((c) => ({
    slug: c.slug,
    name: c.name,
    profileType: c.profileType as ProfileType,
  }))

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Подбор по размерам</h1>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
        Знаете размеры, но не помните обозначение? Выберите вид профиля, введите размеры
        на эскизе — получите точные и ближайшие стандартные типоразмеры.
      </p>
      <div className="mt-6">
        <BySizeFinder categories={options} />
      </div>
    </div>
  )
}
