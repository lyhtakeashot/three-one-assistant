import { useState, useMemo, useEffect } from 'react'
import { Calculator, RotateCcw, TrendingUp, History } from 'lucide-react'
import schoolsData from '@/data/schools.json'
import type { School, XuekaoEntry, Grade, CalcResult } from '@/types'
import { calcComprehensive, reverseCalcGaokao, reverseCalcXiaokao } from '@/lib/calculator'
import { SUBJECT_LIST } from '@/lib/constants'
import { addCalcHistory, getCalcHistory } from '@/lib/storage'
import { useCalcStore } from '@/stores/calcStore'

const schools = schoolsData as School[]

const GRADE_OPTIONS: { value: Grade; label: string }[] = [
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
]

export default function CalculatorPage() {
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward')
  const [selectedSchoolId, setSelectedSchoolId] = useState('')
  const [grades, setGrades] = useState<XuekaoEntry[]>(
    SUBJECT_LIST.map((s) => ({ subject: s, grade: 'B' as Grade }))
  )
  const [xiaokaoScore, setXiaokaoScore] = useState('')
  const [gaokaoScore, setGaokaoScore] = useState('')
  const [targetScore, setTargetScore] = useState('')
  const [result, setResult] = useState<CalcResult | null>(null)
  const [reverseGaokaoResult, setReverseGaokaoResult] = useState<number | null>(null)
  const [reverseXiaokaoResult, setReverseXiaokaoResult] = useState<number | null>(null)
  const [history, setHistory] = useState(getCalcHistory())
  const [showHistory, setShowHistory] = useState(false)

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId)

  const updateGrade = (subject: string, grade: Grade) => {
    setGrades((prev) => prev.map((g) => (g.subject === subject ? { ...g, grade } : g)))
  }

  const calcForward = () => {
    if (!selectedSchool) return
    const calcResult = calcComprehensive(
      {
        schoolId: selectedSchoolId,
        xuekaoGrades: grades,
        xiaokaoScore: xiaokaoScore ? Number(xiaokaoScore) : null,
        gaokaoScore: gaokaoScore ? Number(gaokaoScore) : null,
      },
      selectedSchool
    )
    setResult(calcResult)
    if (calcResult) {
      const record = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('zh-CN'),
        schoolName: selectedSchool.name,
        input: { schoolId: selectedSchoolId, xuekaoGrades: grades, xiaokaoScore: Number(xiaokaoScore), gaokaoScore: Number(gaokaoScore) },
        result: calcResult,
      }
      addCalcHistory(record)
      setHistory(getCalcHistory())
    }
  }

  const calcReverse = () => {
    if (!selectedSchool || !targetScore) return
    const gk = reverseCalcGaokao(Number(targetScore), grades, xiaokaoScore ? Number(xiaokaoScore) : 0, selectedSchool)
    const xk = reverseCalcXiaokao(Number(targetScore), grades, gaokaoScore ? Number(gaokaoScore) : 0, selectedSchool)
    setReverseGaokaoResult(gk)
    setReverseXiaokaoResult(xk)
  }

  const totalA = grades.filter((g) => g.grade === 'A').length
  const totalB = grades.filter((g) => g.grade === 'B').length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fadeIn">
      <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Calculator size={22} className="text-primary-500" />
        综合分计算器
      </h1>

      {/* Mode Switch */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('forward')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'forward' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          正算模式
        </button>
        <button
          onClick={() => setMode('reverse')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'reverse' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          反向推算
        </button>
      </div>

      {/* School Select */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <label className="text-xs font-medium text-slate-500 mb-2 block">选择目标院校</label>
        <select
          value={selectedSchoolId}
          onChange={(e) => {
            setSelectedSchoolId(e.target.value)
            setResult(null)
            setReverseGaokaoResult(null)
            setReverseXiaokaoResult(null)
          }}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">请选择院校</option>
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}（{s.shortName}）</option>
          ))}
        </select>
      </div>

      {/* Formula Display */}
      {selectedSchool && (
        <div className="bg-primary-50 rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-primary-700 mb-1">该校综合分公式</p>
          <p className="text-xs text-primary-600 leading-relaxed">
            综合分 = 学考折算分 × {selectedSchool.formula.weights.xuekao * 100}% + 校测 × {selectedSchool.formula.weights.xiaokao * 100}% + 高考折算分 × {selectedSchool.formula.weights.gaokao * 100}%
          </p>
          <p className="text-xs text-primary-500 mt-1">
            A={selectedSchool.formula.xuekao.A}分 B={selectedSchool.formula.xuekao.B}分 C={selectedSchool.formula.xuekao.C}分 D={selectedSchool.formula.xuekao.D}分
          </p>
          <p className="text-xs text-slate-300 mt-1">数据来源：{selectedSchool.name}招生章程</p>
        </div>
      )}

      {/* Grade Input */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-700 text-sm">学考等级输入</h3>
          <span className="text-xs text-slate-400">A:{totalA} B:{totalB}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {grades.map((g) => (
            <div key={g.subject} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-600 w-10">{g.subject}</span>
              <select
                value={g.grade}
                onChange={(e) => updateGrade(g.subject, e.target.value as Grade)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm flex-1"
              >
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Score Inputs */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              校测预估分 {selectedSchool ? `(满分${selectedSchool.formula.xiaokao.fullScore})` : ''}
            </label>
            <input
              type="number"
              value={xiaokaoScore}
              onChange={(e) => setXiaokaoScore(e.target.value)}
              placeholder="如 85"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              高考预估分 {selectedSchool ? `(满分${selectedSchool.formula.gaokao.fullScore})` : ''}
            </label>
            <input
              type="number"
              value={gaokaoScore}
              onChange={(e) => setGaokaoScore(e.target.value)}
              placeholder="如 620"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>
      </div>

      {/* Calculate Button */}
      {mode === 'forward' ? (
        <button
          onClick={calcForward}
          disabled={!selectedSchoolId}
          className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600 transition-colors disabled:bg-slate-200 disabled:text-slate-400 mb-4"
        >
          <Calculator size={16} className="inline mr-1.5" />
          计算综合分
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-card">
            <label className="text-xs font-medium text-slate-500 mb-2 block">目标综合分（你想达到的分数）</label>
            <input
              type="number"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              placeholder="如 85"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <button
            onClick={calcReverse}
            disabled={!selectedSchoolId || !targetScore}
            className="w-full py-3 rounded-xl bg-accent-yellow text-white font-medium text-sm hover:bg-amber-600 transition-colors disabled:bg-slate-200 disabled:text-slate-400 mb-4"
          >
            <TrendingUp size={16} className="inline mr-1.5" />
            反向推算
          </button>
        </div>
      )}

      {/* Forward Result */}
      {mode === 'forward' && result && (
        <div className="bg-white rounded-2xl p-5 shadow-card animate-slideUp mb-4">
          <h3 className="font-semibold text-slate-800 mb-3">计算结果</h3>
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-primary-600 animate-countUp">{result.comprehensiveScore}</p>
            <p className="text-xs text-slate-400 mt-1">综合分</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">学考折算分</span>
              <span className="text-slate-700">{result.xuekaoConverted}/{result.xuekaoFullScore}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">校测成绩</span>
              <span className="text-slate-700">{result.xiaokaoNormalized}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">高考折算分</span>
              <span className="text-slate-700">{result.gaokaoNormalized}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">冲稳保判定</span>
              <span className={`font-medium ${
                result.tier === 'reach' ? 'text-primary-600' : result.tier === 'match' ? 'text-accent-green' : 'text-slate-500'
              }`}>
                {result.tier === 'reach' ? '冲刺' : result.tier === 'match' ? '稳妥' : '保底'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reverse Result */}
      {mode === 'reverse' && (reverseGaokaoResult !== null || reverseXiaokaoResult !== null) && (
        <div className="bg-white rounded-2xl p-5 shadow-card animate-slideUp mb-4">
          <h3 className="font-semibold text-slate-800 mb-3">推算结果</h3>
          {reverseGaokaoResult !== null && reverseXiaokaoResult !== null && selectedSchool && (
            <div className="space-y-3">
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-600 mb-1">若校测为 {xiaokaoScore || '?'} 分</p>
                <p className="text-lg font-bold text-amber-700">
                  高考需要 ≥ {reverseGaokaoResult} 分
                </p>
              </div>
              <div className="bg-primary-50 rounded-xl p-4">
                <p className="text-xs text-primary-600 mb-1">若高考为 {gaokaoScore || '?'} 分</p>
                <p className="text-lg font-bold text-primary-700">
                  校测需要 ≥ {reverseXiaokaoResult} 分
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <History size={16} />
            计算历史
          </span>
          <span className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {showHistory && (
          <div className="px-4 pb-4 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无计算记录</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <p className="text-slate-600 font-medium">{item.schoolName}</p>
                      <p className="text-slate-400">{item.date}</p>
                    </div>
                    <span className="text-primary-600 font-bold">{item.result.comprehensiveScore}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
