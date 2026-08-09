import { RANK_BONUS_ROWS } from '../data/rank-bonus.ts'
import { mapStats } from './types.ts'
import type { RankBonus, RankState } from './types.ts'

// SPEC §4.2.2: データ層のフラットな1行1レコードを `{rank, capacity, stats}` に正規化する。
export const RANK_BONUSES: readonly RankBonus[] = RANK_BONUS_ROWS.map((row) => ({
  rank: row.rank,
  capacity: row.capacity,
  stats: mapStats((key) => row[key]),
}))

const BONUS_BY_RANK: ReadonlyMap<number, RankBonus> = new Map(
  RANK_BONUSES.map((bonus) => [bonus.rank, bonus]),
)

// SPEC §3.1.1: MAX_RANK はハードコードせずランクボーナステーブルから導出する。
// プレースホルダ、エラーメッセージ、↑↓キーの上限も全てこの導出値を参照する。
// これにより上限が拡張されたとき、変更箇所は src/data/rank-bonus.ts だけになる（SPEC §11-4）。
//
// テーブルが昇順で欠番・重複を持たないことは tests/data-integrity/ が検証する（SPEC §8.2.2）。
// したがって末尾の rank が最大ランクである。
export const MAX_RANK: number = RANK_BONUS_ROWS[RANK_BONUS_ROWS.length - 1].rank

// SPEC §3.1.2 の文言。`notInteger` に「半角」と書かない。
// 全角数字は手順2で受理するため、「半角数字で入力してください」は仕様と矛盾する。
// 拒否しているのは符号・小数点・指数表記・数字以外の文字であり、「数字のみ」がその実態を正しく表す。
export const RANK_ERROR_MESSAGES: Readonly<Record<'notInteger' | 'outOfRange', string>> = {
  notInteger: 'ランクは数字のみで入力してください',
  outOfRange: `ランクは1〜${MAX_RANK}の範囲で入力してください`,
}

// 半角スペース U+0020 / 全角スペース U+3000 / タブ U+0009
const SURROUNDING_SPACES = /^[ 　	]+|[ 　	]+$/g
const FULLWIDTH_DIGITS = /[０-９]/g
const FULLWIDTH_TO_ASCII_OFFSET = 0xff10 - 0x30

/**
 * SPEC §3.1.2 の手順1・2。
 * 1. 前後の空白を除去する
 * 2. 全角数字を半角数字に変換する
 */
export function normalizeRankInput(raw: string): string {
  return raw
    .replace(SURROUNDING_SPACES, '')
    .replace(FULLWIDTH_DIGITS, (char) => String.fromCharCode(char.charCodeAt(0) - FULLWIDTH_TO_ASCII_OFFSET))
}

/**
 * SPEC §3.1.2 の入力値の解釈規則。
 *
 * 符号・小数・指数表記は受理しない（表現を一意に保つため）。
 * 先頭ゼロは許容する（`"01"` は十進表記として自然で、意図が一意に定まるため）。
 */
export function interpretRank(raw: string): RankState {
  const normalized = normalizeRankInput(raw)
  if (normalized === '') return { kind: 'empty' }
  if (!/^[0-9]+$/.test(normalized)) return { kind: 'invalid', reason: 'notInteger' }

  const value = Number.parseInt(normalized, 10)
  const bonus = BONUS_BY_RANK.get(value)
  if (bonus === undefined) return { kind: 'invalid', reason: 'outOfRange' }

  return { kind: 'valid', rank: value, bonus }
}

/**
 * SPEC §3.1.3: `blur` 時の正準表現への整形。
 *
 * `valid` のときのみ正準表現（半角・先頭ゼロなし・前後空白なし）を返す。
 * `empty` / `invalid` では null を返し、**入力欄を書き換えない**。
 * 不正値を勝手に整形・消去すると、利用者が何を打ったのか分からなくなり修正できないため。
 */
export function canonicalizeRankInput(raw: string): string | null {
  const state = interpretRank(raw)
  return state.kind === 'valid' ? String(state.rank) : null
}

export type StepDirection = 'up' | 'down'

/**
 * SPEC §3.1.5: ↑↓キーによる増減後の値を決定する。
 *
 * null は「入力欄を書き換えない」を意味する（`invalid(notInteger)` のときのみ）。
 * ラップアラウンドはしない。誤操作で意図しない大ジャンプが起きるため。
 */
export function stepRank(raw: string, direction: StepDirection): number | null {
  const state = interpretRank(raw)

  switch (state.kind) {
    // 「何もない状態から上へ」は下端から、「下へ」は上端から入る、という対称的な解釈
    case 'empty':
      return direction === 'up' ? 1 : MAX_RANK

    case 'valid': {
      const next = direction === 'up' ? state.rank + 1 : state.rank - 1
      return Math.min(MAX_RANK, Math.max(1, next))
    }

    case 'invalid': {
      // 入力途中の文字列を勝手に置換すると、利用者が打った内容が失われる
      if (state.reason === 'notInteger') return null
      // outOfRange は整数として解釈できている以上、最も近い有効値へ寄せる。
      // 押されたキーの向きに関わらず有効域へ入れる。
      return Number.parseInt(normalizeRankInput(raw), 10) > MAX_RANK ? MAX_RANK : 1
    }
  }
}
