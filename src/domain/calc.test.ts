import { describe, expect, it } from 'vitest'
import { capacityOverflow, totalCost, totalStats } from './calc.ts'
import { PARTS } from './parts.ts'
import { interpretRank } from './ranks.ts'
import type { Part, RankState, Selections, Slot } from './types.ts'

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

const NOTHING_SELECTED = selectionsOf({})

describe('totalCost（SPEC §3.3.1）', () => {
  it('全未選択のとき 0 である', () => {
    expect(totalCost(NOTHING_SELECTED)).toBe(0)
  })

  it('未選択部位を 0 として扱い、部分的な選択でも合計する', () => {
    expect(totalCost(selectionsOf({ hull: 'シャーク級艦体' }))).toBe(5)
    expect(totalCost(selectionsOf({ hull: 'シャーク級艦体', stern: 'ウンキウ級艦尾' }))).toBe(5 + 9)
  })

  it('全部位を改級にしたとき 80 である（SPEC §3.4 の補足）', () => {
    const cost = totalCost(
      selectionsOf({
        hull: 'シルドラ改級艦体',
        stern: 'シルドラ改級艦尾',
        bow: 'シルドラ改級艦首',
        bridge: 'シルドラ改級艦橋',
      }),
    )
    expect(cost).toBe(80)
  })
})

describe('totalStats（SPEC §3.3.1）', () => {
  it('全未選択・ボーナスなしのとき全項目 0 である', () => {
    expect(totalStats(NOTHING_SELECTED, null)).toEqual({
      exploration: 0,
      harvest: 0,
      surveillance: 0,
      range: 0,
      favor: 0,
    })
  })

  it('未選択部位を 0 として扱う', () => {
    // シャーク級艦体: exploration -10 / harvest 30 / surveillance 20 / range 40 / favor 20
    expect(totalStats(selectionsOf({ hull: 'シャーク級艦体' }), null)).toEqual({
      exploration: -10,
      harvest: 30,
      surveillance: 20,
      range: 40,
      favor: 20,
    })
  })

  it('選択済みパーツを合算する', () => {
    // シャーク級艦尾: exploration -30 / harvest 20 / surveillance 60 / range 30 / favor 15
    expect(totalStats(selectionsOf({ hull: 'シャーク級艦体', stern: 'シャーク級艦尾' }), null)).toEqual({
      exploration: -40,
      harvest: 50,
      surveillance: 80,
      range: 70,
      favor: 35,
    })
  })

  // SPEC §3.3.2: ランクが empty / invalid のときはランクボーナスを 0 として扱う
  it('ランクボーナスを加算する', () => {
    const rank135 = interpretRank('135')
    if (rank135.kind !== 'valid') throw new Error('ランク135が valid でない')

    const withBonus = totalStats(selectionsOf({ hull: 'シャーク級艦体' }), rank135.bonus.stats)
    const withoutBonus = totalStats(selectionsOf({ hull: 'シャーク級艦体' }), null)

    // ランク135のボーナス: 探査100 / 収集130 / 巡航90 / 航続120 / 運95（SPEC §4.2）
    expect(withBonus).toEqual({
      exploration: -10 + 100,
      harvest: 30 + 130,
      surveillance: 20 + 90,
      range: 40 + 120,
      favor: 20 + 95,
    })
    expect(withoutBonus).toEqual({
      exploration: -10,
      harvest: 30,
      surveillance: 20,
      range: 40,
      favor: 20,
    })
  })
})

describe('capacityOverflow（SPEC §3.4）', () => {
  function rankState(input: string): RankState {
    return interpretRank(input)
  }

  it('ランク valid かつ コスト > キャパシティ のときのみ超過量を返す', () => {
    // ランク1 のキャパシティは 20。シャーク改級艦体(20) + シャーク級艦尾(5) = 25
    const cost = totalCost(selectionsOf({ hull: 'シャーク改級艦体', stern: 'シャーク級艦尾' }))
    expect(cost).toBe(25)
    expect(capacityOverflow(cost, rankState('1'))).toBe(5)
  })

  it('コストがキャパシティと等しいときは超過ではない', () => {
    expect(capacityOverflow(20, rankState('1'))).toBeNull()
  })

  // SPEC §2.1 の欠陥の回帰防止:
  // ランク未入力の状態でパーツを1つ選んだだけで超過エラーが出てはならない
  it('ランクが empty のとき判定を行わない（偽警告の不在）', () => {
    const cost = totalCost(selectionsOf({ hull: 'シャーク級艦体' }))
    expect(cost).toBe(5)
    expect(capacityOverflow(cost, rankState(''))).toBeNull()
  })

  it('ランクが invalid のとき判定を行わない', () => {
    expect(capacityOverflow(80, rankState('12a'))).toBeNull()
    expect(capacityOverflow(80, rankState('0'))).toBeNull()
  })

  // SPEC §3.4 の補足: パーツコスト合計の最大は 80、ランク50以降のキャパシティは 80 固定。
  // `80 > 80` は偽であるため、超過はランク1〜49でのみ発生し得る。
  it('ランク50以降は全部位を改級にしても超過しない', () => {
    const maxCost = 80
    expect(capacityOverflow(maxCost, rankState('50'))).toBeNull()
    expect(capacityOverflow(maxCost, rankState('135'))).toBeNull()
  })

  it('ランク49以下では超過し得る', () => {
    // ランク49 のキャパシティは 68
    expect(capacityOverflow(80, rankState('49'))).toBe(12)
  })
})
