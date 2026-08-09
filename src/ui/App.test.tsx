// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { MAX_RANK, RANK_ERROR_MESSAGES } from '../domain/ranks.ts'
import App from './App.tsx'

afterEach(cleanup)

function rankInput(): HTMLInputElement {
  return screen.getByLabelText('ランク')
}

function errorText(): string {
  return document.getElementById('rank-error')?.textContent ?? ''
}

function warningText(): string {
  const region = document.querySelector('.totals__warning')
  return region?.textContent ?? ''
}

/** 部位の行の値セル（セレクトのセルを除く6列） */
function partRowValues(slotLabel: string): string[] {
  const table = screen.getByRole('table', { name: '部位ごとのパーツ選択と性能' })
  const row = within(table).getByRole('row', { name: new RegExp(slotLabel) })
  return within(row)
    .getAllByRole('cell')
    .slice(1)
    .map((cell) => cell.textContent ?? '')
}

/** ランクボーナスの6列（見出し行の次の行） */
function bonusRowValues(): string[] {
  const table = screen.getByRole('table', { name: 'ランクボーナス' })
  const row = within(table).getAllByRole('row')[1]
  if (row === undefined) throw new Error('ランクボーナスの行が見つからない')
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent ?? '')
}

function totalsValue(term: string): string {
  const item = screen.getByText(term, { selector: 'dt' }).parentElement
  return item?.querySelector('dd')?.textContent ?? ''
}

// SPEC §8.3: §3.1.2 の各入力パターンで、状態・エラーメッセージの有無・文言が一致する
describe('ランク入力とエラー表示', () => {
  it.each([
    ['80', ''],
    ['01', ''],
    ['１３５', ''],
    ['+1', RANK_ERROR_MESSAGES.notInteger],
    ['-1', RANK_ERROR_MESSAGES.notInteger],
    ['1.5', RANK_ERROR_MESSAGES.notInteger],
    ['1e2', RANK_ERROR_MESSAGES.notInteger],
    ['12a', RANK_ERROR_MESSAGES.notInteger],
    ['0', RANK_ERROR_MESSAGES.outOfRange],
    [String(MAX_RANK + 1), RANK_ERROR_MESSAGES.outOfRange],
  ])('"%s" のエラー文言が仕様どおりである', async (input, expected) => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), input)

    expect(errorText()).toBe(expected)
  })

  it('初期状態ではエラーを出さない', () => {
    render(<App />)
    expect(errorText()).toBe('')
    expect(rankInput()).toHaveAttribute('aria-invalid', 'false')
  })

  it('不正入力で aria-invalid が true になり、修正すると false に戻る', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '12a')
    expect(rankInput()).toHaveAttribute('aria-invalid', 'true')

    await user.clear(rankInput())
    await user.type(rankInput(), '80')
    expect(rankInput()).toHaveAttribute('aria-invalid', 'false')
    expect(errorText()).toBe('')
  })

  it('blur で valid な入力だけが正準表現に整形される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '01')
    await user.tab()
    expect(rankInput()).toHaveValue('1')

    await user.clear(rankInput())
    await user.type(rankInput(), '12a')
    await user.tab()
    expect(rankInput()).toHaveValue('12a')
  })
})

describe('ランクボーナスの表示', () => {
  it('ランク未確定では全項目が `—` である', () => {
    render(<App />)
    expect(bonusRowValues()).toEqual(['—', '—', '—', '—', '—', '—'])
  })

  it('ランク135 でキャパシティとボーナスが表示される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '135')

    // SPEC §4.2: ランク135 は 探査100 / 収集130 / 巡航90 / 航続120 / 運95、キャパシティ80
    expect(bonusRowValues()).toEqual(['80', '+100', '+130', '+90', '+120', '+95'])
  })

  it('ランク1〜49 のボーナスは 0 で、`+0` にはならない', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '1')

    expect(bonusRowValues()).toEqual(['20', '0', '0', '0', '0', '0'])
  })
})

describe('パーツ選択と性能表示', () => {
  it('未選択の部位は全項目が `—` である', () => {
    render(<App />)
    expect(partRowValues('艦体')).toEqual(['—', '—', '—', '—', '—', '—'])
  })

  it('パーツを選ぶとミニグリッドが更新される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-std-hull')

    // シャーク級艦体: コスト5 / 探査-10 / 収集+30 / 巡航+20 / 航続+40 / 運+20
    expect(partRowValues('艦体')).toEqual(['5', '-10', '+30', '+20', '+40', '+20'])
  })

  it('未選択に戻すと `—` に戻る', async () => {
    const user = userEvent.setup()
    render(<App />)
    const select = screen.getByLabelText('艦尾')

    await user.selectOptions(select, 'shark-std-stern')
    expect(partRowValues('艦尾')).not.toEqual(['—', '—', '—', '—', '—', '—'])

    await user.selectOptions(select, '')
    expect(partRowValues('艦尾')).toEqual(['—', '—', '—', '—', '—', '—'])
  })

  it('4部位すべてのセレクトが label と関連付いている', () => {
    render(<App />)
    for (const label of ['艦体', '艦尾', '艦首', '艦橋']) {
      expect(screen.getByLabelText(label), label).toHaveRole('combobox')
    }
  })
})

// SPEC §3.4 キャパシティ超過判定
describe('キャパシティ超過警告', () => {
  it('ランク valid かつ超過時に超過量つきで表示される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '1')
    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-kai-hull')
    await user.selectOptions(screen.getByLabelText('艦尾'), 'shark-std-stern')

    // ランク1 のキャパシティ 20 に対し 20 + 5 = 25
    expect(totalsValue('コスト')).toBe('25 / 20')
    expect(warningText()).toBe('⚠ キャパシティを 5 超過')
  })

  // SPEC §2.1 の欠陥の回帰防止
  it('ランク未入力ではパーツを選んでも警告が出ない', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-kai-hull')

    expect(warningText()).toBe('')
    expect(totalsValue('コスト')).toBe('20 / —')
  })

  it('ランクが invalid でも警告が出ない', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '0')
    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-kai-hull')

    expect(warningText()).toBe('')
  })

  it('超過が解消すると警告が消える', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '1')
    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-kai-hull')
    await user.selectOptions(screen.getByLabelText('艦尾'), 'shark-std-stern')
    expect(warningText()).not.toBe('')

    await user.clear(rankInput())
    await user.type(rankInput(), '135')
    expect(warningText()).toBe('')
  })

  it('警告の要素は常に存在し aria-live="polite" を持つ', () => {
    render(<App />)
    const region = document.querySelector('.totals__warning')

    expect(region).not.toBeNull()
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).not.toHaveAttribute('role', 'alert')
  })
})

describe('総合ステータス', () => {
  it('初期状態は コスト `0 / —`、5ステータスは 0 である', () => {
    render(<App />)

    expect(totalsValue('コスト')).toBe('0 / —')
    for (const term of ['探査', '収集', '巡航', '航続', '運']) {
      expect(totalsValue(term), term).toBe('0')
    }
  })

  it('ランク未確定でもパーツ合計を表示する（SPEC §3.3.2）', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-std-hull')

    expect(totalsValue('探査')).toBe('-10')
    expect(totalsValue('収集')).toBe('30')
    expect(totalsValue('コスト')).toBe('5 / —')
  })

  it('ランクボーナスを加算する', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '135')
    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-std-hull')

    expect(totalsValue('探査')).toBe('90') // -10 + 100
    expect(totalsValue('収集')).toBe('160') // 30 + 130
    expect(totalsValue('コスト')).toBe('5 / 80')
  })
})

// SPEC §3.5 リセット
describe('リセット', () => {
  it('ランク・4部位・エラー状態が初期化される', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(rankInput(), '12a')
    await user.selectOptions(screen.getByLabelText('艦体'), 'shark-kai-hull')
    await user.selectOptions(screen.getByLabelText('艦尾'), 'shark-std-stern')

    await user.click(screen.getByRole('button', { name: '選択をリセット' }))

    expect(rankInput()).toHaveValue('')
    expect(errorText()).toBe('')
    expect(screen.getByLabelText('艦体')).toHaveValue('')
    expect(screen.getByLabelText('艦尾')).toHaveValue('')
    expect(totalsValue('コスト')).toBe('0 / —')
    expect(partRowValues('艦体')).toEqual(['—', '—', '—', '—', '—', '—'])
  })

  it('リセット後もボタンにフォーカスが残る', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: '選択をリセット' })

    await user.click(button)

    expect(button).toHaveFocus()
  })
})

// SPEC §6 A6・A8
describe('キーボード操作と文書構造', () => {
  it('正の tabindex を使わない', () => {
    render(<App />)
    for (const element of Array.from(document.querySelectorAll('[tabindex]'))) {
      expect(Number(element.getAttribute('tabindex'))).toBeLessThanOrEqual(0)
    }
  })

  it('DOM 上の操作要素の出現順が ランク → 4部位 → リセット である', () => {
    render(<App />)
    const controls = Array.from(document.querySelectorAll('input, select, button'))

    expect(controls.map((element) => element.id || element.textContent)).toEqual([
      'rank-input',
      'part-hull',
      'part-stern',
      'part-bow',
      'part-bridge',
      '選択をリセット',
    ])
  })

  it('Tab で全操作要素に到達できる', async () => {
    const user = userEvent.setup()
    render(<App />)

    const expected = [
      rankInput(),
      screen.getByLabelText('艦体'),
      screen.getByLabelText('艦尾'),
      screen.getByLabelText('艦首'),
      screen.getByLabelText('艦橋'),
      screen.getByRole('button', { name: '選択をリセット' }),
    ]

    for (const element of expected) {
      await user.tab()
      expect(element).toHaveFocus()
    }
  })

  it('見出しが h1 → h2 の構造である', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      '01潜水艦ランク',
      '02パーツ選択',
      '03総合ステータス',
    ])
  })

  // SPEC §6 A8: セクション番号「01」等は装飾のため aria-hidden="true"
  it('セクション番号と行番号が装飾として隠される', () => {
    render(<App />)

    const sectionNumbers = Array.from(document.querySelectorAll('.section__number'))
    expect(sectionNumbers.map((element) => element.textContent)).toEqual(['01', '02', '03'])

    const rowNumbers = Array.from(document.querySelectorAll('.grid__row-number'))
    expect(rowNumbers.map((element) => element.textContent)).toEqual(['01', '02', '03', '04'])

    for (const element of [...sectionNumbers, ...rowNumbers]) {
      expect(element, element.textContent ?? '').toHaveAttribute('aria-hidden', 'true')
    }
  })
})
