import { PART_ROWS } from '../data/parts.ts'
import { SERIES_LABELS, SLOT_LABELS } from './labels.ts'
import { mapStats, SERIES, SLOTS } from './types.ts'
import type { Part, Series, Slot } from './types.ts'

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

export function derivePartId(series: Series, improved: boolean, slot: Slot): string {
  return `${series}-${improved ? 'kai' : 'std'}-${slot}`
}

export const PARTS: readonly Part[] = PART_ROWS.map((row) => ({
  id: derivePartId(row.series, row.improved, row.slot),
  slot: row.slot,
  series: row.series,
  improved: row.improved,
  name: derivePartName(row.series, row.improved, row.slot),
  cost: row.cost,
  stats: mapStats((key) => row[key]),
}))

const PARTS_BY_ID: ReadonlyMap<string, Part> = new Map(PARTS.map((part) => [part.id, part]))

export function findPartById(id: string): Part | null {
  return PARTS_BY_ID.get(id) ?? null
}

/** `<optgroup>` 1つ分（SPEC §3.2） */
export type SeriesGroup = {
  readonly series: Series
  /** optgroup のラベル。系統名（例: `シャーク級`） */
  readonly label: string
  /** 系統内は「通常級 → 改級」の順 */
  readonly parts: readonly Part[]
}

// SPEC §3.2: **表示順序は配列の並び順に依存させない。**
// 系統順は SERIES 定数の定義順、通常級/改級の順は improved フラグから決定的に導出する。
function buildSeriesGroups(slot: Slot): readonly SeriesGroup[] {
  return SERIES.map((series) => ({
    series,
    label: `${SERIES_LABELS[series]}級`,
    parts: [false, true]
      .map((improved) =>
        PARTS.find((part) => part.slot === slot && part.series === series && part.improved === improved),
      )
      .filter((part): part is Part => part !== undefined),
  }))
}

const SERIES_GROUPS_BY_SLOT: Readonly<Record<Slot, readonly SeriesGroup[]>> = Object.fromEntries(
  SLOTS.map((slot) => [slot, buildSeriesGroups(slot)]),
) as Readonly<Record<Slot, readonly SeriesGroup[]>>

export function seriesGroupsForSlot(slot: Slot): readonly SeriesGroup[] {
  return SERIES_GROUPS_BY_SLOT[slot]
}

/** 部位内の全パーツを表示順（系統順 → 通常級/改級）で返す */
export function partsForSlot(slot: Slot): readonly Part[] {
  return seriesGroupsForSlot(slot).flatMap((group) => group.parts)
}
