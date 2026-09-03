import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, X, Plus, Trash2, Download, AlertTriangle } from 'lucide-react'
import schoolsData from '@/data/schools.json'
import type { School } from '@/types'
import { generateCompareMd, downloadMarkdown } from '@/lib/export'

const schools = schoolsData as School[]
const MAX_COMPARE = 5

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [showSelector, setShowSelector] = useState(false)

  const compareSchools = schools.filter((s) => compareIds.includes(s.id))

  const addSchool = (id: string) => {
    if (compareIds.length >= MAX_COMPARE) return
    if (compareIds.includes(id)) return
    setCompareIds([...compareIds, id])
    setShowSelector(false)
  }

  const removeSchool = (id: string) => {
    setCompareIds(compareIds.filter((i) => i !== id))
  }

  const baseSchool = compareSchools[0]

  const getDiffStyle = (school: School, field: string, value: string | number, idx: number) => {
    if (idx === 0 || !baseSchool) return ''
    const baseVal = getFieldValue(baseSchool, field)
    if (field === 'tuition' || field === 'score') {
      const a = typeof value === 'string' ? parseFloat(value) : value
      const b = typeof baseVal === 'string' ? parseFloat(baseVal) : baseVal
      if (a < b) return 'bg-green-50 text-green-700'
      if (a > b) return 'bg-red-50 text-red-700'
    }
    return ''
  }

  const getFieldValue = (school: School, field: string): string | number => {
    switch (field) {
      case 'type': return school.type === 'ministry' ? '部属' : '省属'
      case 'campus': return school.info.campuses[0]?.name || '-'
      case 'tuition': return parseInt(school.info.tuitionGeneral) || 0
      case 'written': return school.examFormat.hasWrittenTest ? '有' : '无'
      case 'interview': return school.examFormat.hasInterview ? '有' : '无'
      case 'restrict': return school.transferRestriction.restricted ? '是' : '否'
      case 'score': return school.admission[0]?.minScore || 0
      case 'satisfaction': return school.satisfaction.overall
      default: return '-'
    }
  }

  const rows = [
    { field: 'type', label: '院校类型' },
    { field: 'campus', label: '校区' },
    { field: 'tuition', label: '学费' },
    { field: 'written', label: '笔试' },
    { field: 'interview', label: '面试' },
    { field: 'restrict', label: '转专业限制' },
    { field: 'score', label: '往年最低录取分' },
    { field: 'satisfaction', label: '满意度' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link to="/schools" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">院校对比</h1>
        </div>
        <div className="flex gap-2">
          {compareSchools.length > 0 && (
            <button
              onClick={() => {
                const md = generateCompareMd(compareSchools)
                downloadMarkdown(md, '院校对比报告.md')
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Download size={14} />
              导出
            </button>
          )}
          <button
            onClick={() => setShowSelector(true)}
            disabled={compareIds.length >= MAX_COMPARE}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 transition-colors disabled:bg-slate-200 disabled:text-slate-400"
          >
            <Plus size={14} />
            添加院校
          </button>
        </div>
      </div>

      {/* Warning */}
      {compareSchools.length === 1 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          以最左侧院校为基准线，<span className="text-green-600 font-medium">绿色</span>为优势，<span className="text-red-600 font-medium">红色</span>为劣势
        </div>
      )}

      {/* Compare Table */}
      {compareSchools.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left p-4 text-slate-400 font-medium text-xs w-28">对比项目</th>
                {compareSchools.map((school, idx) => (
                  <th key={school.id} className="p-4 text-center min-w-[140px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-700">{school.shortName}</p>
                        <p className="text-xs text-slate-400">{school.name}</p>
                      </div>
                      <button
                        onClick={() => removeSchool(school.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors ml-2"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.field} className="border-b border-slate-50">
                  <td className="p-4 text-slate-500 font-medium">{row.label}</td>
                  {compareSchools.map((school, idx) => {
                    const val = getFieldValue(school, row.field)
                    const diffClass = getDiffStyle(school, row.field, val, idx)
                    return (
                      <td key={school.id} className={`p-4 text-center ${diffClass}`}>
                        {typeof val === 'number' && row.field === 'satisfaction' ? `${val}/5` : val}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-400">添加院校开始对比（最多 {MAX_COMPARE} 所）</p>
        </div>
      )}

      {/* Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">添加对比院校</h3>
              <button onClick={() => setShowSelector(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[55vh] space-y-2">
              {schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => addSchool(school.id)}
                  disabled={compareIds.includes(school.id)}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <p className="font-medium text-slate-700 text-sm">{school.name}</p>
                  <p className="text-xs text-slate-400">{school.shortName} · {school.info.campuses[0]?.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
