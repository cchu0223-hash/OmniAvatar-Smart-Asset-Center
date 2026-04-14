/**
 * AI对口型目标语言列表（与落地页 EditorPane、专业剪辑 LipSyncPanel 共用）
 * 格式：「语言名 · 代码」与 PRD 8 种语言一致
 */
export const LIPSYNC_TARGET_LANGUAGES = [
  '中文 · ZH',
  '英语 · EN',
  '日语 · JA',
  '韩语 · KO',
  '俄语 · RU',
  '阿拉伯语 · AR',
  '西班牙语 · ES',
  '粤语 · YUE',
] as const

export type LipsyncTargetLanguage = (typeof LIPSYNC_TARGET_LANGUAGES)[number]

/** 运行时用于下拉等场景的 string[] */
export const lipsyncTargetLanguageList: string[] = [...LIPSYNC_TARGET_LANGUAGES]
