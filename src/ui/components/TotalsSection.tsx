import { COST_LABEL, STAT_LABELS } from '../../domain/labels.ts'
import { STAT_KEYS } from '../../domain/types.ts'
import type { ViewModel } from '../../domain/types.ts'
import { cellClassName } from './StatGrid.tsx'

const HEADING_ID = 'section-totals'

/**
 * SPEC §3.3 / §3.4 セクション03 総合ステータス。
 *
 * 超過警告は見出し行に置く。v1.0 の画面上部の赤背景バナーをやめたのは、
 * 表示・非表示でページ全体が上下に跳ね、スクロール位置がずれるためである（SPEC §2 #5）。
 * 警告要素は常に描画し、内容の有無だけを切り替える（高さを一定に保つ）。
 */
export function TotalsSection({ totals }: { readonly totals: ViewModel['totals'] }) {
  return (
    <section className="section" aria-labelledby={HEADING_ID}>
      <div className="section__head">
        <h2 className="section__title" id={HEADING_ID}>
          <span className="section__number" aria-hidden="true">
            03
          </span>
          総合ステータス
        </h2>
        {/* SPEC §6 A4: 動的な警告は aria-live="polite" で通知する（role="alert" は使わない） */}
        <p className="totals__warning" aria-live="polite">
          {totals.overflowMessage ?? ''}
        </p>
      </div>

      <dl className="totals">
        <div className="totals__item">
          <dt className="totals__term">{COST_LABEL}</dt>
          <dd className="totals__value">
            <span className={cellClassName(totals.cost)}>{totals.cost.text}</span>
            <span className="totals__separator"> / </span>
            <span className={cellClassName(totals.capacity)}>{totals.capacity.text}</span>
          </dd>
        </div>

        {STAT_KEYS.map((key) => (
          <div className="totals__item" key={key}>
            <dt className="totals__term">{STAT_LABELS[key]}</dt>
            <dd className="totals__value">
              <span className={cellClassName(totals.stats[key])}>{totals.stats[key].text}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
