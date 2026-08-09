import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// SPEC §8.6 デザイントークン検証
//
// §5.1 は各トークンの値とコントラスト比を厳密に定義しているが、実装した CSS が
// その表と一致していることは、実行時テストにも手動確認にも現れない。
// §2 #12 が記録するモックアップ値への退行を機械的に検出することが本層の目的である。

const SRC_DIR = resolve(import.meta.dirname, '../../src')
const tokensCss = readFileSync(resolve(SRC_DIR, 'ui/styles/tokens.css'), 'utf8')
const indexCss = readFileSync(resolve(SRC_DIR, 'index.css'), 'utf8')

function parseTokens(css: string): ReadonlyMap<string, string> {
  const entries = new Map<string, string>()
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = match
    if (name !== undefined && value !== undefined) entries.set(name, value.trim())
  }
  return entries
}

/** 空白の入れ方の違いを吸収する（`rgba(23,32,26,…)` と `rgba(23, 32, 26, …)`） */
function normalize(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

/**
 * コメントを除去する。
 * 差し替え前の値（#e2554d 等）は「使ってはならない値」として CSS のコメントに
 * 書かれているため、コメントを含めたまま検索すると常に検出されてしまう。
 */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

const tokens = parseTokens(tokensCss)

// ---- WCAG の相対輝度・コントラスト比 ----
//
// 一次情報: W3C WAI「Relative luminance」https://www.w3.org/WAI/GL/wiki/Relative_luminance
//   L = 0.2126 * R + 0.7152 * G + 0.0722 * B
//   if RsRGB <= 0.03928 then R = RsRGB/12.92 else R = ((RsRGB+0.055)/1.055) ^ 2.4
// 一次情報: WCAG 2.1「contrast ratio」https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
//   (L1 + 0.05) / (L2 + 0.05)  （L1 が明るいほう）
//
// なお同 wiki には、IEC 標準の閾値は 0.04045 が正しいという errata がある
// （8bit 値では差は生じない）。ここは WCAG 本文の 0.03928 に合わせる。

function channelToLinear(value8bit: number): number {
  const channel = value8bit / 255
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex)
  if (match?.[1] === undefined) throw new Error(`6桁の16進表記ではない: ${hex}`)

  const value = Number.parseInt(match[1], 16)
  const red = (value >> 16) & 0xff
  const green = (value >> 8) & 0xff
  const blue = value & 0xff

  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue)
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

function tokenValue(name: string): string {
  const value = tokens.get(name)
  if (value === undefined) throw new Error(`トークンが定義されていない: ${name}`)
  return value
}

// SPEC §5.1 の表
const EXPECTED_COLORS: Readonly<Record<string, string>> = {
  '--bg': '#f7f6f0',
  '--ink': '#17201a',
  '--accent': '#2f6b4f',
  '--accent-strong': '#255741',
  '--danger': '#bd4034',
  '--text-2': '#525a53',
  '--text-muted': '#6b706a',
  '--rule': '#dcded4',
  '--on-accent': '#f7f6f0',
  '--overlay-ink': 'rgba(23,32,26,0.0625)',
}

// SPEC §5.2 のコードブロック
const EXPECTED_FONTS: Readonly<Record<string, string>> = {
  '--font-sans': 'system-ui, sans-serif',
  '--font-serif': 'ui-serif, serif',
  '--font-mono': 'ui-monospace, monospace',
}

describe('トークンの値が SPEC §5.1 / §5.2 の表と一致する', () => {
  it.each(Object.entries(EXPECTED_COLORS))('%s が %s である', (name, expected) => {
    expect(normalize(tokenValue(name))).toBe(normalize(expected))
  })

  it.each(Object.entries(EXPECTED_FONTS))('%s が %s である', (name, expected) => {
    expect(normalize(tokenValue(name))).toBe(normalize(expected))
  })

  it('表にないトークンを勝手に増やしていない', () => {
    const expectedNames = [...Object.keys(EXPECTED_COLORS), ...Object.keys(EXPECTED_FONTS)].sort()
    expect([...tokens.keys()].sort()).toEqual(expectedNames)
  })
})

// SPEC §5.1 が実測値として記録しているコントラスト比。
// 計算式（W3C 一次情報）と仕様の値を相互に検証する。
const EXPECTED_CONTRAST_AGAINST_BG: Readonly<Record<string, number>> = {
  '--ink': 15.42,
  '--accent': 5.81,
  '--accent-strong': 7.7,
  '--danger': 4.91,
  '--text-2': 6.58,
  '--text-muted': 4.67,
  '--rule': 1.26,
}

describe('コントラスト比が SPEC §5.1 の実測値と一致する', () => {
  it.each(Object.entries(EXPECTED_CONTRAST_AGAINST_BG))('%s の対 --bg が %s である', (name, expected) => {
    const ratio = contrastRatio(tokenValue(name), tokenValue('--bg'))
    expect(ratio).toBeCloseTo(expected, 2)
  })

  it('--on-accent の対 --accent が 5.81 である（緑ボタン上の文字）', () => {
    const ratio = contrastRatio(tokenValue('--on-accent'), tokenValue('--accent'))
    expect(ratio).toBeCloseTo(5.81, 2)
  })
})

// 小さい文字に用いる色はすべて WCAG 2.2 AA（4.5:1）以上
const AA_TOKENS_AGAINST_BG = [
  '--ink',
  '--accent',
  '--accent-strong',
  '--danger',
  '--text-2',
  '--text-muted',
] as const

describe('AA（4.5:1）を満たす', () => {
  it.each(AA_TOKENS_AGAINST_BG)('%s が対 --bg で 4.5:1 以上である', (name) => {
    expect(contrastRatio(tokenValue(name), tokenValue('--bg'))).toBeGreaterThanOrEqual(4.5)
  })

  it('--on-accent が対 --accent で 4.5:1 以上である', () => {
    expect(contrastRatio(tokenValue('--on-accent'), tokenValue('--accent'))).toBeGreaterThanOrEqual(4.5)
  })

  // --rule は装飾用の罫線であり AA の対象としない（SPEC §5.1）。
  // 対象外であることを、あえて満たさないことの確認として残す。
  it('--rule は装飾のみで AA を満たさない（対象外であることの確認）', () => {
    expect(contrastRatio(tokenValue('--rule'), tokenValue('--bg'))).toBeLessThan(4.5)
  })
})

// SPEC §2 #12 / §5.1: モックアップの値は AA を満たさないため差し替えている。
// **この差し替えを将来戻してしまう退行**を検出する。
describe('AA を満たさないモックアップの色に戻していない', () => {
  it.each([
    ['#e2554d', 'danger', 3.44],
    ['#8b9089', '補助テキスト', 3.01],
    ['#aeb2a9', '補助テキスト', 1.99],
  ])('%s（%s・%s:1）を使わない', (rejected) => {
    expect(normalize(stripComments(tokensCss))).not.toContain(normalize(rejected))
    expect(normalize(stripComments(indexCss))).not.toContain(normalize(rejected))
  })

  it('差し替えた値が AA を満たし、元の値が満たさないことを確認する', () => {
    const bg = tokenValue('--bg')
    expect(contrastRatio('#e2554d', bg)).toBeLessThan(4.5)
    expect(contrastRatio(tokenValue('--danger'), bg)).toBeGreaterThanOrEqual(4.5)
  })
})

// SPEC §1 / §5.2: 実行時の外部依存を持たない。フォントをアプリから配信せず、
// 外部フォントサービスへ通信もしない。
describe('外部依存を持たない', () => {
  it.each([
    ['tokens.css', tokensCss],
    ['index.css', indexCss],
  ])('%s が @font-face・外部URLを含まない', (_name, css) => {
    const declarations = stripComments(css)
    expect(declarations).not.toContain('@font-face')
    expect(declarations).not.toMatch(/https?:\/\//)
    expect(declarations).not.toMatch(/url\(/)
  })
})
