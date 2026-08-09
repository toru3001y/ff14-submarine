import { describe, expect, it } from 'vitest'
import { RANK_BONUS_ROWS } from '../../src/data/rank-bonus.ts'
import { MAX_RANK } from '../../src/domain/ranks.ts'
import { STAT_KEYS } from '../../src/domain/types.ts'
import { loadOldRankBonuses } from './load-old-data.ts'

const oldRankBonuses = loadOldRankBonuses()

// SPEC §8.2.2 ランクボーナス（拡張あり）
describe('ランクボーナスデータの整合性', () => {
  // 旧データ側の各行に対応が存在するかを**一方向に**照合する。
  // 配列全体の件数一致は検証しない。これによりランク136以降を追加してもテストは壊れず、
  // 既存135件の値の退行は検出できる（SPEC §4.2.1、§8.2.2）。
  it('旧データの各ランクに対応する行が存在し、capacity と5ステータスが完全一致する', () => {
    const byRank = new Map(RANK_BONUS_ROWS.map((row) => [row.rank, row]))

    for (const old of oldRankBonuses) {
      const row = byRank.get(old.rank)
      if (row === undefined) throw new Error(`ランク ${old.rank} が新データに存在しない`)

      expect(row.capacity, `rank ${old.rank} の capacity`).toBe(old.capacity)
      for (const key of STAT_KEYS) {
        expect(row[key], `rank ${old.rank} の ${key}`).toBe(old[key])
      }
    }
  })

  it('rank が 1 から始まり、欠番・重複がなく昇順である', () => {
    expect(RANK_BONUS_ROWS.length).toBeGreaterThan(0)
    RANK_BONUS_ROWS.forEach((row, index) => {
      expect(row.rank, `${index} 番目の行`).toBe(index + 1)
    })
  })

  it('capacity と5ステータスがすべて存在し、すべて整数である', () => {
    for (const row of RANK_BONUS_ROWS) {
      expect(Number.isInteger(row.capacity), `rank ${row.rank} の capacity`).toBe(true)
      for (const key of STAT_KEYS) {
        expect(Number.isInteger(row[key]), `rank ${row.rank} の ${key}`).toBe(true)
      }
    }
  })

  it('capacity が 0 以上である', () => {
    for (const row of RANK_BONUS_ROWS) {
      expect(row.capacity, `rank ${row.rank}`).toBeGreaterThanOrEqual(0)
    }
  })

  // SPEC §3.1.1: MAX_RANK はハードコードせずランクボーナステーブルから導出する。
  it('MAX_RANK がテーブル末尾の rank と一致する', () => {
    const last = RANK_BONUS_ROWS[RANK_BONUS_ROWS.length - 1]
    if (last === undefined) throw new Error('ランクボーナステーブルが空である')
    expect(MAX_RANK).toBe(last.rank)
  })
})
