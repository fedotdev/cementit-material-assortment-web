'use client'

import { Tabs } from '@heroui/react'
import type { ReactNode } from 'react'

export function ItemTabs({
  paramsPanel,
  standardsPanel,
  availabilityPanel,
  recordPanel,
}: {
  paramsPanel: ReactNode
  standardsPanel: ReactNode
  availabilityPanel: ReactNode
  recordPanel: ReactNode
}) {
  return (
    <Tabs defaultSelectedKey="params">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Разделы карточки">
          <Tabs.Tab id="params">
            Характеристики
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="standards">
            Стандарты и аналоги
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="availability">
            Доступность
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="record">
            Запись в КД
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="params">{paramsPanel}</Tabs.Panel>
      <Tabs.Panel id="standards">{standardsPanel}</Tabs.Panel>
      <Tabs.Panel id="availability">{availabilityPanel}</Tabs.Panel>
      <Tabs.Panel id="record">{recordPanel}</Tabs.Panel>
    </Tabs>
  )
}
