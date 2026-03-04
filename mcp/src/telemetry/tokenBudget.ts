/**
 * Cubis Foundry MCP Server – deterministic token budget estimator.
 *
 * Estimates tokens by character count using a configurable chars/token ratio.
 * This is intentionally model-agnostic and marked as estimated.
 */

export const TOKEN_ESTIMATOR_VERSION = "char-estimator-v1";

export function normalizeCharsPerToken(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 4;
  return value;
}

export function estimateTokensFromCharCount(
  charCount: number,
  charsPerToken: number,
): number {
  const safeChars = Math.max(0, Math.ceil(charCount));
  const ratio = normalizeCharsPerToken(charsPerToken);
  return Math.ceil(safeChars / ratio);
}

export function estimateTokensFromText(
  text: string,
  charsPerToken: number,
): number {
  return estimateTokensFromCharCount(text.length, charsPerToken);
}

/**
 * Byte-size estimation is used for pointer-only operations where file content
 * is intentionally not loaded.
 */
export function estimateTokensFromBytes(
  byteCount: number,
  charsPerToken: number,
): number {
  return estimateTokensFromCharCount(byteCount, charsPerToken);
}

export function estimateSavings(
  fullCatalogEstimatedTokens: number,
  usedEstimatedTokens: number,
): { estimatedSavingsTokens: number; estimatedSavingsPercent: number } {
  const full = Math.max(0, Math.ceil(fullCatalogEstimatedTokens));
  const used = Math.max(0, Math.ceil(usedEstimatedTokens));
  if (full <= 0) {
    return {
      estimatedSavingsTokens: 0,
      estimatedSavingsPercent: 0,
    };
  }

  const estimatedSavingsTokens = Math.max(0, full - used);
  const estimatedSavingsPercent = Number(
    ((estimatedSavingsTokens / full) * 100).toFixed(2),
  );
  return {
    estimatedSavingsTokens,
    estimatedSavingsPercent,
  };
}

export interface SkillToolMetrics {
  estimatorVersion: string;
  charsPerToken: number;
  fullCatalogEstimatedTokens: number;
  responseEstimatedTokens: number;
  responseCharacterCount: number;
  selectedSkillsEstimatedTokens: number | null;
  loadedSkillEstimatedTokens: number | null;
  estimatedSavingsVsFullCatalog: number;
  estimatedSavingsVsFullCatalogPercent: number;
  estimated: true;
}

export function buildSkillToolMetrics({
  charsPerToken,
  fullCatalogEstimatedTokens,
  responseEstimatedTokens,
  selectedSkillsEstimatedTokens = null,
  loadedSkillEstimatedTokens = null,
  responseCharacterCount = 0,
}: {
  charsPerToken: number;
  fullCatalogEstimatedTokens: number;
  responseEstimatedTokens: number;
  selectedSkillsEstimatedTokens?: number | null;
  loadedSkillEstimatedTokens?: number | null;
  responseCharacterCount?: number;
}): SkillToolMetrics {
  const usedEstimatedTokens =
    loadedSkillEstimatedTokens ??
    selectedSkillsEstimatedTokens ??
    responseEstimatedTokens;
  const savings = estimateSavings(
    fullCatalogEstimatedTokens,
    usedEstimatedTokens,
  );

  return {
    estimatorVersion: TOKEN_ESTIMATOR_VERSION,
    charsPerToken: normalizeCharsPerToken(charsPerToken),
    fullCatalogEstimatedTokens: Math.max(0, fullCatalogEstimatedTokens),
    responseEstimatedTokens: Math.max(0, responseEstimatedTokens),
    responseCharacterCount: Math.max(0, responseCharacterCount),
    selectedSkillsEstimatedTokens:
      selectedSkillsEstimatedTokens === null
        ? null
        : Math.max(0, selectedSkillsEstimatedTokens),
    loadedSkillEstimatedTokens:
      loadedSkillEstimatedTokens === null
        ? null
        : Math.max(0, loadedSkillEstimatedTokens),
    estimatedSavingsVsFullCatalog: savings.estimatedSavingsTokens,
    estimatedSavingsVsFullCatalogPercent: savings.estimatedSavingsPercent,
    estimated: true,
  };
}
