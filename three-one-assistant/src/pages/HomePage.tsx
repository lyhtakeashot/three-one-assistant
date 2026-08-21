import { Link } from 'react-router-dom'
import { GraduationCap, Calculator, Search, ArrowRight, Users, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="gradient-hero px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-primary-600 font-medium mb-6">
            <GraduationCap size={16} />
            浙江高考生专属
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">
            三位一体，不止一条路
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            学考成绩 + 校测表现 + 高考分数，三个维度综合录取。
            <br className="hidden md:block" />
            帮你找到最适合的三一院校，制定最优报考策略。
          </p>

          {/* Quick Entry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Link
              to="/schools"
              className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary-100 transition-colors">
                <Search size={24} className="text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">院校筛选</h3>
              <p className="text-xs text-slate-400">按选科和学考条件查找</p>
            </Link>

            <Link
              to="/calculator"
              className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-yellow/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent-yellow/20 transition-colors">
                <Calculator size={24} className="text-accent-yellow" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">综合分计算</h3>
              <p className="text-xs text-slate-400">正算反算都支持</p>
            </Link>

            <Link
              to="/profile"
              className="group bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 card-hover"
            >
              <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-accent-green/20 transition-colors">
                <Users size={24} className="text-accent-green" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">我的档案</h3>
              <p className="text-xs text-slate-400">收藏院校与时间管理</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Step Guide */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">三位一体录取流程</h2>
        <p className="text-sm text-slate-400 text-center mb-10">三步走，每一步都关键</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: '学考报名',
              desc: '查看各校学考等级要求，选择符合条件的目标院校，准备报名材料。学考等级越高，可选择的院校越多。',
              color: 'primary',
            },
            {
              step: '02',
              title: '校测考核',
              desc: '参加目标院校的综合素质测试，包括笔试和面试。校测成绩占比25%，是区分度的关键环节。',
              color: 'accent-yellow',
            },
            {
              step: '03',
              title: '高考录取',
              desc: '高考后综合分排名录取。注意：提前批只能填报一所三位一体院校，选稳不选冲。',
              color: 'accent-green',
            },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-card text-center">
                <span className={`inline-block w-12 h-12 rounded-full text-white font-bold text-lg leading-[48px] mb-4 ${
                  item.color === 'primary' ? 'bg-primary-500' : item.color === 'accent-yellow' ? 'bg-accent-yellow' : 'bg-accent-green'
                }`}>
                  {item.step}
                </span>
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-300">
                  <ArrowRight size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Important Notice */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 mb-2">重要提醒：提前批只能报一所</h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              省属三位一体在高考提前批录取，每位考生只能填报<strong>一所院校</strong>的一志愿。
              这意味着你需要谨慎权衡"冲一冲"和"稳一稳"——一旦被三一录取，将不再参与后续普通批次录取。
              建议结合自己的学考成绩、预估高考分和校测把握，理性选择目标院校。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
