import Link from 'next/link'
import { HomeSearch } from '@/components/home-search'
import { ProfileSketch } from '@/components/profile-sketch'
import { getCategories, getCounts } from '@/lib/queries'
import type { ProfileType } from '@/lib/profile-config'
import { Grid3x3, Ruler } from 'lucide-react'

export default async function HomePage() {
  const [cats, counts] = await Promise.all([getCategories(), getCounts()])

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          Справочник сортаментов металлопроката
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-pretty text-muted">
          ГОСТ и международный аналог на каждой карточке, статусы актуальности стандартов и
          закупочная доступность каждого типоразмера.
        </p>

        <HomeSearch />

        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <Link
            href="/catalog"
            className="group flex flex-col items-start gap-4 rounded-lg border border-border bg-surface-secondary p-6 transition-all hover:border-accent hover:bg-surface"
          >
            <div className="rounded-lg bg-surface p-3 group-hover:text-accent">
              <Grid3x3 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">По ассортименту</h2>
              <p className="mt-1 text-sm text-muted">Выберите категорию проката и ознакомьтесь с полным сортаментом</p>
            </div>
          </Link>

          <Link
            href="/by-size"
            className="group flex flex-col items-start gap-4 rounded-lg border border-border bg-surface-secondary p-6 transition-all hover:border-accent hover:bg-surface"
          >
            <div className="rounded-lg bg-surface p-3 group-hover:text-accent">
              <Ruler size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">По размерам</h2>
              <p className="mt-1 text-sm text-muted">Укажите требуемые размеры и найдите подходящий типоразмер</p>
            </div>
          </Link>
        </div>

        <dl className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-2 font-mono text-sm text-muted">
          <div className="flex items-baseline gap-2">
            <dd className="text-xl font-semibold text-foreground">{counts.sizes}</dd>
            <dt>типоразмеров</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dd className="text-xl font-semibold text-foreground">{counts.standards}</dd>
            <dt>стандартов</dt>
          </div>
          <div className="flex items-baseline gap-2">
            <dd className="text-xl font-semibold text-foreground">{counts.grades}</dd>
            <dt>марок стали</dt>
          </div>
        </dl>
      </section>

      <section aria-labelledby="cats-h" className="pb-16">
        <h2 id="cats-h" className="text-lg font-semibold tracking-tight">
          Категории проката
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog/${cat.slug}`}
              className="group flex flex-col gap-2 rounded-lg border border-border p-4 transition-colors hover:border-accent"
            >
              <div className="size-16 rounded-md border border-border bg-surface-secondary p-1">
                <ProfileSketch type={cat.profileType as ProfileType} className="size-full" />
              </div>
              <span className="text-sm font-medium leading-snug group-hover:text-accent">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
