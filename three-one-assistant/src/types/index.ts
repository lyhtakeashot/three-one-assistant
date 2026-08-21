// ===== 院校核心类型 =====
export interface Campus {
  name: string
  address: string
}

export interface SchoolInfo {
  campuses: Campus[]
  website: string
  admissionsPhone: string
  consultQQ?: string
  tuitionGeneral: string
  tuitionSinoForeign?: string
  healthRestrictions?: string
}

export interface ExamFormat {
  hasWrittenTest: boolean
  hasInterview: boolean
  hasPhysicalTest: boolean
  writtenTestSubjects?: string[]
  interviewFormat?: 'individual' | 'group' | 'both'
  contentSummary: string
  tips: string
}

export interface TransferRestriction {
  restricted: boolean
  detail: string
}

export interface FormulaMeta {
  xuekao: {
    A: number
    B: number
    C: number
    D: number
    fullScore: number
  }
  xiaokao: { fullScore: number }
  gaokao: { fullScore: number }
  weights: {
    xuekao: number
    xiaokao: number
    gaokao: number
  }
}

export interface AdmissionData {
  year: number
  applicants: number
  passed: number
  admitted: number
  minScore?: number
  avgScore?: number
  xuekaoRequirement: string
}

export interface ScoreSegment {
  score: number
  rank: number
  cumulative: number
}

export interface Satisfaction {
  overall: number
  environment: number
  life: number
  source: string
}

export interface Dormitory {
  description: string
  score: number
  source: string
  highlights: string[]
  drawbacks: string[]
}

export interface ApplicationStep {
  step: number
  title: string
  description: string
  deadline?: string
  materials?: string[]
}

export interface Major {
  id: string
  schoolId: string
  name: string
  category: string
  requiredSubjects: string[]
  planCount?: number
}

export interface School {
  id: string
  name: string
  shortName: string
  aliases: string[]
  type: 'provincial' | 'ministry'
  info: SchoolInfo
  formula: FormulaMeta
  examFormat: ExamFormat
  transferRestriction: TransferRestriction
  majors: Major[]
  admission: AdmissionData[]
  satisfaction: Satisfaction
  dormitory: Dormitory
  applicationSteps: ApplicationStep[]
  scoreSegments?: ScoreSegment[]
}

// ===== 计算器类型 =====
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E'

export interface XuekaoEntry {
  subject: string
  grade: Grade
  isFuture?: boolean
}

export interface CalcInput {
  schoolId: string
  xuekaoGrades: XuekaoEntry[]
  xiaokaoScore: number | null
  gaokaoScore: number | null
}

export interface CalcResult {
  xuekaoConverted: number
  xuekaoFullScore: number
  xiaokaoNormalized: number
  gaokaoNormalized: number
  comprehensiveScore: number
  tier: 'reach' | 'match' | 'safety'
}

export interface CalcHistoryRecord {
  id: string
  date: string
  schoolName: string
  input: CalcInput
  result: CalcResult
}

// ===== 树洞类型 =====
export interface TreeholePost {
  id: string
  content: string
  created_at: string
  anonymous_id: string
}

export interface DataCorrection {
  id: string
  schoolId: string
  field: string
  description: string
  status: 'pending' | 'reviewed' | 'applied'
}

// ===== 筛选类型 =====
export type TierType = 'reach' | 'match' | 'safety' | 'all'

export interface FilterState {
  selectedSubjects: string[]
  minACount: number
  minBCount: number
  searchQuery: string
  tierFilter: TierType
  categoryFilter: string | null
}

// ===== 对比类型 =====
export interface CompareDiff {
  field: string
  label: string
  values: (string | number)[]
  advantage: number[]
  disadvantage: number[]
}

// ===== 档案类型 =====
export interface ProfileData {
  nickname: string
  grade: string
  targetSchools: string[]
  favorites: string[]
  materials: { schoolId: string; schoolName: string; items: { name: string; checked: boolean }[] }[]
  timelines: { date: string; title: string; schoolName: string; type: 'deadline' | 'exam' | 'result' }[]
}
