import { useRef, useState } from 'react'
import { CAPACITY_LABEL, COST_LABEL, SLOT_LABELS, STAT_LABELS } from '../domain/labels.ts'
import { findPartById } from '../domain/parts.ts'
import { SLOTS, STAT_KEYS } from '../domain/types.ts'
import type { Selections, Slot } from '../domain/types.ts'
import { deriveViewModel, INITIAL_RANK_INPUT, INITIAL_SELECTIONS } from '../domain/view-model.ts'
import { PartSelector, partSelectId } from './components/PartSelector.tsx'
import { RankField } from './components/RankField.tsx'
import { StatGrid } from './components/StatGrid.tsx'
import { TotalsSection } from './components/TotalsSection.tsx'

function StatColumnHeaders() {
  return (
    <>
      {STAT_KEYS.map((key) => (
        <th className="grid__head" scope="col" key={key}>
          {STAT_LABELS[key]}
        </th>
      ))}
    </>
  )
}

export default function App() {
  // 入力欄に表示する文字列と、判定に使う文字列を分けて持つ。
  // SPEC §3.1.3: IME変換中は入力欄だけが変わり、判定は直前の結果を維持する。
  const [rankInput, setRankInput] = useState(INITIAL_RANK_INPUT)
  const [judgedRankInput, setJudgedRankInput] = useState(INITIAL_RANK_INPUT)
  const [selections, setSelections] = useState<Selections>(INITIAL_SELECTIONS)
  const resetButtonRef = useRef<HTMLButtonElement>(null)

  const viewModel = deriveViewModel(judgedRankInput, selections)

  function commitRankInput(value: string) {
    setRankInput(value)
    setJudgedRankInput(value)
  }

  function handleSelectPart(slot: Slot, partId: string) {
    setSelections((previous) => ({ ...previous, [slot]: partId === '' ? null : findPartById(partId) }))
  }

  // SPEC §3.5: ランク入力・4部位の選択・全表示・エラー状態を初期状態に戻す。
  // リセット後もボタンにフォーカスを残す。
  function handleReset() {
    setRankInput(INITIAL_RANK_INPUT)
    setJudgedRankInput(INITIAL_RANK_INPUT)
    setSelections(INITIAL_SELECTIONS)
    resetButtonRef.current?.focus()
  }

  return (
    <main className="page">
      <header className="page__header">
        <p className="eyebrow">SUBMARINE PARTS CALCULATOR</p>
        <p className="eyebrow eyebrow--secondary">FINAL FANTASY XIV</p>
        <h1 className="page__title">FF14潜水艦パーツ組み合わせ計算ツール</h1>
      </header>

      <section className="section" aria-labelledby="section-rank">
        <h2 className="section__title" id="section-rank">
          <span className="section__number" aria-hidden="true">
            01
          </span>
          潜水艦ランク
        </h2>

        <RankField
          value={rankInput}
          errorMessage={viewModel.rank.errorMessage}
          ariaInvalid={viewModel.rank.ariaInvalid}
          onValueChange={setRankInput}
          onCommit={commitRankInput}
        />

        <table className="grid">
          <caption className="visually-hidden">ランクボーナス</caption>
          <thead>
            <tr>
              <th className="grid__head" scope="col">
                {CAPACITY_LABEL}
              </th>
              <StatColumnHeaders />
            </tr>
          </thead>
          <tbody>
            <tr>
              <StatGrid grid={viewModel.rank.bonusGrid} />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section" aria-labelledby="section-parts">
        <h2 className="section__title" id="section-parts">
          <span className="section__number" aria-hidden="true">
            02
          </span>
          パーツ選択
        </h2>

        <table className="grid grid--parts">
          <caption className="visually-hidden">部位ごとのパーツ選択と性能</caption>
          <thead>
            <tr>
              {/* 列見出しは視覚的には不要だが、支援技術のために残す。
                  th 自体を隠すと列数がずれるため、中身だけを隠す */}
              <th scope="col">
                <span className="visually-hidden">部位</span>
              </th>
              <th scope="col">
                <span className="visually-hidden">パーツ</span>
              </th>
              <th className="grid__head" scope="col">
                {COST_LABEL}
              </th>
              <StatColumnHeaders />
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, index) => (
              <tr key={slot}>
                <th className="grid__row-head" scope="row">
                  <span className="grid__row-number" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <label htmlFor={partSelectId(slot)}>{SLOT_LABELS[slot]}</label>
                </th>
                <td className="grid__control">
                  <PartSelector slot={slot} selected={selections[slot]} onChange={handleSelectPart} />
                </td>
                <StatGrid grid={viewModel.parts[slot]} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <TotalsSection totals={viewModel.totals} />

      <div className="actions">
        {/* 破壊的操作のため主ボタン（緑）にはせず、枠線スタイルとする（SPEC §5.5.1） */}
        <button className="button button--outline" type="button" ref={resetButtonRef} onClick={handleReset}>
          選択をリセット
        </button>
      </div>
    </main>
  )
}
