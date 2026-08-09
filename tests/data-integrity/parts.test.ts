import { describe, expect, it } from 'vitest'
import { PART_ROWS } from '../../src/data/parts.ts'
import { SLOT_LABELS } from '../../src/domain/labels.ts'
import { derivePartName } from '../../src/domain/parts.ts'
import { SERIES, SLOTS, STAT_KEYS } from '../../src/domain/types.ts'
import { loadOldParts } from './load-old-data.ts'

const oldParts = loadOldParts()

// SPEC §8.2.1 パーツ（40件固定）
describe('パーツデータの整合性', () => {
  it('4部位 × 10件 = 40件である', () => {
    expect(PART_ROWS).toHaveLength(40)
    for (const slot of SLOTS) {
      expect(PART_ROWS.filter((row) => row.slot === slot), slot).toHaveLength(10)
    }
  })

  it('旧データ側も40件である（一対一対応の前提）', () => {
    const oldCount = Object.values(oldParts).reduce((sum, list) => sum + list.length, 0)
    expect(oldCount).toBe(40)
  })

  it('各部位に 5系統 × (通常級/改級) が過不足なく存在する', () => {
    const expected = SERIES.flatMap((series) => [`${series}/通常`, `${series}/改`]).sort()
    for (const slot of SLOTS) {
      const actual = PART_ROWS.filter((row) => row.slot === slot)
        .map((row) => `${row.series}/${row.improved ? '改' : '通常'}`)
        .sort()
      expect(actual, slot).toEqual(expected)
    }
  })

  it('cost と5ステータスが旧データと完全一致する', () => {
    for (const row of PART_ROWS) {
      const name = derivePartName(row.series, row.improved, row.slot)
      const slotLabel = SLOT_LABELS[row.slot]
      const old = oldParts[slotLabel]?.find((part) => part.name === name)
      if (old === undefined) throw new Error(`旧データの「${slotLabel}」に ${name} が存在しない`)

      expect(row.cost, `${name} の cost`).toBe(old.cost)
      for (const key of STAT_KEYS) {
        expect(row[key], `${name} の ${key}`).toBe(old[key])
      }
    }
  })

  // SPEC §4.1: パーツ名は保持せず導出する。
  // 導出結果が旧データの40件と完全一致することをここで保証する。
  it('導出したパーツ名が旧データの name と完全一致する', () => {
    const derived = PART_ROWS.map((row) => derivePartName(row.series, row.improved, row.slot))
    expect(new Set(derived).size, '導出名に重複がない').toBe(40)

    const oldNames = Object.values(oldParts).flatMap((list) => list.map((part) => part.name))
    expect([...derived].sort()).toEqual([...oldNames].sort())
  })

  it('導出したパーツ名が旧データの部位ごとの name と一致する', () => {
    for (const slot of SLOTS) {
      const derived = PART_ROWS.filter((row) => row.slot === slot)
        .map((row) => derivePartName(row.series, row.improved, row.slot))
        .sort()
      const oldNames = (oldParts[SLOT_LABELS[slot]] ?? []).map((part) => part.name).sort()
      expect(derived, slot).toEqual(oldNames)
    }
  })
})
