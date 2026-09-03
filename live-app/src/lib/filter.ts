import type { School, FilterState, TierType } from '@/types'
import { TIER_CONFIG } from './constants'

// 选科匹配检查
export function checkSubjectMatch(school: School, selectedSubjects: string[]): boolean {
  if (selectedSubjects.length === 0) return true
  return school.majors.some((major) => {
    if (major.requiredSubjects.length === 0) return true
    return major.requiredSubjects.every((s) => selectedSubjects.includes(s))
  })
}

// 学考条件检查
export function checkXuekaoRequirement(school: School, minA: number, minB: number): boolean {
  if (minA === 0 && minB === 0) return true
  const req = school.admission?.[0]?.xuekaoRequirement
  if (!req) return true

  const aMatch = req.match(/(\d+)A/)
  const bMatch = req.match(/(\d+)B/)
  const requiredA = aMatch ? parseInt(aMatch[1]) : 0
  const requiredB = bMatch ? parseInt(bMatch[1]) : 0

  return minA >= requiredA && (minA + minB) >= (requiredA + requiredB)
}

// 冲稳保判定
export function determineTier(school: School, userXuekaoScore: number): TierType {
  const latestAdmission = school.admission?.[0]
  if (!latestAdmission?.minScore) return 'match'

  const threshold = latestAdmission.minScore * TIER_CONFIG.REACH_THRESHOLD

  if (userXuekaoScore > latestAdmission.minScore + threshold) return 'safety'
  if (userXuekaoScore < latestAdmission.minScore - threshold) return 'reach'
  return 'match'
}

// 全面筛选（同时检查选科、学考条件、搜素）
export function filterSchools(
  schools: School[],
  filter: FilterState,
  userXuekaoScore?: number
): { school: School; tier: TierType }[] {
  const { selectedSubjects, minACount, minBCount, searchQuery, tierFilter, categoryFilter } = filter

  return schools
    .filter((school) => checkSubjectMatch(school, selectedSubjects))
    .filter((school) => checkXuekaoRequirement(school, minACount, minBCount))
    .filter((school) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const matchName = school.name.toLowerCase().includes(q)
      const matchShort = school.shortName.toLowerCase().includes(q)
      const matchAlias = school.aliases.some((a) => a.toLowerCase().includes(q))
      return matchName || matchShort || matchAlias
    })
    .filter((school) => {
      if (!categoryFilter) return true
      return school.majors.some((m) => m.category === categoryFilter)
    })
    .map((school) => {
      const tier = userXuekaoScore
        ? determineTier(school, userXuekaoScore)
        : 'match'
      return { school, tier }
    })
    .filter(({ tier }) => tierFilter === 'all' || tier === tierFilter)
}
