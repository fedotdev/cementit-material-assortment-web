import { Chip } from '@heroui/react'
import { AVAILABILITY_LABEL, STATUS_LABEL } from '@/lib/profile-config'

export function StandardStatusChip({ status }: { status: string }) {
  const color =
    status === 'active'
      ? 'success'
      : status === 'replaced' || status === 'withdrawn' || status === 'cancelled'
        ? 'warning'
        : 'danger'
  return (
    <Chip color={color} variant="soft" size="sm">
      <Chip.Label>{STATUS_LABEL[status] ?? status}</Chip.Label>
    </Chip>
  )
}

export function AvailabilityChip({ availability }: { availability: string }) {
  const color =
    availability === 'high'
      ? 'success'
      : availability === 'medium'
        ? 'default'
        : availability === 'low'
          ? 'warning'
          : 'danger'
  return (
    <Chip color={color} variant="soft" size="sm">
      <Chip.Label>{AVAILABILITY_LABEL[availability] ?? availability}</Chip.Label>
    </Chip>
  )
}
