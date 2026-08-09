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
