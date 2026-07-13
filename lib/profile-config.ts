export type ProfileType =
  | 'i-beam'
  | 'channel'
  | 'angle'
  | 'pipe'
  | 'round'
  | 'square'
  | 'sheet'

export type DimKey = 'dim1' | 'dim2' | 'dim3' | 'dim4' | 'massPerM'

export interface ColumnDef {
  key: DimKey
  label: string
  /** Буква размера на эскизе */
  dimLetter?: string
}

export interface ProfileConfig {
  /** Колонки таблицы размеров */
  columns: ColumnDef[]
  /** Размеры, вводимые в режиме «по размерам» */
  sizeInputs: { key: DimKey; label: string; letter: string }[]
  massLabel: string
}

export const PROFILE_CONFIG: Record<ProfileType, ProfileConfig> = {
  'i-beam': {
    columns: [
      { key: 'dim1', label: 'h, мм', dimLetter: 'h' },
      { key: 'dim2', label: 'b, мм', dimLetter: 'b' },
      { key: 'dim3', label: 's, мм', dimLetter: 's' },
      { key: 'dim4', label: 't, мм', dimLetter: 't' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [
      { key: 'dim1', label: 'Высота h, мм', letter: 'h' },
      { key: 'dim2', label: 'Ширина полки b, мм', letter: 'b' },
    ],
    massLabel: 'кг/м',
  },
  channel: {
    columns: [
      { key: 'dim1', label: 'h, мм', dimLetter: 'h' },
      { key: 'dim2', label: 'b, мм', dimLetter: 'b' },
      { key: 'dim3', label: 's, мм', dimLetter: 's' },
      { key: 'dim4', label: 't, мм', dimLetter: 't' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [
      { key: 'dim1', label: 'Высота h, мм', letter: 'h' },
      { key: 'dim2', label: 'Ширина полки b, мм', letter: 'b' },
    ],
    massLabel: 'кг/м',
  },
  angle: {
    columns: [
      { key: 'dim1', label: 'b, мм', dimLetter: 'b' },
      { key: 'dim3', label: 't, мм', dimLetter: 't' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [
      { key: 'dim1', label: 'Полка b, мм', letter: 'b' },
      { key: 'dim3', label: 'Толщина t, мм', letter: 't' },
    ],
    massLabel: 'кг/м',
  },
  pipe: {
    columns: [
      { key: 'dim1', label: 'D, мм', dimLetter: 'D' },
      { key: 'dim2', label: 't, мм', dimLetter: 't' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [
      { key: 'dim1', label: 'Наружный диаметр D, мм', letter: 'D' },
      { key: 'dim2', label: 'Стенка t, мм', letter: 't' },
    ],
    massLabel: 'кг/м',
  },
  round: {
    columns: [
      { key: 'dim1', label: 'd, мм', dimLetter: 'd' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [{ key: 'dim1', label: 'Диаметр d, мм', letter: 'd' }],
    massLabel: 'кг/м',
  },
  square: {
    columns: [
      { key: 'dim1', label: 'a, мм', dimLetter: 'a' },
      { key: 'massPerM', label: 'Масса, кг/м' },
    ],
    sizeInputs: [{ key: 'dim1', label: 'Сторона a, мм', letter: 'a' }],
    massLabel: 'кг/м',
  },
  sheet: {
    columns: [
      { key: 'dim1', label: 't, мм', dimLetter: 't' },
      { key: 'dim2', label: 'Ширина, мм' },
      { key: 'dim3', label: 'Длина, мм' },
      { key: 'massPerM', label: 'Масса, кг/м²' },
    ],
    sizeInputs: [{ key: 'dim1', label: 'Толщина t, мм', letter: 't' }],
    massLabel: 'кг/м²',
  },
}

/**
 * Позиции полей ввода на размерных линиях эскиза (в % от стороны квадрата viewBox 200x200).
 * Используются в режиме «по размерам» для наложения инпутов прямо на чертёж.
 */
export const SKETCH_ANCHORS: Record<ProfileType, Record<string, { x: number; y: number }>> = {
  'i-beam': { h: { x: 13, y: 52 }, b: { x: 50, y: 9 } },
  channel: { h: { x: 16, y: 52 }, b: { x: 51, y: 9 } },
  angle: { b: { x: 55, y: 95 }, t: { x: 46, y: 15 } },
  pipe: { D: { x: 50, y: 42 }, t: { x: 62, y: 80 } },
  round: { d: { x: 50, y: 42 } },
  square: { a: { x: 50, y: 93 } },
  sheet: { t: { x: 14, y: 76 } },
}

export const AVAILABILITY_LABEL: Record<string, string> = {
  high: 'Массовая позиция',
  medium: 'Обычно в наличии',
  low: 'Под заказ',
  none: 'Не поставляется',
}

export const STATUS_LABEL: Record<string, string> = {
  active: 'Действует',
  replaced: 'Заменён',
  cancelled: 'Отменён',
  withdrawn: 'Отменён',
  unknown: 'Стандарт не определён',
  needs_review: 'Требует проверки',
}
