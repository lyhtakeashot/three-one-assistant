import { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { FAQ_DATA } from '@/lib/constants'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fadeIn">
      <h1 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <HelpCircle size={22} className="text-primary-500" />
        常见问题
      </h1>
      <p className="text-sm text-slate-400 mb-6">关于三位一体招生的常见疑问解答</p>

      <div className="space-y-3">
        {FAQ_DATA.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-card overflow-hidden transition-all">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-700 text-sm pr-4">{item.q}</span>
              <ChevronDown
                size={18}
                className={`text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4 animate-slideUp">
                <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 rounded-xl p-4">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
