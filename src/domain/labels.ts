import type { Series, Slot, StatKey } from './types.ts'

export const SLOT_LABELS: Readonly<Record<Slot, string>> = {
  hull: '艦体',
  stern: '艦尾',
  bow: '艦首',
  bridge: '艦橋',
}

// 系統ラベルは「級」を含まない語幹である。
// パーツ名の導出（SPEC §4.1）で `{系統ラベル} + 級 / 改級 + {部位ラベル}` と連結するため。
// `<optgroup>` のラベル（SPEC §3.2 の「シャーク級」）は `${SERIES_LABELS[s]}級` で組み立てる。
export const SERIES_LABELS: Readonly<Record<Series, string>> = {
  shark: 'シャーク',
  unkiu: 'ウンキウ',
  whale: 'ホエール',
  coelacanth: 'シーラカンス',
  syldra: 'シルドラ',
}

// フィールド名と日本語表記の対応は、SPEC §4.2 が記録するランク135の値
// 「探査100 / 収集130 / 巡航90 / 航続120 / 運95」と、旧データのランク135の行
// 「exploration: 100, harvest: 130, surveillance: 90, range: 120, favor: 95」の一致から定まる。
//
// なお `surveillance`（＝監視／偵察）と「巡航」の対応が語感として不自然である点は
// SPEC §7.4 のとおり【未確認】である。改名する場合の影響範囲はこのファイルに閉じる。
export const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  exploration: '探査',
  harvest: '収集',
  surveillance: '巡航',
  range: '航続',
  favor: '運',
}

/** コストの列見出し（セクション02・03） */
export const COST_LABEL = 'コスト'

/**
 * キャパシティの列見出し（セクション01）。
 *
 * 「キャパシティ」のままだと他の項目名（2文字）と釣り合わず、この列だけが広くなるため
 * 表示は短縮形にする。支援技術には CAPACITY_LABEL_FULL を aria-label で伝える。
 */
export const CAPACITY_LABEL = 'キャパ'
export const CAPACITY_LABEL_FULL = 'キャパシティ'
