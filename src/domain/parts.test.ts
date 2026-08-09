import { describe, expect, it } from 'vitest'
import { SLOT_LABELS } from './labels.ts'
import { derivePartId, derivePartName, findPartById, PARTS, partsForSlot, seriesGroupsForSlot } from './parts.ts'
import { SERIES, SLOTS } from './types.ts'

describe('derivePartName（SPEC §4.1 パーツ名の導出）', () => {
  it('系統 × 改級 × 部位から正しい名前を生成する', () => {
    expect(derivePartName('shark', false, 'hull')).toBe('シャーク級艦体')
    expect(derivePartName('shark', true, 'hull')).toBe('シャーク改級艦体')
    expect(derivePartName('coelacanth', false, 'bridge')).toBe('シーラカンス級艦橋')
    expect(derivePartName('syldra', true, 'stern')).toBe('シルドラ改級艦尾')
  })
})

describe('PARTS', () => {
  it('40件あり、id が一意である', () => {
    expect(PARTS).toHaveLength(40)
    expect(new Set(PARTS.map((part) => part.id)).size).toBe(40)
  })

  it('id は `{series}-{std|kai}-{slot}` である', () => {
    expect(derivePartId('shark', false, 'hull')).toBe('shark-std-hull')
    expect(derivePartId('shark', true, 'hull')).toBe('shark-kai-hull')
  })

  it('findPartById が該当パーツを返し、未知の id では null を返す', () => {
    expect(findPartById('shark-std-hull')?.name).toBe('シャーク級艦体')
    expect(findPartById('unknown-id')).toBeNull()
  })

  it('stats が5項目を持つ（データ層のフラットな行から正規化されている）', () => {
    const part = findPartById('shark-std-hull')
    if (part === null) throw new Error('シャーク級艦体が見つからない')
    expect(part.cost).toBe(5)
    expect(part.stats).toEqual({ exploration: -10, harvest: 30, surveillance: 20, range: 40, favor: 20 })
  })
})

// SPEC §3.2: **表示順序は配列の並び順に依存させない。**
// 系統順は SERIES 定数の定義順、通常級/改級の順は improved フラグから決定的に導出する。
describe('seriesGroupsForSlot（SPEC §3.2 系統グループの順序）', () => {
  it.each(SLOTS)('%s: 5グループが SERIES の定義順に並ぶ', (slot) => {
    const groups = seriesGroupsForSlot(slot)
    expect(groups.map((group) => group.series)).toEqual([...SERIES])
  })

  it.each(SLOTS)('%s: 各グループが「通常級 → 改級」の2件である', (slot) => {
    for (const group of seriesGroupsForSlot(slot)) {
      expect(group.parts.map((part) => part.improved), group.label).toEqual([false, true])
    }
  })

  it('optgroup のラベルが系統名（例: シャーク級）である', () => {
    expect(seriesGroupsForSlot('hull').map((group) => group.label)).toEqual([
      'シャーク級',
      'ウンキウ級',
      'ホエール級',
      'シーラカンス級',
      'シルドラ級',
    ])
  })

  it.each(SLOTS)('%s: グループ内のパーツが当該部位のものである', (slot) => {
    for (const group of seriesGroupsForSlot(slot)) {
      for (const part of group.parts) {
        expect(part.slot).toBe(slot)
        expect(part.series).toBe(group.series)
      }
    }
  })
})

describe('partsForSlot', () => {
  it.each(SLOTS)('%s: 10件を表示順で返す', (slot) => {
    const parts = partsForSlot(slot)
    const label = SLOT_LABELS[slot]

    expect(parts).toHaveLength(10)
    expect(parts.map((part) => part.name).slice(0, 4)).toEqual([
      `シャーク級${label}`,
      `シャーク改級${label}`,
      `ウンキウ級${label}`,
      `ウンキウ改級${label}`,
    ])
  })

  it('艦体の表示順が「系統定義順 × 通常級→改級」である', () => {
    expect(partsForSlot('hull').map((part) => part.name)).toEqual([
      'シャーク級艦体',
      'シャーク改級艦体',
      'ウンキウ級艦体',
      'ウンキウ改級艦体',
      'ホエール級艦体',
      'ホエール改級艦体',
      'シーラカンス級艦体',
      'シーラカンス改級艦体',
      'シルドラ級艦体',
      'シルドラ改級艦体',
    ])
  })
})
