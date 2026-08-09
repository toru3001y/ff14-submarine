import { describe, expect, it } from 'vitest'
import {
  canonicalizeRankInput,
  interpretRank,
  MAX_RANK,
  RANK_BONUSES,
  RANK_ERROR_MESSAGES,
  stepRank,
} from './ranks.ts'

type Expected =
  | { kind: 'empty' }
  | { kind: 'invalid'; reason: 'notInteger' | 'outOfRange' }
  | { kind: 'valid'; rank: number }

// SPEC §3.1.2 の表の全行。
// 上限超過のケースは `MAX_RANK + 1` で書く。上限が拡張されてもテストが壊れないようにするため
// （SPEC §11-4: 変更箇所は src/data/rank-bonus.ts への行追加のみ）。
const INTERPRET_CASES: [label: string, input: string, expected: Expected][] = [
  ['初期状態（空文字）', '', { kind: 'empty' }],
  ['空白のみ（半角・全角・タブ）', ' 　\t', { kind: 'empty' }],
  ['前後の空白は除去する', ' 80 ', { kind: 'valid', rank: 80 }],
  ['先頭ゼロを許容する', '01', { kind: 'valid', rank: 1 }],
  ['全角数字を正規化する', '１３５', { kind: 'valid', rank: 135 }],
  ['符号 + は受理しない', '+1', { kind: 'invalid', reason: 'notInteger' }],
  ['符号 - は受理しない', '-1', { kind: 'invalid', reason: 'notInteger' }],
  ['小数は受理しない', '1.5', { kind: 'invalid', reason: 'notInteger' }],
  ['指数表記は受理しない', '1e2', { kind: 'invalid', reason: 'notInteger' }],
  ['数字と文字の混在', '12a', { kind: 'invalid', reason: 'notInteger' }],
  ['下限未満', '0', { kind: 'invalid', reason: 'outOfRange' }],
  ['上限超過', String(MAX_RANK + 1), { kind: 'invalid', reason: 'outOfRange' }],
  ['桁数制限は設けない', '99999999999', { kind: 'invalid', reason: 'outOfRange' }],
]

describe('interpretRank（SPEC §3.1.2 入力値の解釈規則）', () => {
  it.each(INTERPRET_CASES)('%s: "%s"', (_label, input, expected) => {
    const state = interpretRank(input)

    expect(state.kind).toBe(expected.kind)
    if (expected.kind === 'valid') expect(state).toMatchObject({ rank: expected.rank })
    if (expected.kind === 'invalid') expect(state).toMatchObject({ reason: expected.reason })
  })

  it('valid のときは当該ランクのボーナスを保持する', () => {
    const state = interpretRank('1')
    expect(state).toMatchObject({ kind: 'valid', rank: 1 })
    if (state.kind !== 'valid') throw new Error('valid でない')
    expect(state.bonus.rank).toBe(1)
    expect(state.bonus.capacity).toBe(20)
  })
})

// SPEC §3.1.3 の `blur` 時変換表。null は「入力欄を書き換えない」を意味する。
const CANONICALIZE_CASES: [label: string, input: string, expected: string | null][] = [
  ['前後の空白を落とす', ' 80 ', '80'],
  ['全角を半角にする', '１３５', '135'],
  ['先頭ゼロを落とす', '01', '1'],
  ['notInteger は書き換えない', '12a', null],
  ['outOfRange は書き換えない', String(MAX_RANK + 1), null],
  ['空白のみは書き換えない', '   ', null],
]

describe('canonicalizeRankInput（SPEC §3.1.3 正準表現への整形）', () => {
  it.each(CANONICALIZE_CASES)('%s: "%s"', (_label, input, expected) => {
    expect(canonicalizeRankInput(input)).toBe(expected)
  })
})

// SPEC §3.1.5 の遷移表の全行。null は「入力欄を書き換えない」を意味する。
const STEP_CASES: [label: string, input: string, up: number | null, down: number | null][] = [
  ['empty', '', 1, MAX_RANK],
  ['valid(v)（1 < v < MAX_RANK）', '80', 81, 79],
  ['valid(1) は下限でクランプする', '1', 2, 1],
  ['valid(MAX_RANK) は上限でクランプする', String(MAX_RANK), MAX_RANK, MAX_RANK - 1],
  ['invalid(outOfRange) かつ n > MAX_RANK', String(MAX_RANK + 1), MAX_RANK, MAX_RANK],
  ['invalid(outOfRange) かつ n < 1', '0', 1, 1],
  ['invalid(notInteger) は変化しない', '12a', null, null],
]

describe('stepRank（SPEC §3.1.5 ↑↓キーによる増減）', () => {
  it.each(STEP_CASES)('%s: "%s"', (_label, input, up, down) => {
    expect(stepRank(input, 'up'), '↑').toBe(up)
    expect(stepRank(input, 'down'), '↓').toBe(down)
  })

  it('ラップアラウンドしない（MAX_RANK で ↑ を押しても 1 に戻らない）', () => {
    expect(stepRank(String(MAX_RANK), 'up')).toBe(MAX_RANK)
    expect(stepRank('1', 'down')).toBe(1)
  })

  it('正準表現でない入力にも正準表現の整数を返す', () => {
    expect(stepRank('０８０', 'up')).toBe(81)
    expect(stepRank(' 01 ', 'down')).toBe(1)
  })
})

describe('MAX_RANK の導出（SPEC §3.1.1）', () => {
  it('ランクボーナステーブル末尾の rank と一致する', () => {
    const last = RANK_BONUSES[RANK_BONUSES.length - 1]
    if (last === undefined) throw new Error('ランクボーナステーブルが空である')
    expect(MAX_RANK).toBe(last.rank)
  })

  it('MAX_RANK は valid、MAX_RANK + 1 は outOfRange である', () => {
    expect(interpretRank(String(MAX_RANK)).kind).toBe('valid')
    expect(interpretRank(String(MAX_RANK + 1))).toMatchObject({ kind: 'invalid', reason: 'outOfRange' })
  })
})

describe('エラーメッセージ（SPEC §3.1.2）', () => {
  it('outOfRange の文言が MAX_RANK を参照する', () => {
    expect(RANK_ERROR_MESSAGES.outOfRange).toBe(`ランクは1〜${MAX_RANK}の範囲で入力してください`)
  })

  // 全角数字は受理するため、「半角数字で入力してください」は仕様と矛盾する（SPEC §3.1.2）
  it('notInteger の文言に「半角」を含めない', () => {
    expect(RANK_ERROR_MESSAGES.notInteger).toBe('ランクは数字のみで入力してください')
    expect(RANK_ERROR_MESSAGES.notInteger).not.toContain('半角')
  })
})
