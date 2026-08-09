import { RANK_BONUS_ROWS } from '../data/rank-bonus.ts'

// SPEC §3.1.1: MAX_RANK はハードコードせずランクボーナステーブルから導出する。
// プレースホルダ、エラーメッセージ、↑↓キーの上限も全てこの導出値を参照する。
// これにより上限が拡張されたとき、変更箇所は src/data/rank-bonus.ts だけになる（SPEC §11-4）。
//
// テーブルが昇順で欠番・重複を持たないことは tests/data-integrity/ が検証する（SPEC §8.2.2）。
// したがって末尾の rank が最大ランクである。
export const MAX_RANK: number = RANK_BONUS_ROWS[RANK_BONUS_ROWS.length - 1].rank
