import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, GraduationCap, Calculator, Heart, User, MessageCircle, HelpCircle } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: GraduationCap },
  { path: '/schools', label: '院校查询', icon: GraduationCap },
  { path: '/calculator', label: '综合分计算', icon: Calculator },
  { path: '/compare', label: '院校对比', icon: HelpCircle },
  { path: '/favorites', label: '收藏夹', icon: Heart },
  { path: '/profile', label: '我的档案', icon: User },
  { path: '/faq', label: '常见问题', icon: HelpCircle },
  { path: '/treehole', label: '树洞', icon: MessageCircle },
]

export default function Header() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">3一</span>
          </div>
          <span className="font-bold text-base hidden sm:block">三位一体辅助系统</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-slate-600 hover:text-primary-600 transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg animate-slideUp">
          <div className="px-2 py-2 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
