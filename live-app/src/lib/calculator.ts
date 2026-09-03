import type { School, CalcInput, CalcResult, XuekaoEntry, FormulaMeta, TierType } from '@/types'
import { TIER_CONFIG } from './constants'

// 计算学考折算分
export function calcXuekaoScore(grades: XuekaoEntry[], formula: FormulaMeta): number {
  return grades.reduce((sum, entry) => {
    const score = formula.xuekao[entry.grade] ?? 0
    return sum + score
  }, 0)
}

// 归一化工夫（高考分换算成满分制）
export function normalizeScore(rawScore: number, sourceFull: number, targetFull: number): number {
  return (rawScore / sourceFull) * targetFull
}

// 综合分计算
export function calcComprehensive(input: CalcInput, school: School): CalcResult | null {
  const { formula } = school
  if (!formula) return null

  const xuekaoConverted = calcXuekaoScore(input.xuekaoGrades, formula)
  const xiaokaoScore = input.xiaokaoScore ?? 0
  const gaokaoScore = input.gaokaoScore ?? 0

  const comprehensiveScore =
    xuekaoConverted * formula.weights.xuekao +
    xiaokaoScore * formula.weights.xiaokao +
    normalizeScore(gaokaoScore, formula.gaokao.fullScore, 100) * formula.weights.gaokao

  const tier = determineTier(comprehensiveScore, school)

  return {
    xuekaoConverted,
    xuekaoFullScore: formula.xuekao.fullScore,
    xiaokaoNormalized: xiaokaoScore,
    gaokaoNormalized: normalizeScore(gaokaoScore, formula.gaokao.fullScore, 100),
    comprehensiveScore: Math.round(comprehensiveScore * 100) / 100,
    tier,
  }
}

// 帮冲稳保判定
function determineTier(score: number, school: School): TierType {
  const latestAdmission = school.admission?.[0]
  if (!latestAdmission?.minScore) return 'match'

  const normalizedScore = score / 100
  const normalizedMin = latestAdmission.minScore / 100
  const diff = normalizedScore - normalizedMin

  if (diff > TIER_CONFIG.REACH_THRESHOLD) return 'safety'
  if (diff < TIER_CONFIG.MATCH_LOWER) return 'reach'
  return 'match'
}

// 反向推算：给定综合分目标，求所需高考分（固定校测分）
export function reverseCalcGaokao(
  targetScore: number,
  xuekaoGrades: XuekaoEntry[],
  xiaokaoScore: number,
  school: School
): number | null {
  const { formula } = school
  if (!formula) return null

  const xuekaoPart = calcXuekaoScore(xuekaoGrades, formula) * formula.weights.xuekao
  const xiaokaoPart = xiaokaoScore * formula.weights.xiaokao
  const neededGaokaoPart = targetScore - xuekaoPart - xiaokaoPart

  if (neededGaokaoPart < 0) return 0

  const gaokaoRaw = (neededGaokaoPart / formula.weights.gaokao) * (formula.gaokao.fullScore / 100)
  return Math.ceil(gaokaoRaw)
}

// 反向推算：给定综合分目标，求所需校测分（固定高考分）
export function reverseCalcXiaokao(
  targetScore: number,
  xuekaoGrades: XuekaoEntry[],
  gaokaoScore: number,
  school: School
): number | null {
  const { formula } = school
  if (!formula) return null

  const xuekaoPart = calcXuekaoScore(xuekaoGrades, formula) * formula.weights.xuekao
  const gaokaoPart = normalizeScore(gaokaoScore, formula.gaokao.fullScore, 100) * formula.weights.gaokao
  const neededXiaokaoPart = targetScore - xuekaoPart - gaokaoPart

  if (neededXiaokaoPart < 0) return 0

  return Math.round((neededXiaokaoPart / formula.weights.xiaokao) * 100) / 100
}
