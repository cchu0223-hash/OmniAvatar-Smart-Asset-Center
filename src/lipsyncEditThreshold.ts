/**
 * AI对口型台词编辑：相对原稿偏差阈值（归一化 Levenshtein），用于落地页 EditorPane 与专业剪辑 LipSyncPanel 一致逻辑。
 */
export const LIPSYNC_EDIT_DEVIATION_THRESHOLD = 0.35

function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Uint16Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
      prev = tmp
    }
  }
  return dp[n]
}

/** 偏差比例 0~1，越大表示与原稿差异越大 */
export function lipsyncEditDeviationRatio(original: string, draft: string): number {
  const o = original ?? ''
  const d = draft ?? ''
  if (o === d) return 0
  const dist = levenshteinDistance(o, d)
  return dist / Math.max(o.length, d.length, 1)
}

export function isLipsyncEditOverThreshold(original: string, draft: string): boolean {
  return lipsyncEditDeviationRatio(original, draft) >= LIPSYNC_EDIT_DEVIATION_THRESHOLD
}
