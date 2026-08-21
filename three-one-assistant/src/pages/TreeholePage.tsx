import { useState, useEffect } from 'react'
import { MessageCircle, Send, RefreshCw, AlertTriangle } from 'lucide-react'
import { getAnonymousSession } from '@/lib/supabase'
import type { TreeholePost } from '@/types'

// 使用模拟数据作为 fallback
const MOCK_POSTS: TreeholePost[] = [
  { id: '1', content: '杭电的校测难度怎么样？有过来人分享一下吗？', created_at: '2026-03-15 14:30', anonymous_id: 'user_001' },
  { id: '2', content: '浙财面试是无领导小组讨论，建议大家多练练表达', created_at: '2026-03-14 10:15', anonymous_id: 'user_002' },
  { id: '3', content: '学考7A3B，想冲浙大计算机，有希望吗？', created_at: '2026-03-13 21:00', anonymous_id: 'user_003' },
  { id: '4', content: '三位一体录取后转专业真的可以吗？有没有学长学姐能说说实际情况？', created_at: '2026-03-12 16:45', anonymous_id: 'user_004' },
  { id: '5', content: '温大住宿条件不错，茶山校区环境超好！', created_at: '2026-03-11 09:20', anonymous_id: 'user_005' },
]

export default function TreeholePage() {
  const [posts, setPosts] = useState<TreeholePost[]>(MOCK_POSTS)
  const [newPost, setNewPost] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getAnonymousSession().then((session) => {
      setIsConnected(!!session)
    })
  }, [])

  const handleSubmit = () => {
    if (!newPost.trim() || submitting) return
    setSubmitting(true)

    // 模拟提交
    const post: TreeholePost = {
      id: Date.now().toString(),
      content: newPost.trim(),
      created_at: new Date().toLocaleString('zh-CN'),
      anonymous_id: 'anon_' + Math.random().toString(36).slice(2, 8),
    }

    setTimeout(() => {
      setPosts([post, ...posts])
      setNewPost('')
      setSubmitting(false)
    }, 300)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageCircle size={22} className="text-primary-500" />
          树洞
        </h1>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isConnected ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-slate-300'}`} />
          {isConnected ? '匿名在线' : '本地模式'}
        </div>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">友善发言，互相帮助</p>
          <p className="mt-0.5 text-amber-600">树洞为匿名发布，请勿透露个人隐私信息。不当言论将被删除。</p>
        </div>
      </div>

      {/* Post Form */}
      <div className="bg-white rounded-2xl p-4 shadow-card mb-4">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="分享你的三一经验、困惑或心情..."
          maxLength={500}
          rows={3}
          className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 transition-all placeholder-slate-300"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-300">{newPost.length}/500</span>
          <button
            onClick={handleSubmit}
            disabled={!newPost.trim() || submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
          >
            <Send size={14} />
            {submitting ? '发送中...' : '匿名发布'}
          </button>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl p-4 shadow-card">
            <p className="text-sm text-slate-600 leading-relaxed">{post.content}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-300">{post.anonymous_id}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-300">{post.created_at}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <button
        onClick={() => {}}
        className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        <RefreshCw size={14} />
        加载更多
      </button>
    </div>
  )
}
