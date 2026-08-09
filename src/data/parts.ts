import type { Series, Slot } from '../domain/types.ts'

// SPEC §4.1 パーツデータ（40件・追加予定なし）
//
// この層は人間が編集する生データである（SPEC §4.2.2）。
// パーツ名は保持しない。系統・改級・部位から導出する（SPEC §4.1、domain/parts.ts）。
// 値が old/parts-data.js と完全一致することは tests/data-integrity/ が保証する（SPEC §8.2.1）。

export type PartRow = {
  readonly slot: Slot
  readonly series: Series
  readonly improved: boolean
  readonly cost: number
  readonly exploration: number
  readonly harvest: number
  readonly surveillance: number
  readonly range: number
  readonly favor: number
}

export const PART_ROWS: readonly PartRow[] = [
  { slot: 'hull', series: 'shark', improved: false, cost: 5, exploration: -10, harvest: 30, surveillance: 20, range: 40, favor: 20 },
  { slot: 'hull', series: 'shark', improved: true, cost: 20, exploration: -5, harvest: 40, surveillance: 25, range: 45, favor: 35 },
  { slot: 'hull', series: 'unkiu', improved: false, cost: 9, exploration: 15, harvest: 10, surveillance: 0, range: 60, favor: 15 },
  { slot: 'hull', series: 'unkiu', improved: true, cost: 20, exploration: 20, harvest: 15, surveillance: 5, range: 65, favor: 25 },
  { slot: 'hull', series: 'whale', improved: false, cost: 12, exploration: -15, harvest: 55, surveillance: 35, range: 15, favor: 20 },
  { slot: 'hull', series: 'whale', improved: true, cost: 20, exploration: -10, harvest: 55, surveillance: 40, range: 20, favor: 30 },
  { slot: 'hull', series: 'coelacanth', improved: false, cost: 14, exploration: 40, harvest: -10, surveillance: 25, range: 40, favor: 25 },
  { slot: 'hull', series: 'coelacanth', improved: true, cost: 20, exploration: 40, harvest: -5, surveillance: 30, range: 40, favor: 30 },
  { slot: 'hull', series: 'syldra', improved: false, cost: 17, exploration: 10, harvest: 75, surveillance: 30, range: -15, favor: 5 },
  { slot: 'hull', series: 'syldra', improved: true, cost: 20, exploration: 10, harvest: 80, surveillance: 30, range: -15, favor: 10 },
  { slot: 'stern', series: 'shark', improved: false, cost: 5, exploration: -30, harvest: 20, surveillance: 60, range: 30, favor: 15 },
  { slot: 'stern', series: 'shark', improved: true, cost: 20, exploration: -25, harvest: 25, surveillance: 70, range: 35, favor: 25 },
  { slot: 'stern', series: 'unkiu', improved: false, cost: 9, exploration: 15, harvest: 0, surveillance: 30, range: 40, favor: 25 },
  { slot: 'stern', series: 'unkiu', improved: true, cost: 20, exploration: 20, harvest: 5, surveillance: 35, range: 45, favor: 35 },
  { slot: 'stern', series: 'whale', improved: false, cost: 12, exploration: 15, harvest: 20, surveillance: 0, range: 55, favor: 15 },
  { slot: 'stern', series: 'whale', improved: true, cost: 20, exploration: 20, harvest: 20, surveillance: 5, range: 60, favor: 20 },
  { slot: 'stern', series: 'coelacanth', improved: false, cost: 14, exploration: 10, harvest: 25, surveillance: 35, range: 25, favor: 25 },
  { slot: 'stern', series: 'coelacanth', improved: true, cost: 20, exploration: 10, harvest: 25, surveillance: 40, range: 30, favor: 30 },
  { slot: 'stern', series: 'syldra', improved: false, cost: 17, exploration: 20, harvest: 60, surveillance: 35, range: -15, favor: 5 },
  { slot: 'stern', series: 'syldra', improved: true, cost: 20, exploration: 20, harvest: 60, surveillance: 35, range: -10, favor: 10 },
  { slot: 'bow', series: 'shark', improved: false, cost: 5, exploration: 50, harvest: 40, surveillance: 10, range: -20, favor: 15 },
  { slot: 'bow', series: 'shark', improved: true, cost: 20, exploration: 55, harvest: 50, surveillance: 15, range: -15, favor: 25 },
  { slot: 'bow', series: 'unkiu', improved: false, cost: 9, exploration: 60, harvest: 20, surveillance: 20, range: -15, favor: 10 },
  { slot: 'bow', series: 'unkiu', improved: true, cost: 20, exploration: 65, harvest: 25, surveillance: 25, range: -10, favor: 20 },
  { slot: 'bow', series: 'whale', improved: false, cost: 12, exploration: 25, harvest: 60, surveillance: -15, range: 20, favor: 15 },
  { slot: 'bow', series: 'whale', improved: true, cost: 20, exploration: 25, harvest: 65, surveillance: -10, range: 25, favor: 25 },
  { slot: 'bow', series: 'coelacanth', improved: false, cost: 14, exploration: 65, harvest: 10, surveillance: -10, range: 30, favor: 0 },
  { slot: 'bow', series: 'coelacanth', improved: true, cost: 20, exploration: 70, harvest: 15, surveillance: -10, range: 30, favor: 5 },
  { slot: 'bow', series: 'syldra', improved: false, cost: 17, exploration: 45, harvest: 30, surveillance: -15, range: 40, favor: 40 },
  { slot: 'bow', series: 'syldra', improved: true, cost: 20, exploration: 45, harvest: 30, surveillance: -10, range: 40, favor: 40 },
  { slot: 'bridge', series: 'shark', improved: false, cost: 5, exploration: 20, harvest: 20, surveillance: 20, range: 20, favor: 20 },
  { slot: 'bridge', series: 'shark', improved: true, cost: 20, exploration: 25, harvest: 25, surveillance: 30, range: 25, favor: 35 },
  { slot: 'bridge', series: 'unkiu', improved: false, cost: 9, exploration: 25, harvest: 5, surveillance: 25, range: 30, favor: 30 },
  { slot: 'bridge', series: 'unkiu', improved: true, cost: 20, exploration: 30, harvest: 10, surveillance: 30, range: 35, favor: 40 },
  { slot: 'bridge', series: 'whale', improved: false, cost: 12, exploration: 0, harvest: 25, surveillance: 20, range: 45, favor: 40 },
  { slot: 'bridge', series: 'whale', improved: true, cost: 20, exploration: 0, harvest: 30, surveillance: 25, range: 50, favor: 45 },
  { slot: 'bridge', series: 'coelacanth', improved: false, cost: 14, exploration: 55, harvest: 20, surveillance: 35, range: -15, favor: 50 },
  { slot: 'bridge', series: 'coelacanth', improved: true, cost: 20, exploration: 60, harvest: 20, surveillance: 35, range: -10, favor: 55 },
  { slot: 'bridge', series: 'syldra', improved: false, cost: 17, exploration: 55, harvest: 20, surveillance: -5, range: 30, favor: 60 },
  { slot: 'bridge', series: 'syldra', improved: true, cost: 20, exploration: 60, harvest: 20, surveillance: -5, range: 30, favor: 60 },
]
