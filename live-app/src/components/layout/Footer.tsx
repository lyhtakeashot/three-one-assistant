export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-6 px-4 mt-auto">
      <div className="max-w-7xl mx-auto text-center text-xs text-slate-400 space-y-1">
        <p>数据来源：浙江省教育考试院 · 各高校招生网 · 阳光高考网</p>
        <p>
          <span className="text-slate-300">仅供考生参考，请以官方最新公告为准。</span>
          <span className="mx-2">|</span>
          <a href="https://github.com" target="_blank" rel="noopener" className="text-primary-500 hover:text-primary-600 transition-colors">
            GitHub
          </a>
        </p>
      </div>
    </footer>
  )
}
