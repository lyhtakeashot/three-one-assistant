import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import schoolsData from '@/data/schools.json'
import type { School } from '@/types'

const schools = schoolsData as School[]

export default function FavoritesPage() {
  const { favorites, toggle } = useFavorites()
  const favoriteSchools = schools.filter((s) => favorites.includes(s.id))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      <h1 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Heart size={22} className="text-red-400" />
        我的收藏
      </h1>
      <p className="text-sm text-slate-400 mb-6">收藏的院校会保存在本地浏览器中</p>

      {favoriteSchools.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Heart size={32} className="text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">还没有收藏的院校</p>
          <Link to="/schools" className="text-primary-500 text-sm mt-2 inline-block">去院校列表看看</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteSchools.map((school) => (
            <div key={school.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base">{school.shortName[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/schools/${school.id}`} className="font-medium text-slate-700 hover:text-primary-600 transition-colors">
                  {school.name}
                </Link>
                <p className="text-xs text-slate-400">{school.info.campuses[0]?.name}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/schools/${school.id}`}
                  className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => toggle(school.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
