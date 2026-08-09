import { useRef } from 'react'
import type { CompositionEvent, KeyboardEvent } from 'react'
import { canonicalizeRankInput, MAX_RANK, stepRank } from '../../domain/ranks.ts'

const INPUT_ID = 'rank-input'
const ERROR_ID = 'rank-error'

type Props = {
  readonly value: string
  readonly errorMessage: string | null
  readonly ariaInvalid: boolean
  /** 入力欄の値だけを更新する（判定は行わない）。IME変換中に使う */
  readonly onValueChange: (value: string) => void
  /** 入力欄の値を更新し、判定もやり直す */
  readonly onCommit: (value: string) => void
}

/**
 * SPEC §3.1 潜水艦ランク入力。
 *
 * `type="text"` は入力値を数字に制限しない。キーボード・ペースト・IME からは
 * 任意の文字列が入るため、防壁は domain/ranks.ts の解釈規則（§3.1.2）だけである。
 * このコンポーネントは値の解釈を行わず、いつ判定させるか（§3.1.3 の書き換えタイミング）
 * だけを受け持つ。
 */
export function RankField({ value, errorMessage, ariaInvalid, onValueChange, onCommit }: Props) {
  // SPEC §3.1.3: IME変換中は判定を保留し、直前の判定結果を維持する。
  // 都度判定するとエラーメッセージが点滅し、aria-live が未確定文字列を読み上げてしまう。
  const isComposing = useRef(false)

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value
    if (isComposing.current) onValueChange(next)
    else onCommit(next)
  }

  function handleCompositionStart() {
    isComposing.current = true
  }

  function handleCompositionEnd(event: CompositionEvent<HTMLInputElement>) {
    isComposing.current = false
    onCommit(event.currentTarget.value)
  }

  // SPEC §3.1.3: blur では valid のときのみ正準表現へ整形する。
  // empty / invalid は書き換えない（利用者が何を打ったのか分からなくなるため）。
  function handleBlur() {
    const canonical = canonicalizeRankInput(value)
    if (canonical !== null) onCommit(canonical)
  }

  // SPEC §3.1.5: ↑↓キーによる増減。ページスクロールを抑止する。
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()

    const next = stepRank(value, event.key === 'ArrowUp' ? 'up' : 'down')
    if (next !== null) onCommit(String(next))
  }

  return (
    <div className="rank-field">
      <label className="rank-field__label" htmlFor={INPUT_ID}>
        ランク
      </label>
      <input
        id={INPUT_ID}
        className="rank-field__input"
        type="text"
        value={value}
        placeholder={`1-${MAX_RANK}`}
        aria-invalid={ariaInvalid}
        aria-describedby={ERROR_ID}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {/*
        SPEC §6 A3: メッセージ非表示時も要素は残し、内容を空にする（参照切れを防ぐ）。
        SPEC §6 A4: role="alert"（assertive）は使わない。1打鍵ごとの割り込み読み上げを避ける。
      */}
      <p id={ERROR_ID} className="rank-field__error" aria-live="polite">
        {errorMessage ?? ''}
      </p>
    </div>
  )
}
