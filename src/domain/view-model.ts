import { capacityOverflow, totalCost, totalStats } from './calc.ts'
import { interpretRank, RANK_ERROR_MESSAGES } from './ranks.ts'
import { SLOTS, STAT_KEYS } from './types.ts'
import type { Cell, CellColor, MiniGrid, Part, RankState, Selections, Slot, StatKey, ViewModel } from './types.ts'

// SPEC §5.4: 未選択・未確定は `—`（U+2014、`--text-muted`）
const UNSET_CELL: Cell = { text: '—', color: 'muted' }

function mapCells(compute: (key: StatKey) => Cell): Readonly<Record<StatKey, Cell>> {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, compute(key)])) as Readonly<Record<StatKey, Cell>>
}

// SPEC §5.3: 正の値 → accent、ゼロ → ink、負の値 → danger。
// ゼロを accent（正扱い）にしない。緑は「加点」を意味するため、加点0を緑にすると誤誘導になる。
function colorOf(value: number): CellColor {
  if (value > 0) return 'accent'
  if (value < 0) return 'danger'
  return 'ink'
}

/**
 * ミニグリッド用のセル（SPEC §3.3.3）。
 * ミニグリッドは「加算される差分」であり符号が意味を持つため `+` を付ける。
 * ただし `+0` は使わない。0 に符号を付けても意味を持たないため。
 */
function signedCell(value: number): Cell {
  return { text: value > 0 ? `+${value}` : String(value), color: colorOf(value) }
}

/**
 * セクション03 総合ステータス用のセル（SPEC §3.3.3）。
 * 「結果の値」であり、負のときのみ `-` が付く。
 */
function plainCell(value: number): Cell {
  return { text: String(value), color: colorOf(value) }
}

const UNSET_GRID: MiniGrid = { leading: UNSET_CELL, stats: mapCells(() => UNSET_CELL) }

/** セクション02 の各部位。1列目はコスト（予算であり良し悪しではないので ink） */
function partGrid(part: Part | null): MiniGrid {
  if (part === null) return UNSET_GRID
  return {
    leading: { text: String(part.cost), color: 'ink' },
    stats: mapCells((key) => signedCell(part.stats[key])),
  }
}

/** セクション01 のランクボーナス。1列目はキャパシティ。ランクが valid でなければ全項目 `—` */
function bonusGrid(rankState: RankState): MiniGrid {
  if (rankState.kind !== 'valid') return UNSET_GRID
  return {
    leading: { text: String(rankState.bonus.capacity), color: 'ink' },
    stats: mapCells((key) => signedCell(rankState.bonus.stats[key])),
  }
}

/**
 * SPEC §7.1: 計算・状態判定・表示値の決定はこの1本の純関数の中で終わる。
 *
 * ランクが empty / invalid のときは、**ランクボーナスを 0 として選択済みパーツの合計を表示する**
 * （SPEC §3.3.2）。総合値を `—` にしないのは、「未選択部位を0として扱う」規則を一貫させると
 * 全未選択時の合計が0になるため、および部分選択時に「一部が数値・一部が `—`」という
 * 不整合が生じるためである。ランクボーナスが不明であることは、キャパシティの `—` と
 * ランクボーナス行の `—` で示す。
 */
export function deriveViewModel(rankInput: string, selections: Selections): ViewModel {
  const rankState = interpretRank(rankInput)
  const cost = totalCost(selections)
  const overflow = capacityOverflow(cost, rankState)
  const stats = totalStats(selections, rankState.kind === 'valid' ? rankState.bonus.stats : null)

  return {
    rank: {
      kind: rankState.kind,
      ariaInvalid: rankState.kind === 'invalid',
      errorMessage: rankState.kind === 'invalid' ? RANK_ERROR_MESSAGES[rankState.reason] : null,
      bonusGrid: bonusGrid(rankState),
    },
    parts: Object.fromEntries(SLOTS.map((slot) => [slot, partGrid(selections[slot])])) as Readonly<
      Record<Slot, MiniGrid>
    >,
    totals: {
      cost: { text: String(cost), color: overflow === null ? 'ink' : 'danger' },
      capacity:
        rankState.kind === 'valid'
          ? // 分母は補助表示のため常に muted（SPEC §3.3.4）
            { text: String(rankState.bonus.capacity), color: 'muted' }
          : UNSET_CELL,
      stats: mapCells((key) => plainCell(stats[key])),
      // SPEC §5.1.1 / §6 A7: 色に加えて必ずテキスト警告を伴わせる
      overflowMessage: overflow === null ? null : `⚠ キャパシティを ${overflow} 超過`,
    },
  }
}

// SPEC §3.5 / §3.3.4: リセット後の初期状態
export const INITIAL_RANK_INPUT = ''
export const INITIAL_SELECTIONS: Selections = { hull: null, stern: null, bow: null, bridge: null }
