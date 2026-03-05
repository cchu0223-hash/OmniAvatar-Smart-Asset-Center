// 专业剪辑页面 - 参考 stitch_immersive_wizard_prd-5/code.html + screen.png

import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTour } from './useTour'

type SidebarTool = '素材' | '虚拟人' | '图片' | '配音' | '文本' | '转场' | '贴纸' | '模板'
type MaterialTab = '本地素材' | '智能素材'
type GenerateTab = '图片生成' | '视频生成'
type LocalFilter = '全部' | '视频' | '图片' | '音频'
type ImageRatio = '16:9 宽屏' | '9:16 竖屏' | '4:3' | '1:1 方形'
type ImageModel = 'Flux Pro' | 'DALL-E 3' | 'Midjourney V6'
type ImageResolution = '720p' | '1080p' | '2K'
type VideoRatio = '16:9 宽屏' | '9:16 竖屏' | '4:3' | '1:1 方形'
type VideoResolution = '720p' | '1080p' | '2K'
type VideoModel = 'Seedance 2.0' | 'Seedance 2.0 Fast' | 'Veo 3.0' | 'Kling 2.6'

const SIDEBAR_TOOLS: { icon: string; label: SidebarTool }[] = [
  { icon: 'video_library', label: '素材' },
  { icon: 'person_pin', label: '虚拟人' },
  { icon: 'image', label: '图片' },
  { icon: 'music_note', label: '配音' },
  { icon: 'title', label: '文本' },
  { icon: 'animation', label: '转场' },
  { icon: 'sentiment_satisfied', label: '贴纸' },
  { icon: 'dashboard_customize', label: '模板' },
]


const VIDEO_MODELS: VideoModel[] = ['Seedance 2.0', 'Seedance 2.0 Fast', 'Veo 3.0', 'Kling 2.6']

const MODEL_ICONS: Record<VideoModel, string> = {
  'Seedance 2.0': 'rocket_launch',
  'Seedance 2.0 Fast': 'bolt',
  'Veo 3.0': 'movie_filter',
  'Kling 2.6': 'auto_awesome',
}

// ── Smart material history mock data ──
type SmartMaterial = { id: number; type: 'image' | 'video'; url: string; prompt: string; ratio?: string; model?: string; duration?: number }
const SMART_MATERIALS: SmartMaterial[] = [
  { id: 1, type: 'image', url: 'https://picsum.photos/seed/sm1/400/400', prompt: '赛博朋克城市街景' },
  { id: 2, type: 'image', url: 'https://picsum.photos/seed/sm2/400/300', prompt: '水墨山水画风格' },
  { id: 3, type: 'video', url: '', prompt: '产品展示动画', ratio: '16:9 宽屏', model: 'Seedance 2.0', duration: 8 },
  { id: 4, type: 'image', url: 'https://picsum.photos/seed/sm4/400/400', prompt: '极简商务海报' },
  { id: 5, type: 'video', url: '', prompt: '品牌宣传片片段', ratio: '9:16 竖屏', model: 'Veo 3.0', duration: 12 },
  { id: 6, type: 'image', url: 'https://picsum.photos/seed/sm6/400/300', prompt: '自然风景航拍' },
  { id: 7, type: 'video', url: '', prompt: '科技感UI动效展示', ratio: '16:9 宽屏', model: 'Seedance 2.0 Fast', duration: 6 },
  { id: 8, type: 'video', url: '', prompt: '美食特写慢镜头', ratio: '4:3', model: 'Kling 2.6', duration: 10 },
]

const LIP_SYNC_LANGUAGES = ['中文', '英语', '日语', '韩语', '俄语']

type AsrSegment = {
  id: number
  timeRange: string
  speaker: string
  text: string
  refreshing: boolean
}

const LIP_SYNC_SEGMENT_TRANSLATIONS: Record<string, AsrSegment[]> = {
  '中文': [
    { id: 1, timeRange: '00:00 - 00:03', speaker: '讲话人01', text: '欢迎来到讯飞智作，我们的 AI 视频创作平台', refreshing: false },
    { id: 2, timeRange: '00:03 - 00:08', speaker: '讲话人01', text: '让您轻松打造专业级内容，高效完成品牌宣传视频制作。', refreshing: false },
    { id: 3, timeRange: '00:08 - 00:12', speaker: '讲话人01', text: '感谢您选择讯飞智作，让我们开始创作吧！', refreshing: false },
  ],
  '英语': [
    { id: 1, timeRange: '00:00 - 00:04', speaker: '讲话人01', text: 'Welcome to Xunfei Zhizuo, our AI video creation platform', refreshing: false },
    { id: 2, timeRange: '00:04 - 00:08', speaker: '讲话人01', text: 'helps you easily craft professional-grade content', refreshing: false },
    { id: 3, timeRange: '00:08 - 00:12', speaker: '讲话人01', text: 'and efficiently produce brand promotional videos.', refreshing: false },
  ],
  '日语': [
    { id: 1, timeRange: '00:00 - 00:04', speaker: '讲话人01', text: '讯飞智作へようこそ。AI ビデオ制作プラットフォームで', refreshing: false },
    { id: 2, timeRange: '00:04 - 00:08', speaker: '讲话人01', text: 'プロ品質のコンテンツを簡単に作成し', refreshing: false },
    { id: 3, timeRange: '00:08 - 00:12', speaker: '讲话人01', text: 'ブランドプロモーション動画を効率的に制作できます。', refreshing: false },
  ],
  '韩语': [
    { id: 1, timeRange: '00:00 - 00:04', speaker: '讲话人01', text: '讯飞智作에 오신 것을 환영합니다', refreshing: false },
    { id: 2, timeRange: '00:04 - 00:08', speaker: '讲话人01', text: 'AI 영상 제작 플랫폼으로 전문적인 콘텐츠를 쉽게 제작하고', refreshing: false },
    { id: 3, timeRange: '00:08 - 00:12', speaker: '讲话人01', text: '브랜드 홍보 영상을 효율적으로 완성할 수 있습니다。', refreshing: false },
  ],
  '俄语': [
    { id: 1, timeRange: '00:00 - 00:04', speaker: '讲话人01', text: 'Добро пожаловать в Xunfei Zhizuo', refreshing: false },
    { id: 2, timeRange: '00:04 - 00:08', speaker: '讲话人01', text: 'Наша AI-платформа поможет вам легко создавать профессиональный контент', refreshing: false },
    { id: 3, timeRange: '00:08 - 00:12', speaker: '讲话人01', text: 'и эффективно производить рекламные ролики для вашего бренда.', refreshing: false },
  ],
}

// Clip position constants (aligned for V1 ↔ V2 ↔ multimodal tracks)
const CLIP_LEFT = 40
const CLIP_WIDTH = 192

function ProfessionalEditPage() {
  const navigate = useNavigate()

  // ── Sidebar / panel state ──
  const [activeTool, setActiveTool] = useState<SidebarTool>('素材')
  const [materialTab, setMaterialTab] = useState<MaterialTab>('智能素材')
  const [generateTab, setGenerateTab] = useState<GenerateTab>('图片生成')
  const [localFilter, setLocalFilter] = useState<LocalFilter>('全部')

  // Image generation
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModel, setImageModel] = useState<ImageModel>('Flux Pro')
  const [imageRatio, setImageRatio] = useState<ImageRatio>('16:9 宽屏')
  const [imageResolution, setImageResolution] = useState<ImageResolution>('1080p')
  const [showAdvancedImage, setShowAdvancedImage] = useState(false)
  const [imagePopover, setImagePopover] = useState<'ratio' | 'model' | null>(null)

  // Video generation
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState<VideoModel>('Seedance 2.0 Fast')
  const [videoRatio, setVideoRatio] = useState<VideoRatio>('16:9 宽屏')
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('1080p')
  const [showAdvancedVideo, setShowAdvancedVideo] = useState(false)
  const [videoPopover, setVideoPopover] = useState<'ratio' | 'model' | null>(null)
  const [videoDuration, setVideoDuration] = useState(5)

  // Lightbox for smart material preview
  const [lightboxItem, setLightboxItem] = useState<SmartMaterial | null>(null)

  const [aiLabel, setAiLabel] = useState(false)



  // ── Context menu ──
  // Anchored to clip's top-right corner: right = distance from viewport right, bottom = distance from clip top
  const [contextMenu, setContextMenu] = useState<{ right: number; bottom: number } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const clip01ChipRef = useRef<HTMLDivElement>(null)

  // ── Multimodal confirm modal ──
  const [showMultimodalConfirmModal, setShowMultimodalConfirmModal] = useState(false)

  // ── Lip sync modal ──
  const [showLipSyncModal, setShowLipSyncModal] = useState(false)
  const [lipSyncLang, setLipSyncLang] = useState('中文')
  const [lipSyncSegments, setLipSyncSegments] = useState<AsrSegment[]>(LIP_SYNC_SEGMENT_TRANSLATIONS['中文'])
  const [lipSyncTranslating, setLipSyncTranslating] = useState(false)
  const [showLipSyncLangDropdown, setShowLipSyncLangDropdown] = useState(false)
  const lipSyncLangDropdownRef = useRef<HTMLDivElement>(null)

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)

  // ── Timeline clip/track states ──
  const [clip01Loading, setClip01Loading] = useState(false)
  const [clip01Muted, setClip01Muted] = useState(false)
  const [hasLipSyncV2, setHasLipSyncV2] = useState(false)
  const [hasMultimodalTracks, setHasMultimodalTracks] = useState(false)

  // ── Helpers ──
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Tour: open context-menu programmatically (used by tour next-override) ──
  const openContextMenuForTour = useCallback(() => {
    if (clip01ChipRef.current && !clip01Loading) {
      const rect = clip01ChipRef.current.getBoundingClientRect()
      setContextMenu({
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.top + 4,
      })
    }
  }, [clip01Loading])
  // Stable ref so tour closure always calls the latest version
  const openContextMenuRef = useRef(openContextMenuForTour)
  useEffect(() => { openContextMenuRef.current = openContextMenuForTour }, [openContextMenuForTour])

  // ── Tour configuration for /professional-edit ──
  useTour(
    'professional-edit',
    [
      {
        element: '#track-clip-01',
        popover: {
          title: '轨道片段操作',
          description: '右键点击该轨道片段，即可解锁更多高级 AI 功能。',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '#ctx-menu-lip-sync',
        popover: {
          title: '视频人物对口型',
          description: 'AI 重绘人物口部动作并生成多语种配音。',
          side: 'left',
          align: 'center',
        },
      },
      {
        element: '#ctx-menu-multimodal',
        popover: {
          title: '视频多模态拆分',
          description: 'AI 解析视频元素，拆分画面、人声和背景声。',
          side: 'left',
          align: 'center',
        },
      },
    ],
    {
      delay: 1200,
      // Step 0: listen for right-click on clip01 → auto-advance
      stepHooks: {
        0: {
          onActive: (driverObj) => {
            const clip = document.getElementById('track-clip-01')
            const handler = () => {
              // Context menu is already being opened by React's onContextMenu handler.
              // Wait a frame for React to render it, then advance.
              setTimeout(() => driverObj.moveNext(), 150)
              clip?.removeEventListener('contextmenu', handler)
            }
            clip?.addEventListener('contextmenu', handler)
            return () => clip?.removeEventListener('contextmenu', handler)
          },
        },
      },
      // Step 0: if user clicks "Next" without right-clicking, open context menu first
      onNextAtStep: {
        0: (driverObj) => {
          openContextMenuRef.current()
          setTimeout(() => driverObj.moveNext(), 180)
        },
      },
    },
  )


  // Close popovers on outside click
  useEffect(() => {
    if (!imagePopover && !videoPopover) return
    const handler = () => { setImagePopover(null); setVideoPopover(null) }
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [imagePopover, videoPopover])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const handler = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [contextMenu])

  // Close lip sync lang dropdown on outside click
  useEffect(() => {
    if (!showLipSyncLangDropdown) return
    const handler = (e: MouseEvent) => {
      if (lipSyncLangDropdownRef.current && !lipSyncLangDropdownRef.current.contains(e.target as Node)) {
        setShowLipSyncLangDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showLipSyncLangDropdown])

  // ── Context menu handlers ──
  const handleClip01ContextMenu = (e: React.MouseEvent) => {
    if (clip01Loading) return
    e.preventDefault()
    if (clip01ChipRef.current) {
      const rect = clip01ChipRef.current.getBoundingClientRect()
      // Menu's bottom-right corner anchors to the clip's top-right corner (opens upward)
      setContextMenu({
        right: window.innerWidth - rect.right,
        bottom: window.innerHeight - rect.top + 4,
      })
    }
  }

  const handleOpenLipSync = () => {
    setContextMenu(null)
    setShowLipSyncModal(true)
  }

  const handleMultimodalSplit = () => {
    setContextMenu(null)
    setShowMultimodalConfirmModal(true)
  }

  const handleMultimodalConfirm = () => {
    setShowMultimodalConfirmModal(false)
    setClip01Loading(true)
    setTimeout(() => {
      setClip01Loading(false)
      setClip01Muted(true)
      setHasMultimodalTracks(true)
      showToast('多模态拆分完成，已分离画面、人声与背景音')
    }, 5000)
  }

  // ── Lip sync handlers ──
  const handleLipSyncLangChange = (lang: string) => {
    setLipSyncLang(lang)
    setShowLipSyncLangDropdown(false)
    setLipSyncTranslating(true)
    setTimeout(() => {
      setLipSyncSegments(LIP_SYNC_SEGMENT_TRANSLATIONS[lang])
      setLipSyncTranslating(false)
    }, 1500)
  }

  const handleSegmentTextChange = (id: number, newText: string) => {
    setLipSyncSegments(prev => prev.map(s => s.id === id ? { ...s, text: newText } : s))
  }

  const handleSegmentConfirm = (id: number) => {
    setLipSyncSegments(prev => prev.map(s => s.id === id ? { ...s, refreshing: true } : s))
    setTimeout(() => {
      setLipSyncSegments(prev => prev.map(s => s.id === id ? { ...s, refreshing: false } : s))
    }, 800)
  }

  const handleLipSyncConfirm = () => {
    setShowLipSyncModal(false)
    setClip01Loading(true)
    setTimeout(() => {
      setClip01Loading(false)
      setHasLipSyncV2(true)
      showToast('对口型视频已生成')
    }, 5000)
  }

  // ── Local Materials Panel ──
  const LocalMaterialsPanel = () => (
    <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4" style={{ scrollbarWidth: 'none' }}>
      <button
        className="w-full rounded-lg border border-dashed flex flex-col items-center justify-center py-6 gap-2 transition-colors group"
        style={{ borderColor: '#222226', backgroundColor: 'rgba(255,255,255,0.02)' }}
        aria-label="上传本地素材"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors group-hover:bg-[#0066FF]/20" style={{ backgroundColor: 'rgba(0,102,255,0.1)' }}>
          <span className="material-symbols-outlined group-hover:text-[#0066FF] transition-colors" style={{ color: 'rgba(148,163,184,0.6)' }} aria-hidden="true">upload</span>
        </div>
        <span className="text-xs font-medium" style={{ color: 'rgba(148,163,184,0.6)' }}>点击上传或拖入文件</span>
        <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.3)' }}>支持 MP4、MOV、JPG、PNG、MP3</span>
      </button>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">search</span>
        <input
          type="text"
          placeholder="搜索素材…"
          className="w-full rounded-lg text-xs py-2 pl-8 pr-3 outline-none transition-all"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #222226', color: 'rgba(203,213,225,0.9)' }}
          onFocus={e => { e.currentTarget.style.borderColor = '#0066FF' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#222226' }}
          aria-label="搜索本地素材"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {(['全部', '视频', '图片', '音频'] as LocalFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setLocalFilter(f)}
            className="px-3 py-1 rounded-full text-[10px] font-medium border transition-all"
            style={{
              backgroundColor: localFilter === f ? '#0066FF' : 'rgba(255,255,255,0.05)',
              borderColor: localFilter === f ? '#0066FF' : '#222226',
              color: localFilter === f ? 'white' : 'rgba(148,163,184,0.6)',
            }}
          >{f}</button>
        ))}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <span className="material-symbols-outlined text-2xl" style={{ color: 'rgba(148,163,184,0.2)' }} aria-hidden="true">folder_open</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(148,163,184,0.3)' }}>暂无本地素材</span>
      </div>
    </div>
  )

  // ── Image Generation Panel ──
  const ImageGeneratePanel = () => (
    <div className="flex-1 overflow-y-auto flex flex-col p-5" style={{ scrollbarWidth: 'none', gap: '20px' }}>
      {/* ── Prompt Input (full-width, auto-resize) ── */}
      <div className="flex flex-col" style={{ gap: '12px' }}>
        <textarea
          value={imagePrompt}
          onChange={(e) => { setImagePrompt(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px' }}
          className="w-full text-[13px] p-3 resize-none outline-none transition-all leading-relaxed"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(203,213,225,0.9)', minHeight: '80px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          placeholder="描述你想要生成的画面…"
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.5)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,102,255,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
          aria-label="画面描述"
        />
        {/* Reference image (below prompt, inline) */}
        <button className="w-full h-16 flex items-center justify-center gap-2 transition-all" style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(148,163,184,0.4)' }} aria-label="上传参考图">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">add_photo_alternate</span>
          <span className="text-[11px]">添加参考图</span>
        </button>
      </div>

      {/* ── Ratio + Model: 2-col icon pill selectors ── */}
      <div className="grid grid-cols-2" style={{ gap: '12px' }}>
        {/* 比例 */}
        <div className="relative flex flex-col" style={{ gap: '6px' }}>
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>比例</span>
          <button
            onClick={() => setImagePopover(imagePopover === 'ratio' ? null : 'ratio')}
            className="flex items-center gap-2 px-3 py-2 transition-all"
            style={{ borderRadius: '12px', backgroundColor: imagePopover === 'ratio' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${imagePopover === 'ratio' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: '#0066FF' }} aria-hidden="true">aspect_ratio</span>
            <span className="text-[11px] font-medium flex-1 text-left truncate">{imageRatio.replace(' 宽屏', '').replace(' 竖屏', '').replace(' 方形', '')}</span>
            <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">unfold_more</span>
          </button>
          {imagePopover === 'ratio' && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden z-50" style={{ borderRadius: '12px', backgroundColor: 'rgba(22,23,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', animation: 'popup-up 0.2s ease-out' }}>
              {(['16:9 宽屏', '9:16 竖屏', '4:3', '1:1 方形'] as ImageRatio[]).map((r) => (
                <button key={r} onClick={() => { setImageRatio(r); setImagePopover(null) }} className="w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/5 flex items-center gap-2" style={{ color: imageRatio === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: imageRatio === r ? 600 : 400 }}>
                  {imageRatio === r ? <span className="material-symbols-outlined text-xs" style={{ color: '#0066FF' }} aria-hidden="true">check</span> : <span className="w-4" />}
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 模型 */}
        <div className="relative flex flex-col" style={{ gap: '6px' }}>
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>模型</span>
          <button
            onClick={() => setImagePopover(imagePopover === 'model' ? null : 'model')}
            className="flex items-center gap-2 px-3 py-2 transition-all"
            style={{ borderRadius: '12px', backgroundColor: imagePopover === 'model' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${imagePopover === 'model' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: '#0066FF' }} aria-hidden="true">auto_awesome</span>
            <span className="text-[11px] font-medium flex-1 text-left truncate">{imageModel}</span>
            <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">unfold_more</span>
          </button>
          {imagePopover === 'model' && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden z-50" style={{ borderRadius: '12px', backgroundColor: 'rgba(22,23,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', animation: 'popup-up 0.2s ease-out' }}>
              {(['Flux Pro', 'DALL-E 3', 'Midjourney V6'] as ImageModel[]).map((m) => (
                <button key={m} onClick={() => { setImageModel(m); setImagePopover(null) }} className="w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/5 flex items-center gap-2" style={{ color: imageModel === m ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: imageModel === m ? 600 : 400 }}>
                  {imageModel === m ? <span className="material-symbols-outlined text-xs" style={{ color: '#0066FF' }} aria-hidden="true">check</span> : <span className="w-4" />}
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Advanced Settings (collapsible) ── */}
      <button
        onClick={() => setShowAdvancedImage(v => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium transition-colors self-start"
        style={{ color: 'rgba(148,163,184,0.5)' }}
      >
        <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: showAdvancedImage ? 'rotate(90deg)' : 'none' }} aria-hidden="true">chevron_right</span>
        高级设置
      </button>
      {showAdvancedImage && (
        <div className="flex flex-col p-3" style={{ gap: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>分辨率</span>
            <div className="flex gap-2">
              {(['720p', '1080p', '2K'] as ImageResolution[]).map((r) => (
                <button key={r} onClick={() => setImageResolution(r)} className="flex-1 py-1.5 text-[11px] font-medium transition-all" style={{ borderRadius: '8px', backgroundColor: imageResolution === r ? 'rgba(0,102,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${imageResolution === r ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.06)'}`, color: imageResolution === r ? '#0066FF' : 'rgba(148,163,184,0.6)' }}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA Button ── */}
      <div className="flex flex-col items-center" style={{ gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
        <button className="w-full py-3 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #0066FF 0%, #1a7fff 100%)', boxShadow: '0 4px 20px rgba(0,102,255,0.3)' }}>
          <span className="material-symbols-outlined text-base" aria-hidden="true">image</span>
          立即生图
        </button>
        <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.3)' }}>预计消耗 10 算力</span>
      </div>

      {/* ── 我的智能素材 ── */}
      <div className="flex flex-col" style={{ gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">folder_special</span>
          <span className="text-[11px] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>我的智能素材</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SMART_MATERIALS.filter(m => m.type === 'image').map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden cursor-pointer group"
              style={{ borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => { setImagePrompt(item.prompt); showToast('已填入提示词') }}
            >
              <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
              {/* Hover: zoom top-right, use+download bottom-right */}
              <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setLightboxItem(item) }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="放大查看">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>zoom_in</span>
                </button>
              </div>
              <div className="absolute bottom-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); showToast('已添加到轨道') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="使用">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>add_circle</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="下载">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>download</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── Video Generation Panel ──
  const VideoGeneratePanel = () => (
    <div className="flex-1 overflow-y-auto flex flex-col p-5" style={{ scrollbarWidth: 'none', gap: '20px' }}>
      {/* ── Prompt Input (full-width, auto-resize) ── */}
      <div className="flex flex-col" style={{ gap: '12px' }}>
        <textarea
          value={videoPrompt}
          onChange={(e) => { setVideoPrompt(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px' }}
          className="w-full text-[13px] p-3 resize-none outline-none transition-all leading-relaxed"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'rgba(203,213,225,0.9)', minHeight: '80px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          placeholder="描述你想要生成的视频画面…"
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.5)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,102,255,0.1)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)' }}
          aria-label="画面描述"
        />
        {/* Reference image (below prompt, inline) */}
        <button className="w-full h-16 flex items-center justify-center gap-2 transition-all" style={{ border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', color: 'rgba(148,163,184,0.4)' }} aria-label="上传参考图">
          <span className="material-symbols-outlined text-lg" aria-hidden="true">add_photo_alternate</span>
          <span className="text-[11px]">添加参考图</span>
        </button>
      </div>

      {/* ── Ratio + Model: 2-col icon pill selectors ── */}
      <div className="grid grid-cols-2" style={{ gap: '12px' }}>
        {/* 比例 */}
        <div className="relative flex flex-col" style={{ gap: '6px' }}>
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>比例</span>
          <button
            onClick={() => setVideoPopover(videoPopover === 'ratio' ? null : 'ratio')}
            className="flex items-center gap-2 px-3 py-2 transition-all"
            style={{ borderRadius: '12px', backgroundColor: videoPopover === 'ratio' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${videoPopover === 'ratio' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: '#0066FF' }} aria-hidden="true">aspect_ratio</span>
            <span className="text-[11px] font-medium flex-1 text-left truncate">{videoRatio.replace(' 宽屏', '').replace(' 竖屏', '').replace(' 方形', '')}</span>
            <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">unfold_more</span>
          </button>
          {videoPopover === 'ratio' && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden z-50" style={{ borderRadius: '12px', backgroundColor: 'rgba(22,23,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', animation: 'popup-up 0.2s ease-out' }}>
              {(['16:9 宽屏', '9:16 竖屏', '4:3', '1:1 方形'] as VideoRatio[]).map((r) => (
                <button key={r} onClick={() => { setVideoRatio(r); setVideoPopover(null) }} className="w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/5 flex items-center gap-2" style={{ color: videoRatio === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: videoRatio === r ? 600 : 400 }}>
                  {videoRatio === r ? <span className="material-symbols-outlined text-xs" style={{ color: '#0066FF' }} aria-hidden="true">check</span> : <span className="w-4" />}
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* 模型 */}
        <div className="relative flex flex-col" style={{ gap: '6px' }}>
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>模型</span>
          <button
            onClick={() => setVideoPopover(videoPopover === 'model' ? null : 'model')}
            className="flex items-center gap-2 px-3 py-2 transition-all"
            style={{ borderRadius: '12px', backgroundColor: videoPopover === 'model' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${videoPopover === 'model' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ color: '#0066FF' }} aria-hidden="true">{MODEL_ICONS[videoModel]}</span>
            <span className="text-[11px] font-medium flex-1 text-left truncate">{videoModel}</span>
            <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">unfold_more</span>
          </button>
          {videoPopover === 'model' && (
            <div className="absolute bottom-full left-0 mb-2 w-full overflow-hidden z-50" style={{ borderRadius: '12px', backgroundColor: 'rgba(22,23,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 -8px 32px rgba(0,0,0,0.5)', animation: 'popup-up 0.2s ease-out' }}>
              {VIDEO_MODELS.map((m) => (
                <button key={m} onClick={() => { setVideoModel(m); setVideoPopover(null) }} className="w-full px-3 py-2 text-left text-[11px] transition-colors hover:bg-white/5 flex items-center gap-2" style={{ color: videoModel === m ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: videoModel === m ? 600 : 400 }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: videoModel === m ? '#0066FF' : 'rgba(148,163,184,0.4)' }} aria-hidden="true">{MODEL_ICONS[m]}</span>
                  {m}
                  {videoModel === m && <span className="ml-auto material-symbols-outlined text-xs" style={{ color: '#0066FF' }} aria-hidden="true">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Duration Slider ── */}
      <div className="flex flex-col" style={{ gap: '8px' }}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>时长</span>
          <span className="text-[11px] font-mono font-bold" style={{ color: '#0066FF' }}>{videoDuration}s</span>
        </div>
        <div className="relative flex items-center" style={{ height: '24px' }}>
          <input
            type="range"
            min={4}
            max={15}
            step={1}
            value={videoDuration}
            onChange={(e) => setVideoDuration(Number(e.target.value))}
            className="w-full h-1 appearance-none outline-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #0066FF ${((videoDuration - 4) / 11) * 100}%, rgba(255,255,255,0.08) ${((videoDuration - 4) / 11) * 100}%)`, borderRadius: '4px', WebkitAppearance: 'none' }}
            aria-label="视频时长"
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.3)' }}>4s</span>
          <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.3)' }}>15s</span>
        </div>
      </div>

      {/* ── Advanced Settings (collapsible) ── */}
      <button
        onClick={() => setShowAdvancedVideo(v => !v)}
        className="flex items-center gap-1.5 text-[11px] font-medium transition-colors self-start"
        style={{ color: 'rgba(148,163,184,0.5)' }}
      >
        <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: showAdvancedVideo ? 'rotate(90deg)' : 'none' }} aria-hidden="true">chevron_right</span>
        高级设置
      </button>
      {showAdvancedVideo && (
        <div className="flex flex-col p-3" style={{ gap: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex flex-col" style={{ gap: '6px' }}>
            <span className="text-[10px] font-medium tracking-wide" style={{ color: 'rgba(148,163,184,0.45)' }}>分辨率</span>
            <div className="flex gap-2">
              {(['720p', '1080p', '2K'] as VideoResolution[]).map((r) => (
                <button key={r} onClick={() => setVideoResolution(r)} className="flex-1 py-1.5 text-[11px] font-medium transition-all" style={{ borderRadius: '8px', backgroundColor: videoResolution === r ? 'rgba(0,102,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${videoResolution === r ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.06)'}`, color: videoResolution === r ? '#0066FF' : 'rgba(148,163,184,0.6)' }}>{r}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA Button ── */}
      <div className="flex flex-col items-center" style={{ gap: '8px', marginTop: '4px', marginBottom: '4px' }}>
        <button className="w-full py-3 text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #0066FF 0%, #1a7fff 100%)', boxShadow: '0 4px 20px rgba(0,102,255,0.3)' }}>
          <span className="material-symbols-outlined text-base" aria-hidden="true">videocam</span>
          立即生成
        </button>
        <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.3)' }}>预计消耗 300 算力</span>
      </div>

      {/* ── 我的智能素材 ── */}
      <div className="flex flex-col" style={{ gap: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">folder_special</span>
          <span className="text-[11px] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>我的智能素材</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SMART_MATERIALS.filter(m => m.type === 'video').map((item) => (
            <div
              key={item.id}
              className="relative aspect-video overflow-hidden cursor-pointer group"
              style={{ borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              onClick={() => {
                setVideoPrompt(item.prompt)
                if (item.ratio) setVideoRatio(item.ratio as VideoRatio)
                if (item.model) setVideoModel(item.model as VideoModel)
                if (item.duration) setVideoDuration(item.duration)
                showToast('已填入参数')
              }}
            >
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.08), rgba(112,0,255,0.08))' }}>
                <span className="material-symbols-outlined text-xl" style={{ color: 'rgba(148,163,184,0.2)' }} aria-hidden="true">movie</span>
              </div>
              {/* Play button — clicking opens lightbox */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxItem(item) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                  aria-label="播放视频"
                >
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }} aria-hidden="true">play_arrow</span>
                </button>
              </div>
              {/* Hover: use + download icons at bottom-right */}
              <div className="absolute bottom-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); showToast('已添加到轨道') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="使用">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>add_circle</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="下载">
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>download</span>
                </button>
              </div>
              {/* Prompt label at bottom */}
              <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                <span className="text-[9px] text-white/70 truncate block">{item.prompt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden text-slate-300" style={{ backgroundColor: '#050505', fontFamily: "'Public Sans', 'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="h-14 border-b flex items-center px-4 shrink-0" style={{ backgroundColor: '#0A0A0B', borderColor: '#222226' }}>
        <div className="flex items-center gap-4 w-1/3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: '#0066FF' }}>
              <span className="material-symbols-outlined text-white text-base" aria-hidden="true">movie</span>
            </div>
            <span className="font-bold text-lg text-white">讯飞智作</span>
          </div>
          <div className="h-4 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
          <button onClick={() => navigate('/storyboard')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>返回分镜
          </button>
          <div className="ml-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.2)', color: '#0066FF' }}>AI 共创</div>
        </div>
        <div className="flex items-center justify-center gap-2 w-1/3">
          <span className="text-sm text-slate-200">作品命名</span>
          <button aria-label="编辑作品名称"><span className="material-symbols-outlined text-xs text-slate-500 cursor-pointer hover:text-white transition-colors" aria-hidden="true">edit</span></button>
        </div>
        <div className="flex items-center justify-end gap-5 w-1/3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AI 标识</span>
            <button onClick={() => setAiLabel(v => !v)} role="switch" aria-checked={aiLabel} aria-label="切换 AI 标识" className="w-8 h-4 rounded-full relative transition-colors cursor-pointer" style={{ backgroundColor: aiLabel ? '#0066FF' : 'rgba(255,255,255,0.15)' }}>
              <div className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all" style={{ left: aiLabel ? '17px' : '2px' }}></div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-1.5 text-xs font-medium rounded-lg transition-colors border text-slate-300 hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>保存</button>
            <button onClick={() => navigate('/my-works')} className="px-4 py-1.5 text-xs font-bold text-white rounded-lg hover:brightness-110 transition-all" style={{ backgroundColor: '#0066FF' }}>制作视频</button>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2U9MK9erwVfZa23HK-ysrpAKtDc4pfvDUVcPBRIYINFECFX4FGR6xYQX63GXfWyg_4czgJn6bl1foWrZnaEePTOhNlCL1Bu6Brh1tlFpbmAk4f6WxpNeRm0Vb47siUDmWn_xMwr4Nu7TzgN70eABzuA-l-0ZDJa_TxZB0sxDyg2zv5Q6HORVvuuqPF8yU8idodH7K1Dp1ghE-oR1w5ndiQtiWbEecfMzhG3d7ofK0GDBHtUNeyPlUbaIBgqDK30-jruLrygaZEaa3" alt="用户头像" />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Icon Sidebar ── */}
        <aside className="w-16 flex flex-col items-center py-4 border-r shrink-0" style={{ backgroundColor: '#0A0A0B', borderColor: '#222226' }}>
          <nav className="flex flex-col gap-1 w-full" aria-label="工具栏">
            {SIDEBAR_TOOLS.map(({ icon, label }) => {
              const active = activeTool === label
              return (
                <button key={label} onClick={() => setActiveTool(label)} className="flex flex-col items-center gap-1 cursor-pointer transition-colors py-2 w-full" style={{ color: active ? '#0066FF' : 'rgba(148,163,184,0.5)', borderLeft: active ? '2px solid #0066FF' : '2px solid transparent', backgroundColor: active ? 'rgba(0,102,255,0.05)' : 'transparent' }} aria-label={label} aria-pressed={active}>
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">{icon}</span>
                  <span className="text-[10px]">{label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── Left Panel ── */}
        <aside className="w-72 flex flex-col border-r shrink-0 overflow-hidden" style={{ backgroundColor: '#0A0A0B', borderColor: '#222226' }}>
          <div className="flex border-b shrink-0" style={{ borderColor: '#222226' }}>
            {(['本地素材', '智能素材'] as MaterialTab[]).map((tab) => (
              <button key={tab} onClick={() => setMaterialTab(tab)} className="flex-1 py-3 text-xs font-medium transition-colors" style={{ color: materialTab === tab ? '#0066FF' : 'rgba(148,163,184,0.6)', borderBottom: materialTab === tab ? '2px solid #0066FF' : '2px solid transparent', fontWeight: materialTab === tab ? 700 : 500 }}>{tab}</button>
            ))}
          </div>
          {materialTab === '智能素材' && (
            <div className="flex p-2 shrink-0" style={{ borderBottom: '1px solid #222226' }}>
              <div className="flex w-full p-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                {(['图片生成', '视频生成'] as GenerateTab[]).map((tab) => (
                  <button key={tab} onClick={() => setGenerateTab(tab)} className="flex-1 py-1.5 text-xs font-medium rounded transition-all" style={{ color: generateTab === tab ? 'white' : 'rgba(148,163,184,0.6)', backgroundColor: generateTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent', fontWeight: generateTab === tab ? 700 : 500 }}>{tab}</button>
                ))}
              </div>
            </div>
          )}
          {materialTab === '本地素材' ? <LocalMaterialsPanel /> : generateTab === '图片生成' ? <ImageGeneratePanel /> : <VideoGeneratePanel />}
        </aside>

        {/* ── Main Canvas ── */}
        <main className="flex-1 flex flex-col" style={{ backgroundColor: '#050505' }}>
          <div className="flex-1 flex items-center justify-center p-6" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="w-full max-w-3xl aspect-video rounded shadow-2xl overflow-hidden relative group" style={{ backgroundColor: 'black', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-full h-full flex items-center justify-center" style={{ color: 'rgba(148,163,184,0.12)' }}>
                <div className="flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-6xl" aria-hidden="true">movie</span>
                  <span className="text-sm">画布预览区域</span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full flex items-center justify-center border transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.2)' }}>
                  <span className="material-symbols-outlined text-white text-4xl ml-1" aria-hidden="true">play_arrow</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Timeline ── */}
      <div className="shrink-0 flex flex-col" style={{ height: '256px', backgroundColor: '#0A0A0B', borderTop: '1px solid #222226' }}>
        {/* Toolbar */}
        <div className="h-8 flex items-center shrink-0" style={{ borderBottom: '1px solid #222226', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div className="w-16 flex items-center justify-center shrink-0 h-full" style={{ borderRight: '1px solid #222226' }}>
            <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(148,163,184,0.5)' }} aria-hidden="true">settings_suggest</span>
          </div>
          <div className="flex items-center gap-4 px-4" style={{ color: 'rgba(148,163,184,0.6)', fontSize: '10px' }}>
            <button className="hover:text-white transition-colors" aria-label="剪切"><span className="material-symbols-outlined text-lg" aria-hidden="true">content_cut</span></button>
            <button className="hover:text-white transition-colors" aria-label="撤销"><span className="material-symbols-outlined text-lg" aria-hidden="true">undo</span></button>
            <button className="hover:text-white transition-colors" aria-label="重做"><span className="material-symbols-outlined text-lg" aria-hidden="true">redo</span></button>
            <div className="h-4 w-px mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
            <div className="flex gap-12 font-mono" style={{ opacity: 0.6 }}>
              {['00:00:00', '00:05:00', '00:10:00', '00:15:00'].map(t => <span key={t}>{t}</span>)}
            </div>
          </div>
        </div>

        {/* Track Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
          <div className="flex flex-col">

            {/* Subtitle Track */}
            <div className="h-10 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">subtitles</span>
              </div>
              <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div className="absolute rounded px-2 flex items-center" style={{ left: `${CLIP_LEFT}px`, width: '128px', height: '24px', top: '6px', backgroundColor: 'rgba(234,179,8,0.2)', borderLeft: '2px solid rgb(234,179,8)' }}>
                  <span className="text-[9px]" style={{ color: 'rgba(254,240,138,0.8)' }}>字幕_01</span>
                </div>
              </div>
            </div>

            {/* V2 Track – Lip Sync result (shown after lip sync completes) */}
            {hasLipSyncV2 && (
              <div className="h-12 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(0,240,255,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(0,240,255,0.7)' }} aria-hidden="true">record_voice_over</span>
                  <span className="text-[8px] font-bold" style={{ color: 'rgba(0,240,255,0.5)' }}>V2</span>
                </div>
                <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(0,240,255,0.01)' }}>
                  <div className="absolute rounded px-2 flex items-center gap-2 overflow-hidden" style={{ left: `${CLIP_LEFT}px`, width: `${CLIP_WIDTH}px`, height: '40px', top: '2px', backgroundColor: 'rgba(0,240,255,0.12)', borderLeft: '2px solid rgba(0,240,255,0.8)' }}>
                    <div className="w-10 h-full opacity-40 rounded shrink-0" style={{ backgroundColor: 'rgba(0,240,255,0.15)' }}></div>
                    <span className="text-[10px] truncate" style={{ color: '#a5f3fc' }}>Clip_01（对口型）.mp4</span>
                    <span className="ml-auto shrink-0 text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,240,255,0.2)', color: '#00f0ff' }}>NEW</span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Track 1 – Clip_01 (main, possibly loading/muted/deleted) */}
            <div className="h-12 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-xs" style={{ color: clip01Muted ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.4)' }} aria-hidden="true">videocam</span>
                <span className="text-[8px]" style={{ color: 'rgba(148,163,184,0.3)' }}>V1</span>
              </div>
              <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                {/* Clip_01 chip – hidden after lip sync completes (original deleted) */}
                {!hasLipSyncV2 && (
                  <div
                    id="track-clip-01"
                    ref={clip01ChipRef}
                    className="absolute rounded px-2 flex items-center gap-2 overflow-hidden select-none"
                    style={{
                      left: `${CLIP_LEFT}px`,
                      width: `${CLIP_WIDTH}px`,
                      height: '40px',
                      top: '2px',
                      backgroundColor: clip01Muted ? 'rgba(0,102,255,0.06)' : 'rgba(0,102,255,0.2)',
                      borderLeft: `2px solid ${clip01Muted ? 'rgba(0,102,255,0.25)' : '#0066FF'}`,
                      opacity: clip01Muted ? 0.55 : 1,
                      cursor: clip01Loading ? 'not-allowed' : 'context-menu',
                      transition: 'opacity 0.3s, background-color 0.3s',
                    }}
                    onContextMenu={handleClip01ContextMenu}
                    title={clip01Loading ? '处理中，暂不可操作' : '右键查看操作'}
                  >
                    <div className="w-10 h-full opacity-50 rounded shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
                    <span className="text-[10px] truncate flex-1" style={{ color: '#93c5fd' }}>Clip_01.mp4</span>
                    {clip01Muted && !clip01Loading && (
                      <span className="material-symbols-outlined text-xs shrink-0" style={{ color: 'rgba(148,163,184,0.4)' }} aria-label="已静音" title="静音">volume_off</span>
                    )}
                    {/* Loading overlay */}
                    {clip01Loading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded" style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} aria-live="polite" aria-label="片段处理中">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full border-2 animate-spin shrink-0" style={{ borderColor: '#0066FF', borderTopColor: 'transparent' }}></div>
                          <span className="text-[9px] font-medium" style={{ color: '#60a5fa' }}>处理中…</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Invisible ref holder so context menu anchor still works during loading */}
                {hasLipSyncV2 && <div ref={clip01ChipRef} />}
              </div>
            </div>

            {/* Multimodal Video Track – Clip_01（无声）(same position as V1) */}
            {hasMultimodalTracks && (
              <div className="h-12 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(255,165,0,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(251,191,36,0.7)' }} aria-hidden="true">videocam</span>
                  <span className="text-[8px] font-bold" style={{ color: 'rgba(251,191,36,0.5)' }}>无声</span>
                </div>
                <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div className="absolute rounded px-2 flex items-center gap-2 overflow-hidden" style={{ left: `${CLIP_LEFT}px`, width: `${CLIP_WIDTH}px`, height: '40px', top: '2px', backgroundColor: 'rgba(251,191,36,0.1)', borderLeft: '2px solid rgba(251,191,36,0.7)' }}>
                    <div className="w-10 h-full opacity-40 rounded shrink-0" style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}></div>
                    <span className="text-[10px] truncate flex-1" style={{ color: '#fde68a' }}>Clip_01（无声）.mp4</span>
                    <span className="ml-auto shrink-0 text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>NEW</span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Track 2 (empty placeholder) */}
            <div className="h-12 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.25)' }} aria-hidden="true">videocam_off</span>
              </div>
              <div className="flex-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}></div>
            </div>

            {/* Background Audio Track */}
            <div className="h-10 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 shrink-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">music_note</span>
              </div>
              <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div className="absolute left-0 right-0 top-1 bottom-1 rounded px-3 flex items-center" style={{ backgroundColor: 'rgba(34,197,94,0.1)', borderLeft: '2px solid rgb(34,197,94)' }}>
                  <span className="text-[10px]" style={{ color: 'rgba(134,239,172,0.8)' }}>Background_Audio.mp3</span>
                </div>
              </div>
            </div>

            {/* A1 – 人声 track (after multimodal split) */}
            {hasMultimodalTracks && (
              <div className="h-10 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(139,92,246,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(167,139,250,0.7)' }} aria-hidden="true">record_voice_over</span>
                  <span className="text-[8px] font-bold" style={{ color: 'rgba(167,139,250,0.5)' }}>A1</span>
                </div>
                <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div className="absolute rounded px-2 flex items-center gap-2 overflow-hidden" style={{ left: `${CLIP_LEFT}px`, width: `${CLIP_WIDTH}px`, height: '28px', top: '4px', backgroundColor: 'rgba(139,92,246,0.12)', borderLeft: '2px solid rgba(139,92,246,0.7)' }}>
                    <span className="material-symbols-outlined text-xs shrink-0" style={{ color: 'rgba(167,139,250,0.8)' }} aria-hidden="true">mic</span>
                    <span className="text-[10px] truncate" style={{ color: '#c4b5fd' }}>Clip_01（人声）.mp3</span>
                    <span className="ml-auto shrink-0 text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>NEW</span>
                  </div>
                </div>
              </div>
            )}

            {/* A2 – BGM track (after multimodal split) */}
            {hasMultimodalTracks && (
              <div className="h-10 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(236,72,153,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(244,114,182,0.7)' }} aria-hidden="true">queue_music</span>
                  <span className="text-[8px] font-bold" style={{ color: 'rgba(244,114,182,0.5)' }}>A2</span>
                </div>
                <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <div className="absolute rounded px-2 flex items-center gap-2 overflow-hidden" style={{ left: `${CLIP_LEFT}px`, width: `${CLIP_WIDTH}px`, height: '28px', top: '4px', backgroundColor: 'rgba(236,72,153,0.1)', borderLeft: '2px solid rgba(236,72,153,0.7)' }}>
                    <span className="material-symbols-outlined text-xs shrink-0" style={{ color: 'rgba(244,114,182,0.8)' }} aria-hidden="true">music_note</span>
                    <span className="text-[10px] truncate" style={{ color: '#fbcfe8' }}>Clip_01（BGM）.mp3</span>
                    <span className="ml-auto shrink-0 text-[8px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(236,72,153,0.2)', color: '#f472b6' }}>NEW</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══ Context Menu ══ */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed rounded-xl overflow-hidden shadow-2xl py-1"
          style={{
            right: contextMenu.right,
            bottom: contextMenu.bottom,
            minWidth: '188px',
            /* z-index 100100 — above driver.js overlay (100000) so tour can highlight menu items */
            zIndex: 100100,
            backgroundColor: '#1C1D26',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          role="menu"
          aria-label="片段操作菜单"
        >
          {([
            { icon: 'delete', label: '删除' },
            { icon: 'content_copy', label: '复制' },
            { icon: 'content_paste', label: '粘贴' },
          ] as { icon: string; label: string }[]).map(({ icon, label }) => (
            <button
              key={label}
              onClick={() => setContextMenu(null)}
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
              style={{ color: 'rgba(203,213,225,0.9)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <span className="material-symbols-outlined text-base shrink-0" style={{ color: 'rgba(148,163,184,0.55)' }} aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}

          {/* Divider */}
          <div className="my-1 mx-3" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}></div>

          <button
            id="ctx-menu-lip-sync"
            onClick={handleOpenLipSync}
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
            style={{ color: 'rgba(203,213,225,0.9)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span className="material-symbols-outlined text-base shrink-0" style={{ color: 'rgba(148,163,184,0.55)' }} aria-hidden="true">record_voice_over</span>
            视频人物对口型
          </button>

          <button
            id="ctx-menu-multimodal"
            onClick={handleMultimodalSplit}
            role="menuitem"
            className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors"
            style={{ color: 'rgba(203,213,225,0.9)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            <span className="material-symbols-outlined text-base shrink-0" style={{ color: 'rgba(148,163,184,0.55)' }} aria-hidden="true">layers</span>
            视频多模态拆分
          </button>
        </div>
      )}

      {/* ══ Lip Sync Modal ══ */}
      {showLipSyncModal && (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lip-sync-title"
        >
          <div
            className="relative w-[600px] rounded-2xl overflow-hidden flex flex-col"
            style={{ backgroundColor: '#111114', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)', maxHeight: '85vh' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 id="lip-sync-title" className="text-base font-semibold text-white">视频对口型</h2>
              <button
                onClick={() => setShowLipSyncModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'rgba(148,163,184,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                aria-label="关闭弹窗"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Modal body – scrollable */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

              {/* Section: 视频讲话内容 */}
              <div className="flex flex-col gap-3">
                {/* Row: label + language dropdown */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">视频讲话内容</span>

                  {/* Target language dropdown */}
                  <div ref={lipSyncLangDropdownRef} className="relative">
                    <button
                      onClick={() => setShowLipSyncLangDropdown(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ backgroundColor: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.3)', color: '#60a5fa' }}
                      aria-label={`目标语种: ${lipSyncLang}`}
                      aria-expanded={showLipSyncLangDropdown}
                    >
                      <span className="material-symbols-outlined text-sm" aria-hidden="true">translate</span>
                      <span>目标语种：{lipSyncLang}</span>
                      <span
                        className="material-symbols-outlined text-xs"
                        style={{ transform: showLipSyncLangDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                        aria-hidden="true"
                      >expand_more</span>
                    </button>
                    {showLipSyncLangDropdown && (
                      <div className="absolute right-0 mt-1 w-32 rounded-lg shadow-2xl overflow-hidden z-10" style={{ backgroundColor: '#1A1B23', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {LIP_SYNC_LANGUAGES.map((lang) => (
                          <button
                            key={lang}
                            onClick={() => handleLipSyncLangChange(lang)}
                            className="w-full px-3 py-2.5 text-left text-xs transition-colors flex items-center justify-between"
                            style={{ color: lipSyncLang === lang ? '#0066FF' : 'rgba(203,213,225,0.9)', fontWeight: lipSyncLang === lang ? 700 : 400 }}
                            onMouseEnter={e => { if (lipSyncLang !== lang) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            {lang}
                            {lipSyncLang === lang && <span className="material-symbols-outlined text-xs" style={{ color: '#0066FF' }} aria-hidden="true">check</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ASR Segmented list */}
                <div className="relative flex flex-col gap-2.5">
                  {/* Global translating overlay */}
                  {lipSyncTranslating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(17,17,20,0.7)', backdropFilter: 'blur(4px)' }} aria-live="polite">
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: '#0066FF', borderTopColor: 'transparent' }}></div>
                        <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>翻译中…</span>
                      </div>
                    </div>
                  )}

                  {lipSyncSegments.map((seg) => (
                    <div
                      key={seg.id}
                      className="rounded-xl p-3 flex flex-col gap-2"
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      {/* Time range + speaker */}
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[11px] font-medium transition-all"
                          style={{
                            backgroundColor: seg.refreshing ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.06)',
                            color: seg.refreshing ? '#00f0ff' : 'rgba(148,163,184,0.7)',
                            border: `1px solid ${seg.refreshing ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {seg.refreshing && (
                            <span className="w-2.5 h-2.5 rounded-full border border-current animate-spin" style={{ borderTopColor: 'transparent' }}></span>
                          )}
                          {seg.timeRange}
                        </span>
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(148,163,184,0.5)' }}>{seg.speaker}</span>
                      </div>

                      {/* Editable text + confirm button */}
                      <div className="flex gap-2 items-start">
                        <textarea
                          value={seg.text}
                          onChange={(e) => handleSegmentTextChange(seg.id, e.target.value)}
                          disabled={lipSyncTranslating || seg.refreshing}
                          rows={2}
                          className="flex-1 rounded-lg text-sm p-2.5 resize-none outline-none transition-all leading-relaxed"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(203,213,225,0.9)',
                            opacity: lipSyncTranslating || seg.refreshing ? 0.5 : 1,
                          }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,102,255,0.5)' }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                          aria-label={`${seg.timeRange} 讲话内容`}
                        />
                        <button
                          onClick={() => handleSegmentConfirm(seg.id)}
                          disabled={lipSyncTranslating || seg.refreshing}
                          className="shrink-0 w-8 h-8 mt-0.5 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            backgroundColor: seg.refreshing ? 'rgba(0,240,255,0.1)' : 'rgba(0,102,255,0.12)',
                            border: `1px solid ${seg.refreshing ? 'rgba(0,240,255,0.4)' : 'rgba(0,102,255,0.3)'}`,
                            color: seg.refreshing ? '#00f0ff' : '#60a5fa',
                            opacity: lipSyncTranslating || seg.refreshing ? 0.5 : 1,
                            cursor: lipSyncTranslating || seg.refreshing ? 'not-allowed' : 'pointer',
                          }}
                          aria-label="确认修改"
                          title="确认修改，刷新时间轴"
                        >
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)' }}></div>

              {/* Section: 配音音色 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">配音音色</span>
                  <button
                    className="flex items-center gap-0.5 text-xs font-medium transition-colors"
                    style={{ color: '#0066FF' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#3b82f6' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#0066FF' }}
                    aria-label="浏览更多音色"
                  >
                    更多音色
                    <span className="material-symbols-outlined text-base" aria-hidden="true">chevron_right</span>
                  </button>
                </div>

                {/* Voice clone card (selected) */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ backgroundColor: 'rgba(0,102,255,0.07)', border: '2px solid #0066FF' }}
                  role="radio"
                  aria-checked="true"
                  tabIndex={0}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,102,255,0.15)' }}>
                    <span className="material-symbols-outlined text-lg" style={{ color: '#0066FF' }} aria-hidden="true">record_voice_over</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white">视频原声</span>
                    <span className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>Voice Cloning</span>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className="material-symbols-outlined text-xl" style={{ color: '#0066FF', fontVariationSettings: '"FILL" 1' }} aria-hidden="true">check_circle</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Credits hint */}
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ color: '#a78bfa', fontVariationSettings: '"FILL" 1' }} aria-hidden="true">stars</span>
                <span className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>确认生成将消耗 <span className="font-bold text-purple-400">50 算力</span></span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLipSyncModal(false)}
                  className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(203,213,225,0.9)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  取消
                </button>
                <button
                  onClick={handleLipSyncConfirm}
                  disabled={lipSyncTranslating}
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#0066FF', boxShadow: '0 4px 15px rgba(0,102,255,0.3)' }}
                >
                  确认生成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Multimodal Confirm Modal ══ */}
      {showMultimodalConfirmModal && (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="multimodal-title"
        >
          <div
            className="relative w-[440px] rounded-2xl overflow-hidden"
            style={{ backgroundColor: '#111114', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(251,191,36,0.12)' }}>
                  <span className="material-symbols-outlined text-base" style={{ color: '#fbbf24' }} aria-hidden="true">layers</span>
                </div>
                <h2 id="multimodal-title" className="text-base font-semibold text-white">视频多模态拆分</h2>
              </div>
              <button
                onClick={() => setShowMultimodalConfirmModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'rgba(148,163,184,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                aria-label="关闭"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(203,213,225,0.85)' }}>
                该功能支持拆分选中视频中的<span className="font-semibold text-white">画面</span>、<span className="font-semibold text-white">背景音乐</span>、<span className="font-semibold text-white">人声</span>，便于您对视频进行编辑。
              </p>
              {/* Feature preview chips */}
              <div className="flex gap-2 mt-4">
                {[
                  { icon: 'videocam', label: '画面轨道', color: '#fbbf24' },
                  { icon: 'record_voice_over', label: '人声轨道', color: '#a78bfa' },
                  { icon: 'music_note', label: 'BGM 轨道', color: '#f472b6' },
                ].map(({ icon, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(203,213,225,0.8)' }}
                  >
                    <span className="material-symbols-outlined text-sm" style={{ color }} aria-hidden="true">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              {/* Credits hint */}
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm" style={{ color: '#a78bfa', fontVariationSettings: '"FILL" 1' }} aria-hidden="true">stars</span>
                <span className="text-xs" style={{ color: 'rgba(148,163,184,0.6)' }}>确认拆分将消耗 <span className="font-bold text-purple-400">50 算力</span></span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMultimodalConfirmModal(false)}
                  className="px-5 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(203,213,225,0.9)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  取消
                </button>
                <button
                  onClick={handleMultimodalConfirm}
                  className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: '#0066FF', boxShadow: '0 4px 15px rgba(0,102,255,0.3)' }}
                >
                  确认拆分
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Smart Material Lightbox ══ */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[25000] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', animation: 'lightbox-fade-in 0.2s ease-out' }}
          onClick={() => setLightboxItem(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.type === 'image' ? '查看大图' : '播放视频'}
        >
          <div className="relative flex flex-col items-center" style={{ maxWidth: '80vw', maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)' }}
              aria-label="关闭"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
            </button>

            {lightboxItem.type === 'image' ? (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.prompt}
                className="object-contain"
                style={{ maxWidth: '80vw', maxHeight: '70vh', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ width: '640px', maxWidth: '80vw', aspectRatio: '16/9', borderRadius: '12px', backgroundColor: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <span className="material-symbols-outlined text-white text-3xl ml-0.5" aria-hidden="true">play_arrow</span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>视频预览（占位）</span>
                </div>
              </div>
            )}

            {/* Bottom info bar */}
            <div className="flex items-center justify-between w-full mt-3 px-1">
              <span className="text-xs truncate flex-1 mr-4" style={{ color: 'rgba(255,255,255,0.5)' }}>{lightboxItem.prompt}</span>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => showToast('已添加到轨道')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:brightness-110" style={{ borderRadius: '8px', backgroundColor: '#0066FF' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_circle</span>
                  使用
                </button>
                <button onClick={() => showToast('已开始下载')} className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-white/10" style={{ borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>download</span>
                  下载
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Toast ══ */}
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[30000] flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium text-white pointer-events-none"
          style={{ backgroundColor: '#1C1D26', border: '1px solid rgba(34,197,94,0.35)', boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.15)' }}
          role="status"
          aria-live="polite"
        >
          <span className="material-symbols-outlined text-base shrink-0" style={{ color: '#22c55e', fontVariationSettings: '"FILL" 1' }} aria-hidden="true">check_circle</span>
          {toast}
        </div>
      )}

    </div>
  )
}

export default ProfessionalEditPage
