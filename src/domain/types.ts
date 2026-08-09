// SPEC §7.3 主要な型（骨子）
//
// STAT_KEYS / SLOTS / SERIES は「型」と「表示順序」の両方を規定する（SPEC §11-3）。
// 定義順を変えると表示順が変わるため、順序の変更は表示への影響を確認してから行うこと。

export const STAT_KEYS = ['exploration', 'harvest', 'surveillance', 'range', 'favor'] as const
export type StatKey = (typeof STAT_KEYS)[number]
export type Stats = Readonly<Record<StatKey, number>>

// 艦体 / 艦尾 / 艦首 / 艦橋
export const SLOTS = ['hull', 'stern', 'bow', 'bridge'] as const
export type Slot = (typeof SLOTS)[number]

// 表示順もこの定義順（SPEC §3.2）
export const SERIES = ['shark', 'unkiu', 'whale', 'coelacanth', 'syldra'] as const
export type Series = (typeof SERIES)[number]

// SPEC §7.4:
// `surveillance`（＝監視／偵察）が日本語の「巡航」に対応している点は語感として不自然だが、
// FF14公式の英語ステータス名を一次情報で確認していないため【未確認】である。
// 旧データとの完全一致テスト（§8.2）の根拠を保つため、旧フィールド名をそのまま踏襲する。
// 日本語表記は labels.ts に分離しているので、後日確認できた時点で改名しても影響範囲は閉じる。

/**
 * StatKey ごとに値を計算して Stats を組み立てる。
 *
 * SPEC §7.3 のとおり、合計計算・6列グリッドの描画・性能表示をループ1本で書くための土台。
 * `Object.fromEntries` は戻り値の型を保てないため、キャストはこの1箇所に閉じ込める。
 */
export function mapStats(compute: (key: StatKey) => number): Stats {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, compute(key)])) as Stats
}

export type Part = {
  readonly id: string // `${series}-${improved ? 'kai' : 'std'}-${slot}`
  readonly slot: Slot
  readonly series: Series
  readonly improved: boolean
  readonly name: string // 導出値（SPEC §4.1）
  readonly cost: number
  readonly stats: Stats
}

export type RankBonus = {
  readonly rank: number
  readonly capacity: number
  readonly stats: Stats
}

// SPEC §2.1 の欠陥（「未入力」と「ランク1」を区別していないこと）を型で防ぐ。
// 判別可能ユニオンにすることで、`valid` のときだけ超過判定を行う実装が強制される。
export type RankState =
  | { readonly kind: 'empty' }
  | { readonly kind: 'invalid'; readonly reason: 'outOfRange' | 'notInteger' }
  | { readonly kind: 'valid'; readonly rank: number; readonly bonus: RankBonus }

export type Selections = Readonly<Record<Slot, Part | null>>

// ---- ViewModel（SPEC §7.1）----
//
// 計算・状態判定・表示値の決定は deriveViewModel() という1本の純関数の中で終わる。
// 「ランクが未入力なら警告を出さない」「値が負なら danger 色」「コストの分母を `—` にする」
// といった判断を JSX の条件分岐に埋め込まない。

/** SPEC §5.3 の意味づけに対応する色の種別。具体的な色は tokens.css が持つ */
export type CellColor = 'ink' | 'accent' | 'danger' | 'muted'

export type Cell = {
  readonly text: string
  readonly color: CellColor
}

/**
 * 6列ミニグリッド（SPEC §5.4）。
 * `leading` は1列目で、セクション01 ではキャパシティ、セクション02 ではコストを表す。
 */
export type MiniGrid = {
  readonly leading: Cell
  readonly stats: Readonly<Record<StatKey, Cell>>
}

export type ViewModel = {
  readonly rank: {
    readonly kind: RankState['kind']
    /** SPEC §6 A2: invalid のときのみ true */
    readonly ariaInvalid: boolean
    readonly errorMessage: string | null
    /** SPEC §5.4: 1列目はキャパシティ。ランクが valid でなければ全項目 `—` */
    readonly bonusGrid: MiniGrid
  }
  readonly parts: Readonly<Record<Slot, MiniGrid>>
  readonly totals: {
    /** コストの分子。超過時は danger（SPEC §3.4） */
    readonly cost: Cell
    /** コストの分母。ランクが valid でなければ `—`（SPEC §3.3.2） */
    readonly capacity: Cell
    readonly stats: Readonly<Record<StatKey, Cell>>
    /** SPEC §3.4: ランクが valid かつ超過時のみ文言を持つ */
    readonly overflowMessage: string | null
  }
}
