import { SERIES_LABELS, SLOT_LABELS } from './labels.ts'
import type { Series, Slot } from './types.ts'

// SPEC §4.1: パーツ名は保持せず導出する。
//
//   name = {系統ラベル} + (improved ? "改級" : "級") + {部位ラベル}
//   例: シャーク + 級   + 艦体 = "シャーク級艦体"
//       シャーク + 改級 + 艦体 = "シャーク改級艦体"
//
// 導出結果が旧データの40件と完全一致することはテストで保証する（SPEC §8.2.1）。
export function derivePartName(series: Series, improved: boolean, slot: Slot): string {
  return `${SERIES_LABELS[series]}${improved ? '改級' : '級'}${SLOT_LABELS[slot]}`
}
