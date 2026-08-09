import { SLOT_LABELS } from '../../domain/labels.ts'
import { seriesGroupsForSlot } from '../../domain/parts.ts'
import type { Part, Slot } from '../../domain/types.ts'

export function partSelectId(slot: Slot): string {
  return `part-${slot}`
}

type Props = {
  readonly slot: Slot
  readonly selected: Part | null
  readonly onChange: (slot: Slot, partId: string) => void
}

/**
 * SPEC §3.2 パーツ選択。
 *
 * `<optgroup>` は系統別で、系統順は SERIES 定義順、系統内は「通常級 → 改級」。
 * この順序は domain/parts.ts が決定しており、ここでは配列の並びをそのまま描画する。
 *
 * 対応する `<label>` は表構造側（行見出し）が描く。`htmlFor` は partSelectId() で揃える。
 */
export function PartSelector({ slot, selected, onChange }: Props) {
  return (
    <select
      id={partSelectId(slot)}
      className="part-selector"
      value={selected?.id ?? ''}
      onChange={(event) => onChange(slot, event.target.value)}
    >
      {/* 未選択の選択肢は optgroup の外側に置く */}
      <option value="">{`${SLOT_LABELS[slot]}を選択してください`}</option>
      {seriesGroupsForSlot(slot).map((group) => (
        <optgroup key={group.series} label={group.label}>
          {group.parts.map((part) => (
            <option key={part.id} value={part.id}>
              {`${part.name} (コスト${part.cost})`}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
