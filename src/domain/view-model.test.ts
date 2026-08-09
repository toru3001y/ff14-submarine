import { describe, expect, it } from 'vitest'
import { PARTS } from './parts.ts'
import { MAX_RANK, RANK_ERROR_MESSAGES } from './ranks.ts'
import { SLOTS, STAT_KEYS } from './types.ts'
import type { Cell, MiniGrid, Part, Selections, Slot } from './types.ts'
import { deriveViewModel, INITIAL_RANK_INPUT, INITIAL_SELECTIONS } from './view-model.ts'

function partByName(name: string): Part {
  const part = PARTS.find((candidate) => candidate.name === name)
  if (part === undefined) throw new Error(`パーツが見つからない: ${name}`)
  return part
}

function selectionsOf(names: Partial<Record<Slot, string>>): Selections {
  return {
    hull: names.hull === undefined ? null : partByName(names.hull),
    stern: names.stern === undefined ? null : partByName(names.stern),
    bow: names.bow === undefined ? null : partByName(names.bow),
    bridge: names.bridge === undefined ? null : partByName(names.bridge),
  }
}

function cellsOf(grid: MiniGrid): readonly Cell[] {
  return [grid.leading, ...STAT_KEYS.map((key) => grid.stats[key])]
}

// SPEC §3.3.4 初期状態: ランク未入力・4部位すべて未選択
describe('初期状態', () => {
  const vm = deriveViewModel(INITIAL_RANK_INPUT, INITIAL_SELECTIONS)

  it('コストが `0 / —`（分子 ink・分母 muted）である', () => {
    expect(vm.totals.cost).toEqual({ text: '0', color: 'ink' })
    expect(vm.totals.capacity).toEqual({ text: '—', color: 'muted' })
  })

  it('5ステータスがすべて `0`（ink）である', () => {
    for (const key of STAT_KEYS) {
      expect(vm.totals.stats[key], key).toEqual({ text: '0', color: 'ink' })
    }
  })

  it('セクション01・02 のミニグリッドがすべて `—`（muted）である', () => {
    for (const cell of cellsOf(vm.rank.bonusGrid)) {
      expect(cell).toEqual({ text: '—', color: 'muted' })
    }
    for (const slot of SLOTS) {
      for (const cell of cellsOf(vm.parts[slot])) {
        expect(cell, slot).toEqual({ text: '—', color: 'muted' })
      }
    }
  })

  it('エラーも超過警告も出ない', () => {
    expect(vm.rank.kind).toBe('empty')
    expect(vm.rank.ariaInvalid).toBe(false)
    expect(vm.rank.errorMessage).toBeNull()
    expect(vm.totals.overflowMessage).toBeNull()
  })
})

// SPEC §3.3.2 ランクが empty / invalid のときの扱い
describe('ランクが未確定のとき', () => {
  const selections = selectionsOf({ hull: 'シャーク級艦体' })

  it.each(['', '12a', '0'])('"%s": 総合値はランクボーナスを0とした合計を表示する', (input) => {
    const vm = deriveViewModel(input, selections)
    expect(vm.totals.stats.harvest).toEqual({ text: '30', color: 'accent' })
    expect(vm.totals.stats.exploration).toEqual({ text: '-10', color: 'danger' })
  })

  it.each(['', '12a', '0'])('"%s": コストは数値、キャパシティは `—` である', (input) => {
    const vm = deriveViewModel(input, selections)
    expect(vm.totals.cost).toEqual({ text: '5', color: 'ink' })
    expect(vm.totals.capacity).toEqual({ text: '—', color: 'muted' })
  })

  it.each(['', '12a', '0'])('"%s": ランクボーナスのミニグリッドが全項目 `—` である', (input) => {
    const vm = deriveViewModel(input, selections)
    for (const cell of cellsOf(vm.rank.bonusGrid)) {
      expect(cell).toEqual({ text: '—', color: 'muted' })
    }
  })

  // SPEC §2.1 の欠陥の回帰防止
  it('ランク未入力＋パーツ選択済みで超過警告が出ない', () => {
    expect(deriveViewModel('', selections).totals.overflowMessage).toBeNull()
  })
})

describe('ランク入力エラーの表示（SPEC §3.1.4 / §6 A2）', () => {
  it('empty ではエラーを出さず aria-invalid は false', () => {
    const vm = deriveViewModel('', INITIAL_SELECTIONS)
    expect(vm.rank.ariaInvalid).toBe(false)
    expect(vm.rank.errorMessage).toBeNull()
  })

  it('notInteger でエラー文言を出し aria-invalid は true', () => {
    const vm = deriveViewModel('12a', INITIAL_SELECTIONS)
    expect(vm.rank.ariaInvalid).toBe(true)
    expect(vm.rank.errorMessage).toBe(RANK_ERROR_MESSAGES.notInteger)
  })

  it('outOfRange でエラー文言を出す', () => {
    const vm = deriveViewModel(String(MAX_RANK + 1), INITIAL_SELECTIONS)
    expect(vm.rank.ariaInvalid).toBe(true)
    expect(vm.rank.errorMessage).toBe(RANK_ERROR_MESSAGES.outOfRange)
  })

  it('valid ではエラーを出さない', () => {
    const vm = deriveViewModel('80', INITIAL_SELECTIONS)
    expect(vm.rank.kind).toBe('valid')
    expect(vm.rank.ariaInvalid).toBe(false)
    expect(vm.rank.errorMessage).toBeNull()
  })
})

// SPEC §3.3.3 ゼロと符号の表示規則
describe('ゼロと符号', () => {
  it('ミニグリッドは符号付き（加算される差分であるため）', () => {
    // シャーク級艦体: exploration -10 / harvest +30 / surveillance +20 / range +40 / favor +20
    const vm = deriveViewModel('', selectionsOf({ hull: 'シャーク級艦体' }))
    expect(vm.parts.hull.leading).toEqual({ text: '5', color: 'ink' })
    expect(vm.parts.hull.stats.harvest).toEqual({ text: '+30', color: 'accent' })
    expect(vm.parts.hull.stats.exploration).toEqual({ text: '-10', color: 'danger' })
  })

  it('セクション03 総合ステータスは符号なし（結果の値であるため）', () => {
    const vm = deriveViewModel('', selectionsOf({ hull: 'シャーク級艦体' }))
    expect(vm.totals.stats.harvest.text).toBe('30')
    expect(vm.totals.stats.exploration.text).toBe('-10')
  })

  it('`+0` を生成しない（ミニグリッド）', () => {
    // ウンキウ級艦体: surveillance が 0
    const vm = deriveViewModel('', selectionsOf({ hull: 'ウンキウ級艦体' }))
    expect(vm.parts.hull.stats.surveillance).toEqual({ text: '0', color: 'ink' })
  })

  it('`+0` を生成しない（ランクボーナス。ランク1〜49 のボーナスは全て0）', () => {
    const vm = deriveViewModel('1', INITIAL_SELECTIONS)
    expect(vm.rank.bonusGrid.leading).toEqual({ text: '20', color: 'ink' })
    for (const key of STAT_KEYS) {
      expect(vm.rank.bonusGrid.stats[key], key).toEqual({ text: '0', color: 'ink' })
    }
  })

  it('負の値には必ず `-` が付く（SPEC §5.1.1 の色覚制約への対応）', () => {
    const vm = deriveViewModel('', selectionsOf({ hull: 'シャーク級艦体' }))
    expect(vm.parts.hull.stats.exploration.text.startsWith('-')).toBe(true)
    expect(vm.totals.stats.exploration.text.startsWith('-')).toBe(true)
  })
})

// SPEC §5.3 色と記号の意味づけ
describe('色種別の決定', () => {
  it('正 → accent、0 → ink、負 → danger', () => {
    const vm = deriveViewModel('', selectionsOf({ hull: 'ウンキウ級艦体' }))
    expect(vm.parts.hull.stats.exploration.color, '正').toBe('accent')
    expect(vm.parts.hull.stats.surveillance.color, '0').toBe('ink')

    const negative = deriveViewModel('', selectionsOf({ hull: 'シャーク級艦体' }))
    expect(negative.parts.hull.stats.exploration.color, '負').toBe('danger')
  })

  it('コストは通常時 ink、超過時 danger', () => {
    const normal = deriveViewModel('135', selectionsOf({ hull: 'シャーク級艦体' }))
    expect(normal.totals.cost.color).toBe('ink')

    const over = deriveViewModel('1', selectionsOf({ hull: 'シャーク改級艦体', stern: 'シャーク級艦尾' }))
    expect(over.totals.cost.color).toBe('danger')
  })
})

// SPEC §3.4 キャパシティ超過判定
describe('キャパシティ超過', () => {
  it('ランク valid かつ超過時のみ警告文を出し、超過量が正しい', () => {
    // ランク1 のキャパシティ 20 に対し、20 + 5 = 25
    const vm = deriveViewModel('1', selectionsOf({ hull: 'シャーク改級艦体', stern: 'シャーク級艦尾' }))
    expect(vm.totals.cost.text).toBe('25')
    expect(vm.totals.capacity).toEqual({ text: '20', color: 'muted' })
    expect(vm.totals.overflowMessage).toBe('⚠ キャパシティを 5 超過')
  })

  it('超過していなければ警告を出さない', () => {
    const vm = deriveViewModel('135', selectionsOf({ hull: 'シャーク改級艦体', stern: 'シャーク級艦尾' }))
    expect(vm.totals.overflowMessage).toBeNull()
    expect(vm.totals.cost.color).toBe('ink')
  })
})

describe('コストの扱い（SPEC §3.3.1）', () => {
  it('コストにランクボーナスを加算しない', () => {
    const selections = selectionsOf({ hull: 'シャーク級艦体' })
    const withoutRank = deriveViewModel('', selections)
    const withMaxRank = deriveViewModel(String(MAX_RANK), selections)

    expect(withoutRank.totals.cost.text).toBe('5')
    expect(withMaxRank.totals.cost.text).toBe('5')
  })
})

// SPEC §3.5 リセット
describe('リセット', () => {
  it('初期状態（SPEC §3.3.4）に戻る', () => {
    const dirty = deriveViewModel('1', selectionsOf({ hull: 'シャーク改級艦体', stern: 'シャーク級艦尾' }))
    expect(dirty.totals.overflowMessage).not.toBeNull()

    const reset = deriveViewModel(INITIAL_RANK_INPUT, INITIAL_SELECTIONS)
    expect(reset).toEqual(deriveViewModel('', { hull: null, stern: null, bow: null, bridge: null }))
    expect(reset.totals.cost).toEqual({ text: '0', color: 'ink' })
    expect(reset.totals.capacity).toEqual({ text: '—', color: 'muted' })
    expect(reset.totals.overflowMessage).toBeNull()
    expect(reset.rank.errorMessage).toBeNull()
  })
})
