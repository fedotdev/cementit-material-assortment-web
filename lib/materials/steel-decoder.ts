export type DecodedToken = {
  token: string
  kind: 'carbon' | 'element' | 'quality' | 'process' | 'class'
  meaning: string
  approximatePercent?: number
}

const ELEMENTS: Record<string, string> = {
  С: 'кремний', Г: 'марганец', Н: 'никель', М: 'молибден', П: 'фосфор',
  Х: 'хром', К: 'кобальт', Т: 'титан', Ю: 'алюминий', Д: 'медь',
  В: 'вольфрам', Ф: 'ванадий', Р: 'бор', А: 'азот или признак качества', Ц: 'цирконий',
}

const PROCESSES: Record<string, string> = {
  ВД: 'вакуумно-дуговой переплав', ВИ: 'вакуумно-индукционная выплавка',
  ЭЛ: 'электронно-лучевой переплав', Ш: 'электрошлаковый переплав',
  ШД: 'электрошлаковый и затем вакуумно-дуговой переплав',
  ПД: 'плазменная выплавка и затем вакуумно-дуговой переплав',
  ИШ: 'вакуумно-индукционная выплавка и затем электрошлаковый переплав',
}

export function normalizeGradeName(value: string) {
  const lookalikes: Record<string, string> = { A: 'А', B: 'В', C: 'С', E: 'Е', H: 'Н', K: 'К', M: 'М', O: 'О', P: 'Р', T: 'Т', X: 'Х' }
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[ABCEHKMOPTX]/g, (letter) => lookalikes[letter] ?? letter)
}

export function decodeSteelGrade(input: string) {
  const grade = normalizeGradeName(input)
  const tokens: DecodedToken[] = []
  const [base, process] = grade.split('-', 2)

  if (/^СТ\d/.test(base)) {
    tokens.push({ token: 'Ст', kind: 'class', meaning: 'сталь обыкновенного качества' })
  } else if (/^С\d{3}/.test(base)) {
    tokens.push({ token: 'С', kind: 'class', meaning: 'строительная сталь; число обозначает минимальный предел текучести' })
  } else if (/^У\d/.test(base)) {
    tokens.push({ token: 'У', kind: 'class', meaning: 'инструментальная углеродистая сталь' })
  } else if (/^Р\d/.test(base)) {
    tokens.push({ token: 'Р', kind: 'class', meaning: 'быстрорежущая сталь; следующее число — среднее содержание вольфрама' })
  } else if (/^ШХ/.test(base)) {
    tokens.push({ token: 'Ш', kind: 'class', meaning: 'подшипниковая сталь' })
  }

  const carbon = base.match(/^(\d{1,2})(?=[А-Я])/)
  if (carbon && !/^(?:СТ|С\d{3}|Р|ШХ)/.test(base)) {
    tokens.push({ token: carbon[1], kind: 'carbon', meaning: `среднее содержание углерода около ${Number(carbon[1]) / 100}%`, approximatePercent: Number(carbon[1]) / 100 })
  }

  const body = base.slice(carbon?.[1].length ?? 0)
  for (const match of body.matchAll(/([А-Я])([0-9]{1,2})?/g)) {
    const letter = match[1]
    if (!ELEMENTS[letter] || (letter === 'А' && match.index === body.length - 1)) continue
    const amount = match[2] ? Number(match[2]) : undefined
    tokens.push({
      token: match[0], kind: 'element',
      meaning: amount ? `${ELEMENTS[letter]}, около ${amount}%` : `${ELEMENTS[letter]}, как правило до 1,5%`,
      approximatePercent: amount,
    })
  }

  if (base.endsWith('А')) tokens.push({ token: 'А', kind: 'quality', meaning: 'высококачественная сталь с ограниченным содержанием серы и фосфора' })
  if (base.endsWith('Л')) tokens.push({ token: 'Л', kind: 'class', meaning: 'литейная сталь' })
  if (/(КП|ПС|СП)$/i.test(base)) {
    const suffix = base.slice(-2).toLowerCase()
    tokens.push({ token: suffix, kind: 'quality', meaning: ({ кп: 'кипящая', пс: 'полуспокойная', сп: 'спокойная' } as const)[suffix as 'кп' | 'пс' | 'сп'] })
  }
  if (process) tokens.push({ token: process, kind: 'process', meaning: PROCESSES[process] ?? 'специальный способ выплавки или переплава; требуется сверка с нормативным документом' })

  return {
    grade,
    tokens,
    summary: tokens.length ? tokens.map((item) => `${item.token}: ${item.meaning}`).join('; ') : 'Автоматическая расшифровка не определена; требуется проверка по нормативному документу.',
    source: 'Справка «Расшифровка марок сталей», ИСС «Техэксперт»',
    status: 'reference_interpretation' as const,
  }
}
