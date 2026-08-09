import { STAT_KEYS } from '../../domain/types.ts'
import type { Cell, MiniGrid } from '../../domain/types.ts'

/**
 * SPEC §5.3 の色種別を CSS クラスへ写す。
 * どの色を使うかの判断は deriveViewModel() が済ませており、ここでは分岐しない（SPEC §7.1）。
 */
export function cellClassName(cell: Cell): string {
  return `value value--${cell.color}`
}

/**
 * 6列ミニグリッドの値セル（SPEC §5.4）。
 *
 * 1列目（`leading`）はセクション01 ではキャパシティ、セクション02 ではコストを表す。
 * `<tr>` の直下に置くため、テーブル行そのものではなく `<td>` 群を返す。
 * 列見出しは表側が1回だけ描く。
 */
export function StatGrid({ grid }: { readonly grid: MiniGrid }) {
  return (
    <>
      {/* 1列目は左罫線を引かない（grid__lead）。グリッドの左辺は開けておく */}
      <td className={`${cellClassName(grid.leading)} grid__lead`}>{grid.leading.text}</td>
      {STAT_KEYS.map((key) => (
        <td key={key} className={cellClassName(grid.stats[key])}>
          {grid.stats[key].text}
        </td>
      ))}
    </>
  )
}
