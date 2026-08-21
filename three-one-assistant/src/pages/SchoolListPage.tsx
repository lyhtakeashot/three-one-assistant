import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import schoolsData from '@/data/schools.json'
import type { School } from '@/types'
import { filterSchools, determineTier } from '@/lib/filter'
import { useFavorites } from '@/hooks/useFavorites'
import { SUBJECTS, MAJOR_CATEGORIES } from '@/lib/constants'
import type { FilterState, TierType } from '@/types'

const schools = schoolsData as School[]

export default function SchoolListPage() {
  const { favorites, toggle } = useFavorites()
  const [showFilter, setShowFilter] = useState(false)
  const [filter, setFilter] = useState<FilterState>({
    selectedSubjects: [],
    minACount: 0,
    minBCount: 0,
    searchQuery: '',
    tierFilter: 'all',
    categoryFilter: null,
  })

  const filteredResults = useMemo(() => {
    return filterSchools(schools, filter)
  }, [filter])

  const getTierColor = (tier: TierType) => {
    if (tier === 'reach') return 'tag-tier-reach'
    if (tier === 'match') return 'tag-tier-match'
    return 'tag-tier-safety'
  }

  const getTierLabel = (tier: TierType) => {
    if (tier === 'reach') return '冲刺'
    if (tier === 'match') return '稳妥'
    return '保底'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="搜索院校名称，如"杭电"、"浙财"..."
          value={filter.searchQuery}
          onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
            showFilter ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-card animate-slideUp space-y-4">
          {/* Subject Filter */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">选科筛选</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const updated = filter.selectedSubjects.includes(s)
                      ? filter.selectedSubjects.filter((x) => x !== s)
                      : [...filter.selectedSubjects, s]
                    setFilter({ ...filter, selectedSubjects: updated })
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter.selectedSubjects.includes(s)
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Xuekao Filter */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">学考最低要求</label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">A等</span>
                <select
                  value={filter.minACount}
                  onChange={(e) => setFilter({ ...filter, minACount: Number(e.target.value) })}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n}>{n}个</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">B等</span>
                <select
                  value={filter.minBCount}
                  onChange={(e) => setFilter({ ...filter, minBCount: Number(e.target.value) })}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
                >
                  {[0,1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n}>{n}个</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">专业大类</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter({ ...filter, categoryFilter: null })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  !filter.categoryFilter ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全部
              </button>
              {MAJOR_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter({ ...filter, categoryFilter: c })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter.categoryFilter === c ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Tier Filter */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">冲稳保筛选</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'reach', label: '冲刺' },
                { value: 'match', label: '稳妥' },
                { value: 'safety', label: '保底' },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilter({ ...filter, tierFilter: t.value as TierType })}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    filter.tierFilter === t.value
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => setFilter({
              selectedSubjects: [], minACount: 0, minBCount: 0,
              searchQuery: '', tierFilter: 'all', categoryFilter: null,
            })}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            重置筛选条件
          </button>
        </div>
      )}

      {/* Results */}
      <div>
        <p className="text-xs text-slate-400 mb-3">
          共找到 <span className="font-medium text-slate-600">{filteredResults.length}</span> 所院校
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResults.map(({ school, tier }) => (
            <div
              key={school.id}
              className="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden card-hover"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/schools/${school.id}`} className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{school.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{school.shortName}</p>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); toggle(school.id) }}
                    className={`flex-shrink-0 ml-2 p-1.5 rounded-lg transition-all ${
                      favorites.includes(school.id)
                        ? 'text-red-400 hover:text-red-500'
                        : 'text-slate-300 hover:text-red-300'
                    }`}
                  >
                    <svg
                      width="18" height="18" viewBox="0 0 24 24"
                      fill={favorites.includes(school.id) ? 'currentColor' : 'none'}
                      stroke="currentColor" strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTierColor(tier)}`}>
                    {getTierLabel(tier)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {school.type === 'ministry' ? '部属院校' : '省属院校'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-400">校区：</span>
                    {school.info.campuses[0]?.name || '-'}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-400">学费：</span>
                    {school.info.tuitionGeneral}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-400">校测：</span>
                    {[
                      school.examFormat.hasWrittenTest && '笔试',
                      school.examFormat.hasInterview && '面试',
                      school.examFormat.hasPhysicalTest && '体测',
                    ].filter(Boolean).join('+')}
                  </p>
                  {school.admission[0] && (
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-400">学考要求：</span>
                      {school.admission[0].xuekaoRequirement}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {school.majors.slice(0, 3).map((m) => (
                    <span key={m.id} className="px-2 py-0.5 bg-slate-50 rounded-md text-xs text-slate-500">
                      {m.name}
                    </span>
                  ))}
                  {school.majors.length > 3 && (
                    <span className="px-2 py-0.5 text-xs text-slate-400">
                      +{school.majors.length - 3}
                    </span>
                  )}
                </div>

                <Link
                  to={`/schools/${school.id}`}
                  className="block w-full text-center py-2 rounded-lg bg-primary-50 text-primary-600 text-sm font-medium hover:bg-primary-100 transition-colors"
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredResults.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">没有找到匹配的院校</p>
            <p className="text-sm text-slate-300 mt-1">尝试调整筛选条件</p>
          </div>
        )}
      </div>

      {/* Notice */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs text-amber-700 leading-relaxed">
          ⚠️ <strong>重要提醒：</strong>省属三位一体在高考提前批录取，只能填报<strong>一所院校</strong>。
          建议综合分析后谨慎选择，"冲一冲"固然诱人，"稳一稳"才是保障。
        </p>
      </div>
    </div>
  )
}
