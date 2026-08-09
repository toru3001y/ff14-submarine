import { mapStats, SLOTS } from './types.ts'
import type { RankState, Selections, Stats } from './types.ts'

/**
 * SPEC §3.3.1: 総コスト = Σ(選択中パーツのコスト)。
 * 未選択部位は 0 として扱う（部分的な選択でも合計を表示する）。
 * コストのみランクボーナス対象外である。
 */
export function totalCost(selections: Selections): number {
  return SLOTS.reduce((sum, slot) => sum + (selections[slot]?.cost ?? 0), 0)
}

/**
 * SPEC §3.3.1: 総合値 = Σ(選択中4部位のパーツ性能値) + ランクボーナス値。
 *
 * `bonus` に null を渡すとランクボーナスを 0 として扱う。
 * これは SPEC §3.3.2（ランクが empty / invalid のとき）の挙動であり、
 * v1.0 の挙動を継承して選択済みパーツの合計を表示するためのものである。
 */
export function totalStats(selections: Selections, bonus: Stats | null): Stats {
  return mapStats(
    (key) =>
      SLOTS.reduce((sum, slot) => sum + (selections[slot]?.stats[key] ?? 0), 0) + (bonus?.[key] ?? 0),
  )
}

/**
 * SPEC §3.4: キャパシティ超過量。超過していなければ null。
 *
 * 判定条件は「ランクが `valid` **かつ** コスト合計 > 当該ランクのキャパシティ」。
 * ランクが empty / invalid のときは判定を行わない。これは SPEC §2.1 の欠陥
 * （ランク未入力でパーツを1つ選んだ瞬間に偽の超過警告が出る）の修正にあたる。
 */
export function capacityOverflow(cost: number, rankState: RankState): number | null {
  if (rankState.kind !== 'valid') return null
  const excess = cost - rankState.bonus.capacity
  return excess > 0 ? excess : null
}
