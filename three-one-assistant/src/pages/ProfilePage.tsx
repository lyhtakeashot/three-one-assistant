import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Calendar, Heart, ClipboardList, Download, Camera } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import schoolsData from '@/data/schools.json'
import type { School, ProfileData } from '@/types'
import { generateMarkdown, downloadMarkdown } from '@/lib/export'
import { saveProfile, getProfile } from '@/lib/storage'

const schools = schoolsData as School[]

export default function ProfilePage() {
  const { favorites } = useFavorites()
  const [profile, setProfile] = useState<ProfileData>({
    nickname: '',
    grade: '高三',
    targetSchools: [],
    favorites: [],
    materials: [],
    timelines: [],
  })

  const favoriteSchools = schools.filter((s) => favorites.includes(s.id))

  useEffect(() => {
    const saved = getProfile()
    if (saved) setProfile(saved)
  }, [])

  useEffect(() => {
    // Auto-update timelines from favorites
    const timelines: ProfileData['timelines'] = []
    favoriteSchools.forEach((s) => {
      s.applicationSteps.forEach((step) => {
        if (step.deadline) {
          timelines.push({
            date: step.deadline.replace('月', '-').replace('日', ''),
            title: step.title,
            schoolName: s.shortName,
            type: step.step === 4 ? 'result' : 'deadline',
          })
        }
      })
    })
    setProfile((p) => ({ ...p, timelines, favorites }))
    saveProfile({ ...profile, timelines, favorites })
  }, [favorites])

  const handleExport = () => {
    if (favoriteSchools.length === 0) return
    const md = generateMarkdown(favoriteSchools)
    downloadMarkdown(md)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User size={22} className="text-primary-500" />
          我的三一档案
        </h1>
        <button
          onClick={handleExport}
          disabled={favoriteSchools.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-xs font-medium hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
        >
          <Download size={14} />
          导出方案
        </button>
      </div>

      {/* Nickname */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <input
          type="text"
          value={profile.nickname}
          onChange={(e) => {
            setProfile({ ...profile, nickname: e.target.value })
            saveProfile({ ...profile, nickname: e.target.value })
          }}
          placeholder="给自己起个昵称吧"
          maxLength={10}
          className="w-full text-lg font-medium text-slate-700 placeholder-slate-300 outline-none"
        />
        <p className="text-xs text-slate-400 mt-1">数据仅存储在本地浏览器</p>
      </div>

      {/* Favorite Schools */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <h3 className="font-medium text-slate-700 text-sm mb-3 flex items-center gap-2">
          <Heart size={16} className="text-red-400" />
          目标院校 ({favoriteSchools.length})
        </h3>
        {favoriteSchools.length === 0 ? (
          <p className="text-sm text-slate-400">
            还没有收藏院校，
            <Link to="/schools" className="text-primary-500">去添加</Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favoriteSchools.map((s) => (
              <Link
                key={s.id}
                to={`/schools/${s.id}`}
                className="px-3 py-1.5 bg-slate-50 rounded-lg text-sm text-slate-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                {s.shortName}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <h3 className="font-medium text-slate-700 text-sm mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary-500" />
          重要时间节点
        </h3>
        {profile.timelines.length === 0 ? (
          <p className="text-sm text-slate-400">收藏院校后自动生成时间线</p>
        ) : (
          <div className="space-y-3">
            {[...profile.timelines]
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((tl, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="text-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mt-1.5" />
                    {idx < profile.timelines.length - 1 && <div className="w-0.5 h-full bg-slate-100 mx-auto mt-1" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{tl.title}</p>
                    <p className="text-xs text-slate-400">{tl.schoolName} · {tl.date}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Materials */}
      <div className="bg-white rounded-2xl p-4 shadow-card">
        <h3 className="font-medium text-slate-700 text-sm mb-3 flex items-center gap-2">
          <ClipboardList size={16} className="text-primary-500" />
          报名材料清单
        </h3>
        {favoriteSchools.length === 0 ? (
          <p className="text-sm text-slate-400">收藏院校后自动汇总所需材料</p>
        ) : (
          <div className="space-y-3">
            {favoriteSchools.map((s) => {
              const allMaterials = s.applicationSteps
                .flatMap((step) => step.materials || [])
                .filter((v, i, a) => a.indexOf(v) === i)

              return (
                <div key={s.id} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-slate-600 mb-2">{s.shortName}</p>
                  <div className="space-y-1.5">
                    {allMaterials.map((mat) => (
                      <label key={mat} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary-500" />
                        <span className="text-xs text-slate-500">{mat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
