// 个人作品页面 - 参考 stitch_immersive_wizard_prd-8/code.html + screen.png

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MediaTab = '音频' | '视频'
type ContentFilter = '便捷创作' | '专业剪辑' | 'AI视频编导'
type WorkStatus = 'approved' | 'processing'

interface Work {
  id: string
  title: string
  creator: string
  status: WorkStatus
  createdAt: string
  duration?: string
  expiry?: string
  hasVideoIcon?: boolean // use green videocam icon instead of checkbox
}

const NAV_ITEMS: { label: string; key: string }[] = [
  { label: '账户信息', key: 'account' },
  { label: '我的作品', key: 'works' },
  { label: '草稿箱', key: 'drafts' },
  { label: '我的构建', key: 'builds' },
  { label: '我的工单', key: 'tickets' },
  { label: '我的优惠券', key: 'coupons' },
  { label: '我的声币', key: 'coins' },
  { label: '我的订单', key: 'orders' },
  { label: '子账号管理', key: 'subaccounts' },
  { label: '账号设置', key: 'settings' },
]

const INITIAL_WORKS: Work[] = [
  {
    id: 'PO00000000000000001',
    title: '作品命名',
    creator: '管理员',
    status: 'processing',
    createdAt: '2026.3.1 12:00',
  },
  {
    id: 'PO21574562568521223',
    title: '年会视频总结',
    creator: '羚飞渡-直播',
    status: 'approved',
    expiry: '2025.12.5 14:12',
    createdAt: '2025.12.5 14:12',
    duration: '45秒',
  },
  {
    id: 'PO21574562568521224',
    title: '朗诵视频',
    creator: '羚飞渡-直播',
    status: 'approved',
    expiry: '2025.12.5 14:12',
    createdAt: '2025.12.5 14:12',
    duration: '2分23秒',
    hasVideoIcon: true,
  },
  {
    id: 'PO99887766554433221',
    title: '产品宣传片V2',
    creator: '管理员',
    status: 'processing',
    createdAt: '2025.12.6 09:30',
  },
]

// ── Work Card ──
function WorkCard({
  work,
  checked,
  onToggle,
}: {
  work: Work
  checked: boolean
  onToggle: () => void
}) {
  const isApproved = work.status === 'approved'

  return (
    <div
      className="group rounded-xl p-4 bg-white transition-shadow"
      style={{ border: '1px solid #F3F4F6' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: selector + info */}
        <div className="flex gap-4 items-start min-w-0 flex-1">
          {/* Checkbox or video icon */}
          <div className="mt-1 shrink-0">
            {work.hasVideoIcon ? (
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: '#10B981', fontVariationSettings: '"FILL" 1' }}
                aria-hidden="true"
              >
                videocam
              </span>
            ) : (
              <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="w-4 h-4 rounded cursor-pointer"
                style={{ accentColor: '#10B981' }}
                aria-label={`选择 ${work.title}`}
              />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-base font-bold" style={{ color: '#111827' }}>{work.title}</h3>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: '12px', color: '#6B7280' }}>
              {/* Creator */}
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" aria-hidden="true">person</span>
                <span>{work.creator}</span>
              </div>

              {/* Status badge */}
              {isApproved ? (
                <>
                  <div className="h-3 w-px" style={{ backgroundColor: '#E5E7EB' }}></div>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#ECFDF5', color: '#059669' }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }} aria-hidden="true">check_circle</span>
                    <span className="font-medium">审核通过</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-3 w-px" style={{ backgroundColor: '#E5E7EB' }}></div>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">hourglass_top</span>
                    <span className="font-medium">制作中...</span>
                  </div>
                </>
              )}

              {/* Expiry */}
              {work.expiry && (
                <>
                  <div className="h-3 w-px" style={{ backgroundColor: '#E5E7EB' }}></div>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" style={{ color: '#9CA3AF' }} aria-hidden="true">schedule</span>
                    <span>有效期至: {work.expiry}</span>
                  </div>
                </>
              )}
            </div>

            {/* ID + created */}
            <div className="font-mono" style={{ fontSize: '10px', color: '#9CA3AF' }}>
              ID: {work.id}&nbsp;&nbsp;&nbsp;创建于: {work.createdAt}
            </div>
          </div>
        </div>

        {/* Right: duration badge + actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-center">
          {/* Duration / status badge */}
          {isApproved && work.duration ? (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: '#ECFDF5', color: '#065F46' }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ color: '#10B981', fontVariationSettings: '"FILL" 1' }}
                aria-hidden="true"
              >
                play_arrow
              </span>
              {work.duration}
            </span>
          ) : work.status === 'processing' ? (
            <span
              className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold"
              style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">pending</span>
              估算中
            </span>
          ) : null}

          {/* Action buttons — only for approved */}
          {isApproved && (
            <>
              <ActionBtn icon="upload" title="发布" accent />
              <ActionBtn icon="download" title="下载" />
              <ActionBtn icon="content_copy" title="复制" />
              <ActionBtn icon="closed_caption" title="CC字幕" />
            </>
          )}

          {/* More (always) */}
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#4B5563' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
            aria-label={`更多操作: ${work.title}`}
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">more_vert</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, title, accent }: { icon: string; title: string; accent?: boolean }) {
  return (
    <button
      className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{
        backgroundColor: accent ? '#ECFDF5' : 'transparent',
        border: accent ? 'none' : '1px solid #E5E7EB',
        color: '#10B981',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.backgroundColor = accent ? '#D1FAE5' : '#F9FAFB'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = accent ? '#ECFDF5' : 'transparent'
      }}
      title={title}
      aria-label={title}
    >
      <span className="material-symbols-outlined text-lg" aria-hidden="true">{icon}</span>
    </button>
  )
}

// ── Main Page ──
function MyWorksPage() {
  const navigate = useNavigate()

  const [activeNav, setActiveNav] = useState('works')
  const [mediaTab, setMediaTab] = useState<MediaTab>('视频')
  const [contentFilter, setContentFilter] = useState<ContentFilter>('便捷创作')
  const [searchQuery, setSearchQuery] = useState('')
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const filteredWorks = INITIAL_WORKS.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: '#F3F4F6', fontFamily: "'Public Sans', 'Inter', sans-serif" }}
    >
      {/* ══ Left Sidebar ══ */}
      <aside
        className="w-56 bg-white h-full flex flex-col justify-between py-6 px-3 shrink-0"
        style={{ borderRight: '1px solid #E5E7EB' }}
      >
        <div className="flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 px-3 mb-7">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
              aria-label="返回首页"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: '#0066FF' }}
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">movie</span>
              </div>
              <span className="font-bold text-gray-900 text-sm">讯飞智作</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-0.5" aria-label="个人中心导航">
            {NAV_ITEMS.map(({ label, key }) => {
              const active = activeNav === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveNav(key)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg text-left transition-colors"
                  style={{
                    fontWeight: active ? 700 : 400,
                    color: active ? '#111827' : '#6B7280',
                    backgroundColor: active ? '#F3F4F6' : 'transparent',
                    borderLeft: active ? '3px solid #111827' : '3px solid transparent',
                  }}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#F9FAFB' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  {label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Logout */}
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors w-fit"
          style={{ color: '#EF4444' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          aria-label="退出登录"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
          退出登录
        </button>
      </aside>

      {/* ══ Main Content ══ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5 min-w-0">

        {/* Profile Card */}
        <div
          className="bg-white rounded-xl p-4 flex items-center justify-between shrink-0"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2" style={{ borderColor: '#F3F4F6' }}>
              <img
                alt="用户头像"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2U9MK9erwVfZa23HK-ysrpAKtDc4pfvDUVcPBRIYINFECFX4FGR6xYQX63GXfWyg_4czgJn6bl1foWrZnaEePTOhNlCL1Bu6Brh1tlFpbmAk4f6WxpNeRm0Vb47siUDmWn_xMwr4Nu7TzgN70eABzuA-l-0ZDJa_TxZB0sxDyg2zv5Q6HORVvuuqPF8yU8idodH7K1Dp1ghE-oR1w5ndiQtiWbEecfMzhG3d7ofK0GDBHtUNeyPlUbaIBgqDK30-jruLrygaZEaa3"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#111827' }}>johnnyu</h1>
            </div>
          </div>

          <div className="flex items-stretch">
            <div className="flex flex-col justify-center px-8" style={{ borderLeft: '1px solid #F3F4F6' }}>
              <span className="text-xs mb-1" style={{ color: '#6B7280' }}>推荐码</span>
              <span className="text-lg font-bold" style={{ color: '#111827' }}>AC4ADC</span>
            </div>
            <div className="flex flex-col justify-center px-8" style={{ borderLeft: '1px solid #F3F4F6' }}>
              <span className="text-xs mb-1" style={{ color: '#6B7280' }}>剩余积分</span>
              <span className="text-lg font-bold" style={{ color: '#111827' }}>1280</span>
            </div>
            <div className="flex items-center gap-3 px-8" style={{ borderLeft: '1px solid #F3F4F6' }}>
              <div className="text-right">
                <div className="text-xs" style={{ color: '#6B7280' }}>专属客服</div>
                <div className="text-xs font-medium" style={{ color: '#374151' }}>点击扫码</div>
              </div>
              <button
                className="w-10 h-10 rounded flex items-center justify-center"
                style={{ backgroundColor: '#F3F4F6' }}
                aria-label="扫码联系专属客服"
              >
                <span className="material-symbols-outlined" style={{ color: '#9CA3AF' }} aria-hidden="true">qr_code_2</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Panel */}
        <div
          className="bg-white rounded-xl flex flex-col flex-1 overflow-hidden min-h-0"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}
        >
          {/* Panel Header */}
          <div className="p-6 flex flex-col gap-4 shrink-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <div className="flex items-center justify-between">
              {/* Media type tabs */}
              <div className="flex gap-8">
                {(['音频', '视频'] as MediaTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMediaTab(tab)}
                    className="text-lg pb-2 transition-colors"
                    style={{
                      fontWeight: mediaTab === tab ? 700 : 500,
                      color: mediaTab === tab ? '#111827' : '#6B7280',
                      borderBottom: mediaTab === tab ? '3px solid #111827' : '3px solid transparent',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: '#ECFDF5', color: '#059669' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D1FAE5' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#ECFDF5' }}
                >
                  <span className="material-symbols-outlined text-lg" aria-hidden="true">group_add</span>
                  进入团队空间
                </button>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
                    style={{ color: '#9CA3AF' }}
                    aria-hidden="true"
                  >
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索内容"
                    className="pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-all w-64"
                    style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#10B981' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#F3F4F6' }}
                    aria-label="搜索作品"
                  />
                </div>
              </div>
            </div>

            {/* Content filter chips */}
            <div className="flex gap-2">
              {(['便捷创作', '专业剪辑', 'AI视频编导'] as ContentFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setContentFilter(f)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: contentFilter === f ? '#111827' : '#F3F4F6',
                    color: contentFilter === f ? 'white' : '#6B7280',
                  }}
                  onMouseEnter={e => { if (contentFilter !== f) e.currentTarget.style.backgroundColor = '#E5E7EB' }}
                  onMouseLeave={e => { if (contentFilter !== f) e.currentTarget.style.backgroundColor = '#F3F4F6' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div
            className="px-6 py-2.5 flex items-start gap-2 text-xs shrink-0"
            style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #F3F4F6', color: '#6B7280' }}
          >
            <span className="material-symbols-outlined text-sm mt-0.5 shrink-0" style={{ color: '#9CA3AF' }} aria-hidden="true">info</span>
            <span>连续提交长视频可能会延长制作时间，删除"制作中"作品无法停止制作。</span>
          </div>

          {/* Works List */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
            {filteredWorks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="material-symbols-outlined text-5xl" style={{ color: '#D1D5DB' }} aria-hidden="true">video_library</span>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>暂无作品</span>
              </div>
            ) : (
              filteredWorks.map(work => (
                <WorkCard
                  key={work.id + work.title}
                  work={work}
                  checked={checkedIds.has(work.id)}
                  onToggle={() => toggleCheck(work.id)}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MyWorksPage
