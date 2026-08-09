// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, createEvent, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_RANK } from '../../domain/ranks.ts'
import { RankField } from './RankField.tsx'

afterEach(cleanup)

/**
 * 親の状態管理を含めた実際の使われ方を再現するラッパ。
 * `onCommit` のスパイで「いつ判定がやり直されるか」を観測する。
 */
function Harness({
  initialValue = '',
  onCommitSpy = () => {},
  errorMessage = null,
  ariaInvalid = false,
}: {
  initialValue?: string
  onCommitSpy?: (value: string) => void
  errorMessage?: string | null
  ariaInvalid?: boolean
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <RankField
      value={value}
      errorMessage={errorMessage}
      ariaInvalid={ariaInvalid}
      onValueChange={setValue}
      onCommit={(next) => {
        setValue(next)
        onCommitSpy(next)
      }}
    />
  )
}

function getInput(): HTMLInputElement {
  return screen.getByLabelText('ランク')
}

describe('ランク入力欄の基本属性（SPEC §3.1.1 / §6 A1・A3）', () => {
  it('label と関連付いた text 入力である', () => {
    render(<Harness />)
    const input = getInput()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('プレースホルダが MAX_RANK を参照する', () => {
    render(<Harness />)
    expect(getInput()).toHaveAttribute('placeholder', `1-${MAX_RANK}`)
  })

  // SPEC §3.1.1: 編集途中にキーストロークが黙って落ちるのを避けるため maxlength を設定しない
  it('maxlength を設定しない', () => {
    render(<Harness />)
    expect(getInput()).not.toHaveAttribute('maxlength')
  })

  it('aria-describedby がエラー要素の id を指し、その要素は aria-live="polite" を持つ', () => {
    render(<Harness />)
    const describedBy = getInput().getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()

    const errorElement = document.getElementById(describedBy ?? '')
    expect(errorElement).not.toBeNull()
    expect(errorElement).toHaveAttribute('aria-live', 'polite')
    // SPEC §6 A4: role="alert"（assertive）は使わない
    expect(errorElement).not.toHaveAttribute('role', 'alert')
  })

  // SPEC §6 A3: メッセージ非表示時も要素は残し、内容を空にする（参照切れを防ぐ）
  it('エラーがないときも参照先の要素は残る', () => {
    render(<Harness />)
    const errorElement = document.getElementById('rank-error')
    expect(errorElement).not.toBeNull()
    expect(errorElement).toHaveTextContent('')
  })

  it('aria-invalid が状態に追従する', () => {
    const { rerender } = render(<Harness ariaInvalid={false} />)
    expect(getInput()).toHaveAttribute('aria-invalid', 'false')

    rerender(<Harness ariaInvalid errorMessage="ランクは数字のみで入力してください" />)
    expect(getInput()).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('ランクは数字のみで入力してください')).toBeInTheDocument()
  })
})

// SPEC §3.1.3 入力欄の値の書き換えタイミング
describe('入力中の書き換え', () => {
  it('入力中は値を書き換えない（打った文字列をそのまま保持する）', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const input = getInput()

    await user.type(input, '01')
    expect(input).toHaveValue('01')

    await user.clear(input)
    await user.type(input, '12a')
    expect(input).toHaveValue('12a')
  })

  it('入力のたびに判定をやり直す', async () => {
    const user = userEvent.setup()
    const onCommitSpy = vi.fn()
    render(<Harness onCommitSpy={onCommitSpy} />)

    await user.type(getInput(), '80')
    expect(onCommitSpy.mock.calls.map((call) => call[0])).toEqual(['8', '80'])
  })
})

describe('blur 時の正準表現への整形（SPEC §3.1.3）', () => {
  it.each([
    [' 80 ', '80'],
    ['１３５', '135'],
    ['01', '1'],
  ])('valid な "%s" は "%s" に整形される', async (input, expected) => {
    const user = userEvent.setup()
    render(<Harness initialValue={input} />)

    await user.click(getInput())
    await user.tab()

    expect(getInput()).toHaveValue(expected)
  })

  it.each([['12a'], [String(MAX_RANK + 1)], ['   ']])('valid でない "%s" は無変換である', async (input) => {
    const user = userEvent.setup()
    render(<Harness initialValue={input} />)

    await user.click(getInput())
    await user.tab()

    expect(getInput()).toHaveValue(input)
  })
})

// SPEC §3.1.3: IME変換中は判定を保留し、compositionend 後に再判定する
describe('IME変換中の判定保留', () => {
  it('変換中の入力では判定をやり直さない', () => {
    const onCommitSpy = vi.fn()
    render(<Harness onCommitSpy={onCommitSpy} />)
    const input = getInput()

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: 'い' } })
    fireEvent.change(input, { target: { value: '１３５' } })

    expect(onCommitSpy).not.toHaveBeenCalled()
    expect(input).toHaveValue('１３５')
  })

  it('compositionend 後に再判定される', () => {
    const onCommitSpy = vi.fn()
    render(<Harness onCommitSpy={onCommitSpy} />)
    const input = getInput()

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '１３５' } })
    fireEvent.compositionEnd(input)

    expect(onCommitSpy).toHaveBeenCalledTimes(1)
    expect(onCommitSpy).toHaveBeenCalledWith('１３５')
  })

  it('変換確定後の入力では再び判定される', () => {
    const onCommitSpy = vi.fn()
    render(<Harness onCommitSpy={onCommitSpy} />)
    const input = getInput()

    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: '１' } })
    fireEvent.compositionEnd(input)
    onCommitSpy.mockClear()

    fireEvent.change(input, { target: { value: '12' } })
    expect(onCommitSpy).toHaveBeenCalledWith('12')
  })
})

// SPEC §3.1.5 の遷移表の全行
const STEP_CASES: [input: string, up: string, down: string][] = [
  ['', '1', String(MAX_RANK)],
  ['80', '81', '79'],
  ['1', '2', '1'],
  [String(MAX_RANK), String(MAX_RANK), String(MAX_RANK - 1)],
  [String(MAX_RANK + 1), String(MAX_RANK), String(MAX_RANK)],
  ['0', '1', '1'],
  ['12a', '12a', '12a'],
]

describe('↑↓キーによる増減（SPEC §3.1.5）', () => {
  it.each(STEP_CASES)('"%s" で ↑ を押すと "%s" になる', (input, up) => {
    render(<Harness initialValue={input} />)
    fireEvent.keyDown(getInput(), { key: 'ArrowUp' })
    expect(getInput()).toHaveValue(up)
  })

  it.each(STEP_CASES)('"%s" で ↓ を押すと "%s" になる', (input, _up, down) => {
    render(<Harness initialValue={input} />)
    fireEvent.keyDown(getInput(), { key: 'ArrowDown' })
    expect(getInput()).toHaveValue(down)
  })

  // ページスクロールを抑止する
  it.each(['ArrowUp', 'ArrowDown'])('%s では preventDefault が呼ばれる', (key) => {
    render(<Harness initialValue="80" />)
    const event = createEvent.keyDown(getInput(), { key })

    fireEvent(getInput(), event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('↑↓以外のキーでは preventDefault を呼ばない', () => {
    render(<Harness initialValue="80" />)
    const event = createEvent.keyDown(getInput(), { key: 'ArrowLeft' })

    fireEvent(getInput(), event)

    expect(event.defaultPrevented).toBe(false)
  })
})
