import type { Series, Slot } from './types.ts'

export const SLOT_LABELS: Readonly<Record<Slot, string>> = {
  hull: '艦体',
  stern: '艦尾',
  bow: '艦首',
  bridge: '艦橋',
}

// 系統ラベルは「級」を含まない語幹である。
// パーツ名の導出（SPEC §4.1）で `{系統ラベル} + 級 / 改級 + {部位ラベル}` と連結するため。
// `<optgroup>` のラベル（SPEC §3.2 の「シャーク級」）は `${SERIES_LABELS[s]}級` で組み立てる。
export const SERIES_LABELS: Readonly<Record<Series, string>> = {
  shark: 'シャーク',
  unkiu: 'ウンキウ',
  whale: 'ホエール',
  coelacanth: 'シーラカンス',
  syldra: 'シルドラ',
}
