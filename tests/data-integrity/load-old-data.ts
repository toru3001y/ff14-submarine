import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// SPEC §8.2:
// old/parts-data.js と old/rank-bonus-data.js は素の `const X = ...` スクリプトである。
// **これらのファイルを一切変更せず**、テスト側でテキストとして読み込み `new Function()` で
// 評価して比較する。
const OLD_DIR = resolve(import.meta.dirname, '../../old')

export type OldPart = {
  readonly name: string
  readonly cost: number
  readonly exploration: number
  readonly harvest: number
  readonly surveillance: number
  readonly range: number
  readonly favor: number
}

export type OldRankBonus = {
  readonly rank: number
  readonly capacity: number
  readonly exploration: number
  readonly harvest: number
  readonly surveillance: number
  readonly range: number
  readonly favor: number
}

function evalOldScript<T>(fileName: string, varName: string): T {
  const source = readFileSync(resolve(OLD_DIR, fileName), 'utf8')
  return new Function(`${source}\nreturn ${varName};`)() as T
}

/** 旧パーツデータ。キーは部位の日本語ラベル（艦体 / 艦尾 / 艦首 / 艦橋） */
export function loadOldParts(): Readonly<Record<string, readonly OldPart[]>> {
  return evalOldScript('parts-data.js', 'partsData')
}

export function loadOldRankBonuses(): readonly OldRankBonus[] {
  return evalOldScript('rank-bonus-data.js', 'rankBonusData')
}
