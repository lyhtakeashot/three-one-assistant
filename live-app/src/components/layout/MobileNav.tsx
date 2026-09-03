import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, Calculator, Heart, User } from 'lucide-react'

const MOBILE_ITEMS = [
  { path: '/', label: '首页', icon: GraduationCap },
  { path: '/schools', label: '院校', icon: GraduationCap },
  { path: '/calculator', label: '计算器', icon: Calculator },
  { path: '/favorites', label: '收藏', icon: Heart },
  { path: '/profile', label: '档案', icon: User },
]

export default function MobileNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 px-2 pb-safe">
      <div className="flex items-center justify-around h-14">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg min-w-[56px] transition-all ${
                isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
