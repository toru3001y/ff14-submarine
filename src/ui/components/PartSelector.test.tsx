// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SLOT_LABELS } from '../../domain/labels.ts'
import { partsForSlot } from '../../domain/parts.ts'
import { SLOTS } from '../../domain/types.ts'
import type { Slot } from '../../domain/types.ts'
import { PartSelector } from './PartSelector.tsx'

afterEach(cleanup)

function renderSelector(slot: Slot, onChange = vi.fn()) {
  render(<PartSelector slot={slot} selected={null} onChange={onChange} />)
  return screen.getByRole('combobox')
}

// SPEC §3.2 パーツ選択
describe('optgroup の構造', () => {
  it.each(SLOTS)('%s: optgroup が5つ、SERIES の定義順に並ぶ', (slot) => {
    const select = renderSelector(slot)
    const groups = Array.from(select.querySelectorAll('optgroup'))

    expect(groups.map((group) => group.label)).toEqual([
      'シャーク級',
      'ウンキウ級',
      'ホエール級',
      'シーラカンス級',
      'シルドラ級',
    ])
  })

  it.each(SLOTS)('%s: 各グループが2件で「通常級 → 改級」の順である', (slot) => {
    const select = renderSelector(slot)
    const label = SLOT_LABELS[slot]

    for (const group of Array.from(select.querySelectorAll('optgroup'))) {
      const options = Array.from(group.querySelectorAll('option'))
      const series = group.label.replace(/級$/, '')

      expect(options).toHaveLength(2)
      expect(options[0]?.textContent).toContain(`${series}級${label}`)
      expect(options[1]?.textContent).toContain(`${series}改級${label}`)
    }
  })

  it.each(SLOTS)('%s: パーツ10件と未選択の選択肢を持つ', (slot) => {
    const select = renderSelector(slot)
    expect(select.querySelectorAll('option')).toHaveLength(11)
  })
})

describe('選択肢の表示', () => {
  it.each(SLOTS)('%s: 未選択の選択肢が先頭にあり optgroup の外側にある', (slot) => {
    const select = renderSelector(slot)
    const first = select.children[0]

    expect(first?.tagName).toBe('OPTION')
    expect(first?.textContent).toBe(`${SLOT_LABELS[slot]}を選択してください`)
    expect((first as HTMLOptionElement).value).toBe('')
  })

  it('表示形式が `{パーツ名} (コスト{n})` である', () => {
    renderSelector('hull')
    expect(screen.getByRole('option', { name: 'シャーク級艦体 (コスト5)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'シャーク改級艦体 (コスト20)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'シルドラ級艦体 (コスト17)' })).toBeInTheDocument()
  })

  it.each(SLOTS)('%s: すべてのパーツが表示形式どおりに並ぶ', (slot) => {
    const select = renderSelector(slot)
    const optionTexts = Array.from(select.querySelectorAll('optgroup option')).map(
      (option) => option.textContent,
    )

    expect(optionTexts).toEqual(partsForSlot(slot).map((part) => `${part.name} (コスト${part.cost})`))
  })
})

describe('選択の通知', () => {
  it('パーツを選ぶと slot と id を通知する', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const select = renderSelector('hull', onChange)

    await user.selectOptions(select, 'shark-std-hull')

    expect(onChange).toHaveBeenCalledWith('hull', 'shark-std-hull')
  })

  it('選択中のパーツが value に反映される', () => {
    const part = partsForSlot('stern')[0]
    if (part === undefined) throw new Error('艦尾のパーツが見つからない')

    render(<PartSelector slot="stern" selected={part} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox')).toHaveValue(part.id)
  })
})
