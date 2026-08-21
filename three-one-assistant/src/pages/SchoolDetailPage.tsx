import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Phone, ExternalLink, AlertTriangle, MapPin, DollarSign, Users, TrendingUp, Star, Home, BookOpen, ClipboardList } from 'lucide-react'
import schoolsData from '@/data/schools.json'
import type { School } from '@/types'
import { useFavorites } from '@/hooks/useFavorites'
import { useState } from 'react'

const schools = schoolsData as School[]

type TabKey = 'overview' | 'exam' | 'data' | 'life'

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const school = schools.find((s) => s.id === id)
  const { favorites, toggle } = useFavorites()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  if (!school) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400 text-lg">未找到该院校信息</p>
        <Link to="/schools" className="text-primary-500 text-sm mt-4 inline-block">返回院校列表</Link>
      </div>
    )
  }

  const isFav = favorites.includes(school.id)
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '概览', icon: <BookOpen size={16} /> },
    { key: 'exam', label: '校测', icon: <ClipboardList size={16} /> },
    { key: 'data', label: '数据', icon: <TrendingUp size={16} /> },
    { key: 'life', label: '生活', icon: <Home size={16} /> },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Back & Favorite */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/schools" className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors">
          <ArrowLeft size={16} />
          返回列表
        </Link>
        <button
          onClick={() => toggle(school.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isFav ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Heart size={16} fill={isFav ? 'currentColor' : 'none'} />
          {isFav ? '已收藏' : '收藏'}
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{school.shortName[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800">{school.name}</h1>
            <p className="text-sm text-slate-400">{school.type === 'ministry' ? '部属院校' : '省属院校'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {school.info.campuses.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 rounded-md text-xs text-slate-500">
                  <MapPin size={12} /> {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Warning */}
      {school.transferRestriction.restricted && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">转专业限制提醒</p>
            <p className="text-xs text-red-600 mt-0.5">{school.transferRestriction.detail}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-primary-500" />
              基本信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 text-xs">办学地点</span>
                  <p className="text-slate-600">{school.info.campuses.map((c) => `${c.name}（${c.address}）`).join('；')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 text-xs">学费标准</span>
                  <p className="text-slate-600">{school.info.tuitionGeneral}</p>
                  {school.info.tuitionSinoForeign && (
                    <p className="text-amber-600 text-xs mt-0.5">中外合作：{school.info.tuitionSinoForeign}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 text-xs">招办电话</span>
                  <p className="text-slate-600">{school.info.admissionsPhone}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ExternalLink size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 text-xs">官方网站</span>
                  <a href={school.info.website} target="_blank" rel="noopener" className="text-primary-500 text-sm break-all">
                    {school.info.website}
                  </a>
                </div>
              </div>
              {school.info.healthRestrictions && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-400 text-xs">体检限制</span>
                    <p className="text-amber-700 text-xs">{school.info.healthRestrictions}</p>
                  </div>
                </div>
              )}
              {school.info.consultQQ && (
                <div className="flex items-start gap-2">
                  <Users size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-slate-400 text-xs">咨询QQ群</span>
                    <p className="text-slate-600">{school.info.consultQQ}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Majors */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3">招生专业</h3>
            <div className="space-y-2">
              {school.majors.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.requiredSubjects.length > 0 ? (
                      <span className="px-2 py-0.5 bg-primary-50 rounded text-xs text-primary-600">
                        {m.requiredSubjects.join('+')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-400">不限</span>
                    )}
                    {m.planCount && (
                      <span className="text-xs text-slate-400">招{m.planCount}人</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Steps */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-4">报名流程</h3>
            <div className="space-y-4">
              {school.applicationSteps.map((step) => (
                <div key={step.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-600">{step.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-slate-700 text-sm">{step.title}</h4>
                      {step.deadline && (
                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{step.deadline}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                    {step.materials && step.materials.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {step.materials.map((mat) => (
                          <span key={mat} className="px-2 py-0.5 bg-amber-50 rounded text-xs text-amber-700">
                            {mat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exam' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3">校测形式</h3>
            <div className="flex gap-3 mb-4">
              <div className={`px-4 py-2 rounded-xl text-sm font-medium ${school.examFormat.hasWrittenTest ? 'bg-primary-50 text-primary-700' : 'bg-slate-50 text-slate-400'}`}>
                笔试：{school.examFormat.hasWrittenTest ? '有' : '无'}
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm font-medium ${school.examFormat.hasInterview ? 'bg-accent-green/10 text-accent-green' : 'bg-slate-50 text-slate-400'}`}>
                面试：{school.examFormat.hasInterview ? '有' : '无'}
              </div>
              <div className={`px-4 py-2 rounded-xl text-sm font-medium ${school.examFormat.hasPhysicalTest ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-400'}`}>
                体测：{school.examFormat.hasPhysicalTest ? '有' : '无'}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              {school.examFormat.hasWrittenTest && school.examFormat.writtenTestSubjects && (
                <div>
                  <span className="text-slate-400">笔试科目：</span>
                  <span className="text-slate-600">{school.examFormat.writtenTestSubjects.join('、')}</span>
                </div>
              )}
              {school.examFormat.hasInterview && school.examFormat.interviewFormat && (
                <div>
                  <span className="text-slate-400">面试形式：</span>
                  <span className="text-slate-600">
                    {school.examFormat.interviewFormat === 'individual' ? '个体面试' : school.examFormat.interviewFormat === 'group' ? '无领导小组讨论' : '个体面试 + 群面'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400">内容概要：</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{school.examFormat.contentSummary}</p>
              </div>
              <div className="bg-primary-50 rounded-xl p-3">
                <span className="text-primary-600 text-xs font-medium">备考建议：</span>
                <p className="text-primary-700 text-xs mt-1 leading-relaxed">{school.examFormat.tips}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          {/* Formula */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-500" />
              综合分计算公式
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <p className="text-slate-700 mb-2">
                综合分 = 学考折算分 × {school.formula.weights.xuekao * 100}% + 校测成绩 × {school.formula.weights.xiaokao * 100}% + 高考折算分 × {school.formula.weights.gaokao * 100}%
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>学考折算：A={school.formula.xuekao.A}分 B={school.formula.xuekao.B}分 C={school.formula.xuekao.C}分 D={school.formula.xuekao.D}分（满分{school.formula.xuekao.fullScore}分）</p>
                <p>校测满分：{school.formula.xiaokao.fullScore}分 | 高考满分：{school.formula.gaokao.fullScore}分</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 mt-2">数据来源：{school.name}招生章程</p>
          </div>

          {/* Competition */}
          {school.admission.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h3 className="font-semibold text-slate-800 mb-3">历年竞争比</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 text-xs">
                      <th className="pb-2">年份</th>
                      <th className="pb-2">报名人数</th>
                      <th className="pb-2">初审入围</th>
                      <th className="pb-2">最终录取</th>
                      <th className="pb-2">报录比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {school.admission.map((ad) => (
                      <tr key={ad.year} className="border-t border-slate-50">
                        <td className="py-2">{ad.year}</td>
                        <td className="py-2">{ad.applicants}</td>
                        <td className="py-2">{ad.passed}</td>
                        <td className="py-2 font-medium">{ad.admitted}</td>
                        <td className="py-2 text-slate-400">{(ad.applicants / ad.admitted).toFixed(1)}:1</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-300 mt-2">数据来源：{school.name}招生网历年公示</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'life' && (
        <div className="space-y-4">
          {/* Satisfaction */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Star size={18} className="text-amber-400" />
              学生满意度
            </h3>
            <div className="space-y-3">
              {[
                { label: '综合满意度', value: school.satisfaction.overall },
                { label: '校园环境', value: school.satisfaction.environment },
                { label: '生活条件', value: school.satisfaction.life },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 w-20 flex-shrink-0">{item.label}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-8 text-right">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-300 mt-3">数据来源：{school.satisfaction.source}</p>
          </div>

          {/* Dormitory */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Home size={18} className="text-primary-500" />
              住宿条件
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{school.dormitory.description}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {school.dormitory.highlights.map((h) => (
                <span key={h} className="px-2 py-0.5 bg-green-50 rounded text-xs text-green-600">{h}</span>
              ))}
            </div>
            {school.dormitory.drawbacks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {school.dormitory.drawbacks.map((d) => (
                  <span key={d} className="px-2 py-0.5 bg-red-50 rounded text-xs text-red-500">{d}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-slate-400">评分：</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.floor(school.dormitory.score) ? '#F59E0B' : 'none'}
                    stroke={i < Math.floor(school.dormitory.score) ? '#F59E0B' : '#CBD5E1'}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-300">{school.dormitory.source}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
