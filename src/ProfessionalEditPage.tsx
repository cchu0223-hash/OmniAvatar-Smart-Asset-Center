// 专业剪辑页面 - 参考 stitch_immersive_wizard_prd-5/code.html + screen.png

import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTour } from './useTour'
import { getMaterials, addMaterial, deleteMaterial, subscribe, type SharedSmartMaterial } from './smartMaterialsStore'

type SidebarTool = '我的素材' | '虚拟人' | '图片' | '配音' | '音乐' | '文本' | '转场' | '模板' | '贴纸' | '素材优化'
type OptimizeTab = '素材更换' | '素材编辑' | '动画效果'
type OptimizeReplaceSubTab = '图片生成' | '视频生成'
type AnimSubTab = '入场动画' | '出场动画'
type TrackClip = { id: string; label: string; imageUrl: string; prompt: string; ratio: ImageRatio; model: ImageModel; resolution: ImageResolution; isLocal?: boolean }
type MaterialTab = '本地素材' | 'AI素材'
type GenerateTab = '图片生成' | '视频生成'
type LocalFilter = '全部' | '视频' | '图片' | '音频'
type ImageRatio = '16:9 宽屏' | '9:16 竖屏' | '4:3' | '1:1 方形'
type ImageModel = 'JIMENG 4.0' | 'JIMENG 3.0' | 'JIMENG 2.1'
type ImageResolution = '720p' | '1080p' | '2K'
type VideoRatio = '16:9 宽屏' | '9:16 竖屏' | '4:3' | '1:1 方形'
type VideoResolution = '720p' | '1080p' | '2K'
type VideoModel = 'KELING 3.0' | 'KELING 2.1' | 'KELING 1.6'

const SIDEBAR_TOOLS: { icon: string; label: SidebarTool; aiPlus?: boolean }[] = [
  { icon: 'video_library', label: '我的素材', aiPlus: true },
  { icon: 'account_circle', label: '虚拟人', aiPlus: true },
  { icon: 'image', label: '图片' },
  { icon: 'spatial_audio', label: '配音', aiPlus: true },
  { icon: 'music_note', label: '音乐' },
  { icon: 'text_fields', label: '文本' },
  { icon: 'compare_arrows', label: '转场' },
  { icon: 'dashboard', label: '模板' },
  { icon: 'cloud', label: '贴纸' },
]

const TRACK_CLIPS: TrackClip[] = [
  { id: 'clip01', label: 'Clip_01.mp4', imageUrl: 'https://picsum.photos/seed/clip01/400/225', prompt: '专业商务场景，现代办公室背景，明亮自然光', ratio: '16:9 宽屏', model: 'JIMENG 4.0', resolution: '1080p' },
  { id: 'local01', label: 'photo_001.jpg', imageUrl: 'https://picsum.photos/seed/local01/400/225', prompt: '', ratio: '16:9 宽屏', model: 'JIMENG 4.0', resolution: '1080p', isLocal: true },
]

const RELATED_IMAGES = [
  { seed: 'rel1', url: 'https://picsum.photos/seed/rel1/300/300' },
  { seed: 'rel2', url: 'https://picsum.photos/seed/rel2/300/300' },
  { seed: 'rel3', url: 'https://picsum.photos/seed/rel3/300/300' },
  { seed: 'rel4', url: 'https://picsum.photos/seed/rel4/300/300' },
  { seed: 'rel5', url: 'https://picsum.photos/seed/rel5/300/300' },
  { seed: 'rel6', url: 'https://picsum.photos/seed/rel6/300/300' },
]

const ENTER_ANIMS = ['淡入', '从左滑入', '从右滑入', '从上滑入', '从下滑入', '缩放进入', '旋转进入', '弹跳进入']
const EXIT_ANIMS = ['淡出', '向左滑出', '向右滑出', '向上滑出', '向下滑出', '缩放退出', '旋转退出', '弹跳退出']


const VIDEO_MODELS: VideoModel[] = ['KELING 3.0', 'KELING 2.1', 'KELING 1.6']

const MODEL_ICONS: Record<VideoModel, string> = {
  'KELING 3.0': 'auto_awesome',
  'KELING 2.1': 'movie_filter',
  'KELING 1.6': 'bolt',
}

type SmartMaterial = SharedSmartMaterial

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
  const [activeTool, setActiveTool] = useState<SidebarTool>('我的素材')
  const [materialTab, setMaterialTab] = useState<MaterialTab>('AI素材')
  const [generateTab, setGenerateTab] = useState<GenerateTab>('图片生成')
  const [localFilter, setLocalFilter] = useState<LocalFilter>('全部')

  // Image generation
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModel, setImageModel] = useState<ImageModel>('JIMENG 4.0')
  const [imageRatio, setImageRatio] = useState<ImageRatio>('1:1 方形')
  const [imageResolution, setImageResolution] = useState<ImageResolution>('720p')
  const [showAdvancedImage, setShowAdvancedImage] = useState(false)
  const [imagePopover, setImagePopover] = useState<'ratio' | 'model' | 'resolution' | null>(null)
  const [genPopover, setGenPopover] = useState<'ratio' | 'model' | 'resolution' | 'duration' | null>(null)

  // Video generation
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoModel, setVideoModel] = useState<VideoModel>('KELING 3.0')
  const [videoRatio, setVideoRatio] = useState<VideoRatio>('16:9 宽屏')
  const [videoResolution, setVideoResolution] = useState<VideoResolution>('720p')
  const [showAdvancedVideo, setShowAdvancedVideo] = useState(false)
  const [videoPopover, setVideoPopover] = useState<'ratio' | 'model' | 'resolution' | null>(null)
  const [videoDuration, setVideoDuration] = useState(5)

  // Smart materials state — synced with shared store
  const [smartMaterials, setSmartMaterials] = useState<SmartMaterial[]>(getMaterials)
  const [smartMaterialFilter, setSmartMaterialFilter] = useState<'图片' | '视频'>('图片')
  const [smartMaterialSearch, setSmartMaterialSearch] = useState('')

  const handleDeleteSmartMaterial = (id: string) => {
    deleteMaterial(id)
  }

  // Subscribe to shared store changes
  useEffect(() => {
    return subscribe(setSmartMaterials)
  }, [])

  // Lightbox for smart material preview
  const [lightboxItem, setLightboxItem] = useState<SmartMaterial | null>(null)

  const [aiLabel, setAiLabel] = useState(false)

  // ── Track selection / Material Optimize ──
  const [selectedTrack, setSelectedTrack] = useState<TrackClip | null>(null)
  const [optimizeTab, setOptimizeTab] = useState<OptimizeTab>('素材更换')
  const [replaceSubTab, setReplaceSubTab] = useState<OptimizeReplaceSubTab>('图片生成')
  const [animSubTab, setAnimSubTab] = useState<AnimSubTab>('入场动画')
  const [editX, setEditX] = useState(0)
  const [editY, setEditY] = useState(0)
  const [editW, setEditW] = useState(100)
  const [editH, setEditH] = useState(100)
  const [selectedEnterAnim, setSelectedEnterAnim] = useState('淡入')
  const [selectedExitAnim, setSelectedExitAnim] = useState('淡出')
  const [selectedRelated, setSelectedRelated] = useState<string | null>(null)

  // Optimize panel editable params (initialized from selected track)
  const [optimizePrompt, setOptimizePrompt] = useState('')
  const [optimizeModel, setOptimizeModel] = useState<ImageModel>('JIMENG 4.0')
  const [optimizeRatio, setOptimizeRatio] = useState<ImageRatio>('16:9 宽屏')
  const [optimizeResolution, setOptimizeResolution] = useState<ImageResolution>('720p')
  const [optimizePopover, setOptimizePopover] = useState<'ratio' | 'model' | 'resolution' | null>(null)
  const [optimizeGenPopover, setOptimizeGenPopover] = useState<'ratio' | 'model' | 'resolution' | 'duration' | null>(null)
  const [optimizeDuration, setOptimizeDuration] = useState(5)
  const [optimizeMaterialFilter, setOptimizeMaterialFilter] = useState<'图片' | '视频'>('图片')
  const [optimizeMaterialSearch, setOptimizeMaterialSearch] = useState('')

  // ── Panel resize ──
  const [leftPanelWidth, setLeftPanelWidth] = useState(288)
  const [timelineHeight, setTimelineHeight] = useState(256)



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

  // ── Resize handlers ──
  const handleLeftResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX, startW = leftPanelWidth
    const onMove = (ev: MouseEvent) => setLeftPanelWidth(Math.max(220, Math.min(480, startW + ev.clientX - startX)))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftPanelWidth])

  const handleTimelineResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY, startH = timelineHeight
    const onMove = (ev: MouseEvent) => setTimelineHeight(Math.max(120, Math.min(420, startH + startY - ev.clientY)))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [timelineHeight])

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
  // Init optimize panel params when track selection changes
  useEffect(() => {
    if (selectedTrack) {
      setOptimizePrompt(selectedTrack.prompt)
      setOptimizeModel(selectedTrack.model)
      setOptimizeRatio(selectedTrack.ratio)
      setOptimizeResolution(selectedTrack.resolution)
      setOptimizePopover(null)
      setSelectedRelated(null)
    }
  }, [selectedTrack])

  // Stable ref so tour closure always calls the latest version
  const openContextMenuRef = useRef(openContextMenuForTour)
  useEffect(() => { openContextMenuRef.current = openContextMenuForTour }, [openContextMenuForTour])

  // ── Tour configuration for /professional-edit ──
  useTour(
    'professional-edit',
    [
      {
        element: '#tour-material-panel',
        popover: {
          title: '素材模块',
          description: '在当前模块可以上传本地素材或使用 AI 素材生成。',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-smart-material-tab',
        popover: {
          title: 'AI素材',
          description: '支持生成视频 / 图片。',
          side: 'right',
          align: 'center',
        },
      },
      {
        element: '#tour-my-smart-materials',
        popover: {
          title: '我的AI素材',
          description: '支持在这里查看历史生成素材和素材中心收藏的素材。',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-credits',
        popover: {
          title: '算力中心',
          description: '生成素材需要消耗算力，您可点击这里进行查看或充值。',
          side: 'bottom',
          align: 'center',
        },
      },
    ],
    {
      delay: 1200,
      // Step 0: 点击"AI素材" Tab 后自动进入步骤2
      stepHooks: {
        0: {
          onActive: (driverObj) => {
            const btn = document.getElementById('tour-smart-material-tab')
            const handler = () => {
              setTimeout(() => driverObj.moveNext(), 150)
              btn?.removeEventListener('click', handler)
            }
            btn?.addEventListener('click', handler)
            return () => btn?.removeEventListener('click', handler)
          },
        },
      },
      onNextAtStep: {
        0: (driverObj) => {
          // 确保切换到AI素材 Tab
          const btn = document.getElementById('tour-smart-material-tab') as HTMLButtonElement | null
          btn?.click()
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

  // Close optimize popover on outside click
  useEffect(() => {
    if (!optimizePopover) return
    const handler = () => setOptimizePopover(null)
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [optimizePopover])

  // Close genPopover on outside click
  useEffect(() => {
    if (!genPopover) return
    const handler = () => setGenPopover(null)
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [genPopover])

  // Close optimizeGenPopover on outside click
  useEffect(() => {
    if (!optimizeGenPopover) return
    const handler = () => setOptimizeGenPopover(null)
    const timer = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => { clearTimeout(timer); document.removeEventListener('click', handler) }
  }, [optimizeGenPopover])

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

  // ── Material Optimize Panel (shown when track is selected) ──
  const MaterialOptimizePanel = () => (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* 3 tabs */}
      <div className="flex shrink-0" style={{ borderBottom: '1px solid #222226' }}>
        {(['素材更换', '素材编辑', '动画效果'] as OptimizeTab[]).map(tab => (
          <button key={tab} onClick={() => setOptimizeTab(tab)} className="flex-1 py-2.5 text-[11px] font-medium transition-colors" style={{ color: optimizeTab === tab ? '#0066FF' : 'rgba(148,163,184,0.5)', borderBottom: optimizeTab === tab ? '2px solid #0066FF' : '2px solid transparent', fontWeight: optimizeTab === tab ? 700 : 500 }}>{tab}</button>
        ))}
      </div>

      {/* ── 素材更换 ── */}
      {optimizeTab === '素材更换' && (() => {
        const isImg = replaceSubTab === '图片生成'
        return (
        <div className="flex-1 overflow-y-auto flex flex-col p-4" style={{ scrollbarWidth: 'none', gap: '14px' }}>

          {/* Prompt card: ref image + textarea + 示例 */}
          <div className="relative flex gap-3 p-3" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.02)', minHeight: '120px' }}>
            {selectedTrack?.isLocal ? (
              <button className="shrink-0 flex flex-col items-center justify-center gap-1.5" style={{ width: '80px', height: '96px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(148,163,184,0.4)' }} aria-label="上传参考图">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_photo_alternate</span>
                <span className="text-[9px] tracking-widest font-medium" style={{ color: 'rgba(148,163,184,0.3)' }}>REFERENCE</span>
              </button>
            ) : (
              <div className="relative shrink-0 group cursor-pointer" style={{ width: '80px', height: '96px', borderRadius: '10px', overflow: 'hidden', border: '1px dashed rgba(255,255,255,0.15)' }}>
                <img src={selectedTrack?.imageUrl ?? 'https://picsum.photos/seed/refmock/300/300'} alt="参考图" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <span className="material-symbols-outlined text-white" style={{ fontSize: '18px' }}>add_photo_alternate</span>
                  <span className="text-[8px] text-white/80">更换</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 py-0.5 text-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                  <span className="text-[8px] text-white/70">参考图</span>
                </div>
              </div>
            )}
            <textarea
              value={optimizePrompt}
              onChange={(e) => { setOptimizePrompt(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px' }}
              className="flex-1 text-[12px] resize-none outline-none leading-relaxed bg-transparent"
              style={{ color: 'rgba(203,213,225,0.9)', minHeight: '96px', paddingTop: '4px' }}
              placeholder="请描述要生成的画面内容…"
              aria-label="画面描述"
            />
          </div>

          {/* Controls row: type toggle + ratio + model + resolution [+ duration for video] */}
          <div className="flex items-center gap-1.5">
            {/* Type toggle */}
            <div className="flex shrink-0 p-0.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
              {(['图片生成', '视频生成'] as OptimizeReplaceSubTab[]).map(t => (
                <button key={t} onClick={() => { setReplaceSubTab(t); setOptimizeGenPopover(null) }}
                  className="px-2 py-1 text-[9px] font-medium rounded transition-all"
                  style={{ color: replaceSubTab === t ? 'white' : 'rgba(148,163,184,0.5)', backgroundColor: replaceSubTab === t ? '#0066FF' : 'transparent', fontWeight: replaceSubTab === t ? 700 : 500 }}>
                  {t === '图片生成' ? '图片' : '视频'}
                </button>
              ))}
            </div>
            <div className="w-px h-3 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            {/* 比例 */}
            <div className="relative flex-1">
              <button onClick={() => setOptimizeGenPopover(optimizeGenPopover === 'ratio' ? null : 'ratio')} className="w-full flex items-center gap-1 px-2 py-1.5 transition-all" style={{ borderRadius: '8px', backgroundColor: optimizeGenPopover === 'ratio' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${optimizeGenPopover === 'ratio' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}>
                <span className="text-[9px] font-medium flex-1 text-left truncate">{optimizeRatio.replace(' 宽屏','').replace(' 竖屏','').replace(' 方形','')}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
              </button>
              {optimizeGenPopover === 'ratio' && (
                <div className="absolute top-full left-0 mt-1 w-28 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {(['16:9 宽屏','9:16 竖屏','4:3','1:1 方形'] as ImageRatio[]).map(r => (
                    <button key={r} onClick={() => { setOptimizeRatio(r); setOptimizeGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/5 transition-colors" style={{ color: optimizeRatio === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: optimizeRatio === r ? 600 : 400 }}>{r}</button>
                  ))}
                </div>
              )}
            </div>
            {/* 模型 */}
            <div className="relative flex-1">
              <button onClick={() => setOptimizeGenPopover(optimizeGenPopover === 'model' ? null : 'model')} className="w-full flex items-center gap-1 px-2 py-1.5 transition-all" style={{ borderRadius: '8px', backgroundColor: optimizeGenPopover === 'model' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${optimizeGenPopover === 'model' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}>
                <span className="text-[9px] font-medium flex-1 text-left truncate">{isImg ? optimizeModel : videoModel}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
              </button>
              {optimizeGenPopover === 'model' && (
                <div className="absolute top-full left-0 mt-1 w-36 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {(isImg ? ['JIMENG 4.0','JIMENG 3.0','JIMENG 2.1'] as ImageModel[] : VIDEO_MODELS).map(m => (
                    <button key={m} onClick={() => { isImg ? setOptimizeModel(m as ImageModel) : setVideoModel(m as VideoModel); setOptimizeGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/5 transition-colors" style={{ color: (isImg ? optimizeModel : videoModel) === m ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: (isImg ? optimizeModel : videoModel) === m ? 600 : 400 }}>{m}</button>
                  ))}
                </div>
              )}
            </div>
            {/* 分辨率 */}
            <div className="relative flex-1">
              <button onClick={() => setOptimizeGenPopover(optimizeGenPopover === 'resolution' ? null : 'resolution')} className="w-full flex items-center gap-1 px-2 py-1.5 transition-all" style={{ borderRadius: '8px', backgroundColor: optimizeGenPopover === 'resolution' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${optimizeGenPopover === 'resolution' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}>
                <span className="text-[9px] font-medium flex-1 text-left truncate">{isImg ? optimizeResolution : videoResolution}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
              </button>
              {optimizeGenPopover === 'resolution' && (
                <div className="absolute top-full right-0 mt-1 w-20 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {(['720p','1080p','2K'] as ImageResolution[]).map(r => (
                    <button key={r} onClick={() => { isImg ? setOptimizeResolution(r) : setVideoResolution(r as VideoResolution); setOptimizeGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/5 transition-colors" style={{ color: (isImg ? optimizeResolution : videoResolution) === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: (isImg ? optimizeResolution : videoResolution) === r ? 600 : 400 }}>{r}</button>
                  ))}
                </div>
              )}
            </div>
            {/* 时长 (video only) */}
            {!isImg && (
              <div className="relative flex-1">
                <button onClick={() => setOptimizeGenPopover(optimizeGenPopover === 'duration' ? null : 'duration')} className="w-full flex items-center gap-1 px-2 py-1.5 transition-all" style={{ borderRadius: '8px', backgroundColor: optimizeGenPopover === 'duration' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${optimizeGenPopover === 'duration' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}>
                  <span className="text-[9px] font-medium flex-1 text-left truncate">{optimizeDuration}s</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
                </button>
                {optimizeGenPopover === 'duration' && (
                  <div className="absolute top-full right-0 mt-1 w-20 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {[4, 5, 6, 8, 10, 12, 15].map(d => (
                      <button key={d} onClick={() => { setOptimizeDuration(d); setOptimizeGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] hover:bg-white/5 transition-colors" style={{ color: optimizeDuration === d ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: optimizeDuration === d ? 600 : 400 }}>{d}s</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTA row */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.35)' }}>剩余算力</span>
              <span className="text-[13px] font-bold" style={{ color: 'rgba(203,213,225,0.85)' }}>48,510</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#22d3ee' }}>electric_bolt</span>
                <span className="text-[13px] font-bold text-white">{isImg ? 20 : 100}</span>
              </div>
              <button className="px-4 py-2 text-white text-[12px] font-bold flex items-center gap-1.5 hover:brightness-110 transition-all" style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #0066FF 0%, #1a7fff 100%)', boxShadow: '0 4px 16px rgba(0,102,255,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{isImg ? 'image' : 'videocam'}</span>
                重新生成
              </button>
            </div>
          </div>

          {/* 我的智能素材 */}
          <div className="flex flex-col" style={{ gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">search</span>
              <input
                type="text"
                value={optimizeMaterialSearch}
                onChange={e => setOptimizeMaterialSearch(e.target.value)}
                placeholder="搜索素材…"
                className="w-full rounded-lg text-xs py-2 pl-8 pr-3 outline-none transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #222226', color: 'rgba(203,213,225,0.9)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#0066FF' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#222226' }}
                aria-label="搜索AI素材"
              />
            </div>
            <div className="flex gap-1">
              {(['图片', '视频'] as const).map(f => (
                <button key={f} onClick={() => setOptimizeMaterialFilter(f)} className="px-2 py-0.5 text-[9px] font-medium rounded transition-all" style={{ backgroundColor: optimizeMaterialFilter === f ? '#0066FF' : 'rgba(255,255,255,0.05)', color: optimizeMaterialFilter === f ? 'white' : 'rgba(148,163,184,0.5)', border: `1px solid ${optimizeMaterialFilter === f ? '#0066FF' : 'rgba(255,255,255,0.06)'}` }}>{f}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {/* Current track — highlighted, shown when filter is 图片 */}
              {selectedTrack && optimizeMaterialFilter === '图片' && (() => {
                const isSel = selectedRelated === '__current__'
                return (
                  <div className="relative aspect-square overflow-hidden cursor-pointer group" style={{ borderRadius: '6px', border: `2px solid ${isSel ? '#0066FF' : 'rgba(0,102,255,0.5)'}`, boxShadow: isSel ? '0 0 0 2px rgba(0,102,255,0.3)' : 'none' }} onClick={() => setSelectedRelated('__current__')}>
                    <img src={selectedTrack.imageUrl} alt="当前素材" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0.5 right-0.5 px-1 py-px" style={{ backgroundColor: '#0066FF', borderRadius: '3px' }}>
                      <span className="text-[7px] text-white font-bold">当前</span>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-0.5">
                      <div className="flex justify-end">
                        <button onClick={(e) => { e.stopPropagation(); setLightboxItem({ id: '__current__', type: 'image', url: selectedTrack.imageUrl, prompt: selectedTrack.prompt }) }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="放大"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>zoom_in</span></button>
                      </div>
                      <div className="flex justify-end gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); showToast('已加入轨道') }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="加入"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>add_circle</span></button>
                        <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="下载"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>download</span></button>
                        <button onClick={(e) => { e.stopPropagation(); showToast('已删除') }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="删除"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>delete</span></button>
                      </div>
                    </div>
                  </div>
                )
              })()}
              {smartMaterials
                .filter(m => m.type === (optimizeMaterialFilter === '图片' ? 'image' : 'video'))
                .filter(m => !optimizeMaterialSearch || m.prompt.toLowerCase().includes(optimizeMaterialSearch.toLowerCase()))
                .map(item => {
                  const isSel = selectedRelated === String(item.id)
                  return (
                    <div key={item.id} className="relative overflow-hidden cursor-pointer group" style={{ borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', aspectRatio: item.type === 'video' ? '16/9' : '1/1', border: `2px solid ${isSel ? '#0066FF' : 'transparent'}`, boxShadow: isSel ? '0 0 0 2px rgba(0,102,255,0.3)' : 'none' }} onClick={() => setSelectedRelated(String(item.id))}>
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.08), rgba(112,0,255,0.08))' }}>
                          <span className="material-symbols-outlined text-xl" style={{ color: 'rgba(148,163,184,0.2)' }}>movie</span>
                        </div>
                      )}
                      <div className="absolute bottom-0.5 right-0.5 px-1 py-px" style={{ backgroundColor: item.type === 'video' ? 'rgba(112,0,255,0.6)' : 'rgba(0,0,0,0.55)', borderRadius: '3px' }}>
                        <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.type === 'video' ? '视频' : 'AI生成'}</span>
                      </div>
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-0.5">
                        <div className="flex justify-end">
                          <button onClick={(e) => { e.stopPropagation(); setLightboxItem(item) }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="放大"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>zoom_in</span></button>
                        </div>
                        <div className="flex justify-end gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedRelated(String(item.id)); showToast('已加入轨道') }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="加入"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>add_circle</span></button>
                          <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="下载"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>download</span></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteSmartMaterial(item.id) }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="删除"><span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>delete</span></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
        )
      })()}

      {/* ── 素材编辑 ── */}
      {optimizeTab === '素材编辑' && (
        <div className="flex-1 overflow-y-auto flex flex-col p-4" style={{ scrollbarWidth: 'none', gap: '20px' }}>
          <div className="flex flex-col" style={{ gap: '12px' }}>
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(203,213,225,0.7)' }}>位置</span>
            {[['X 轴', editX, setEditX], ['Y 轴', editY, setEditY]].map(([label, val, setter]) => (
              <div key={label as string} className="flex flex-col" style={{ gap: '6px' }}>
                <div className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>{label as string}</span>
                  <span className="text-[10px] font-mono" style={{ color: '#0066FF' }}>{val as number}</span>
                </div>
                <input type="range" min={-200} max={200} value={val as number} onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))} className="w-full h-1 appearance-none cursor-pointer outline-none" style={{ background: `linear-gradient(to right, #0066FF ${((val as number + 200) / 400) * 100}%, rgba(255,255,255,0.08) ${((val as number + 200) / 400) * 100}%)`, borderRadius: '4px', WebkitAppearance: 'none' }} />
              </div>
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: '12px' }}>
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(203,213,225,0.7)' }}>大小</span>
            {[['宽度 %', editW, setEditW], ['高度 %', editH, setEditH]].map(([label, val, setter]) => (
              <div key={label as string} className="flex flex-col" style={{ gap: '6px' }}>
                <div className="flex justify-between">
                  <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.5)' }}>{label as string}</span>
                  <span className="text-[10px] font-mono" style={{ color: '#0066FF' }}>{val as number}%</span>
                </div>
                <input type="range" min={10} max={200} value={val as number} onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))} className="w-full h-1 appearance-none cursor-pointer outline-none" style={{ background: `linear-gradient(to right, #0066FF ${((val as number - 10) / 190) * 100}%, rgba(255,255,255,0.08) ${((val as number - 10) / 190) * 100}%)`, borderRadius: '4px', WebkitAppearance: 'none' }} />
              </div>
            ))}
            <button onClick={() => { setEditX(0); setEditY(0); setEditW(100); setEditH(100) }} className="text-[10px] self-start hover:text-white transition-colors" style={{ color: 'rgba(148,163,184,0.4)' }}>重置</button>
          </div>
        </div>
      )}

      {/* ── 动画效果 ── */}
      {optimizeTab === '动画效果' && (
        <div className="flex-1 overflow-y-auto flex flex-col p-3" style={{ scrollbarWidth: 'none', gap: '12px' }}>
          <div className="flex p-0.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            {(['入场动画', '出场动画'] as AnimSubTab[]).map(tab => (
              <button key={tab} onClick={() => setAnimSubTab(tab)} className="flex-1 py-1.5 text-[11px] font-medium rounded transition-all" style={{ color: animSubTab === tab ? 'white' : 'rgba(148,163,184,0.5)', backgroundColor: animSubTab === tab ? '#0066FF' : 'transparent' }}>{tab}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(animSubTab === '入场动画' ? ENTER_ANIMS : EXIT_ANIMS).map(anim => {
              const isSel = animSubTab === '入场动画' ? selectedEnterAnim === anim : selectedExitAnim === anim
              return (
                <button key={anim} onClick={() => animSubTab === '入场动画' ? setSelectedEnterAnim(anim) : setSelectedExitAnim(anim)} className="py-2.5 text-[11px] font-medium transition-all rounded-lg" style={{ backgroundColor: isSel ? 'rgba(0,102,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isSel ? 'rgba(0,102,255,0.5)' : 'rgba(255,255,255,0.07)'}`, color: isSel ? '#60a5fa' : 'rgba(148,163,184,0.65)' }}>{anim}</button>
              )
            })}
          </div>
          <div className="flex flex-col" style={{ gap: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between text-[10px]"><span style={{ color: 'rgba(148,163,184,0.4)' }}>入场：</span><span style={{ color: '#60a5fa' }}>{selectedEnterAnim}</span></div>
            <div className="flex justify-between text-[10px]"><span style={{ color: 'rgba(148,163,184,0.4)' }}>出场：</span><span style={{ color: '#60a5fa' }}>{selectedExitAnim}</span></div>
          </div>
        </div>
      )}
    </div>
  )

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

  // ── Smart Generate Panel (unified 图片/视频) ──
  const SmartGeneratePanel = () => {
    const isImage = generateTab === '图片生成'
    return (
    <div className="flex-1 overflow-y-auto flex flex-col p-4" style={{ scrollbarWidth: 'none', gap: '14px' }}>

      {/* ── Prompt card ── */}
      <div className="relative flex gap-3 p-3" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.02)', minHeight: '120px' }}>
        <button
          className="shrink-0 flex flex-col items-center justify-center gap-1.5"
          style={{ width: '80px', height: '96px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(148,163,184,0.4)' }}
          aria-label="上传参考图"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>add_photo_alternate</span>
          <span className="text-[9px] tracking-widest font-medium" style={{ color: 'rgba(148,163,184,0.3)' }}>REFERENCE</span>
        </button>
        <textarea
          value={isImage ? imagePrompt : videoPrompt}
          onChange={(e) => {
            if (isImage) setImagePrompt(e.target.value)
            else setVideoPrompt(e.target.value)
            e.currentTarget.style.height = 'auto'
            e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'
          }}
          className="flex-1 text-[12px] resize-none outline-none leading-relaxed bg-transparent"
          style={{ color: 'rgba(203,213,225,0.9)', minHeight: '96px', paddingTop: '4px' }}
          placeholder={isImage ? '描述你想生成的图片内容，例如：一只穿着宇航服的猫咪漫步在月球表面...' : '支持上传多个参考素材，输入文字例如：@图片1 走进一个繁华的商业街，背景灯光闪烁...'}
          aria-label="画面描述"
        />
      </div>

      {/* ── Controls row: type toggle + type-specific dropdowns ── */}
      <div className="flex items-center gap-1.5">
        {/* Type toggle pill */}
        <div className="flex shrink-0 p-0.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          {(['图片生成', '视频生成'] as GenerateTab[]).map(t => (
            <button
              key={t}
              onClick={() => { setGenerateTab(t); setGenPopover(null) }}
              className="px-2 py-1 text-[9px] font-medium rounded transition-all"
              style={{ color: generateTab === t ? 'white' : 'rgba(148,163,184,0.5)', backgroundColor: generateTab === t ? '#0066FF' : 'transparent', fontWeight: generateTab === t ? 700 : 500 }}
            >
              {t === '图片生成' ? '图片' : '视频'}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-3 shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />

        {/* 比例 */}
        <div className="relative flex-1">
          <button
            onClick={() => setGenPopover(genPopover === 'ratio' ? null : 'ratio')}
            className="w-full flex items-center gap-1 px-2 py-1.5 transition-all"
            style={{ borderRadius: '8px', backgroundColor: genPopover === 'ratio' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${genPopover === 'ratio' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}
          >
            <span className="text-[9px] font-medium flex-1 text-left truncate">
              {(isImage ? imageRatio : videoRatio).replace(' 宽屏', '').replace(' 竖屏', '').replace(' 方形', '')}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
          </button>
          {genPopover === 'ratio' && (
            <div className="absolute top-full left-0 mt-1 w-28 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {(['16:9 宽屏', '9:16 竖屏', '4:3', '1:1 方形'] as ImageRatio[]).map(r => (
                <button key={r} onClick={() => { isImage ? setImageRatio(r) : setVideoRatio(r as VideoRatio); setGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] transition-colors hover:bg-white/5" style={{ color: (isImage ? imageRatio : videoRatio) === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: (isImage ? imageRatio : videoRatio) === r ? 600 : 400 }}>{r}</button>
              ))}
            </div>
          )}
        </div>

        {/* 模型 */}
        <div className="relative flex-1">
          <button
            onClick={() => setGenPopover(genPopover === 'model' ? null : 'model')}
            className="w-full flex items-center gap-1 px-2 py-1.5 transition-all"
            style={{ borderRadius: '8px', backgroundColor: genPopover === 'model' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${genPopover === 'model' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}
          >
            <span className="text-[9px] font-medium flex-1 text-left truncate">{isImage ? imageModel : videoModel}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
          </button>
          {genPopover === 'model' && (
            <div className="absolute top-full left-0 mt-1 w-36 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {(isImage ? ['JIMENG 4.0', 'JIMENG 3.0', 'JIMENG 2.1'] as ImageModel[] : VIDEO_MODELS).map(m => (
                <button key={m} onClick={() => { isImage ? setImageModel(m as ImageModel) : setVideoModel(m as VideoModel); setGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] transition-colors hover:bg-white/5" style={{ color: (isImage ? imageModel : videoModel) === m ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: (isImage ? imageModel : videoModel) === m ? 600 : 400 }}>{m}</button>
              ))}
            </div>
          )}
        </div>

        {/* 分辨率 */}
        <div className="relative flex-1">
          <button
            onClick={() => setGenPopover(genPopover === 'resolution' ? null : 'resolution')}
            className="w-full flex items-center gap-1 px-2 py-1.5 transition-all"
            style={{ borderRadius: '8px', backgroundColor: genPopover === 'resolution' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${genPopover === 'resolution' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}
          >
            <span className="text-[9px] font-medium flex-1 text-left truncate">{isImage ? imageResolution : videoResolution}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
          </button>
          {genPopover === 'resolution' && (
            <div className="absolute top-full right-0 mt-1 w-20 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              {(['720p', '1080p', '2K'] as ImageResolution[]).map(r => (
                <button key={r} onClick={() => { isImage ? setImageResolution(r) : setVideoResolution(r as VideoResolution); setGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] transition-colors hover:bg-white/5" style={{ color: (isImage ? imageResolution : videoResolution) === r ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: (isImage ? imageResolution : videoResolution) === r ? 600 : 400 }}>{r}</button>
              ))}
            </div>
          )}
        </div>

        {/* 时长 (video only) */}
        {!isImage && (
          <div className="relative flex-1">
            <button
              onClick={() => setGenPopover(genPopover === 'duration' ? null : 'duration')}
              className="w-full flex items-center gap-1 px-2 py-1.5 transition-all"
              style={{ borderRadius: '8px', backgroundColor: genPopover === 'duration' ? 'rgba(0,102,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${genPopover === 'duration' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'}`, color: 'rgba(203,213,225,0.9)' }}
            >
              <span className="text-[9px] font-medium flex-1 text-left truncate">{videoDuration}s</span>
              <span className="material-symbols-outlined" style={{ fontSize: '10px', color: 'rgba(148,163,184,0.4)' }}>unfold_more</span>
            </button>
            {genPopover === 'duration' && (
              <div className="absolute top-full right-0 mt-1 w-20 overflow-hidden z-50" style={{ borderRadius: '8px', backgroundColor: 'rgba(22,23,30,0.97)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                {[4, 5, 6, 8, 10, 12, 15].map(d => (
                  <button key={d} onClick={() => { setVideoDuration(d); setGenPopover(null) }} className="w-full px-3 py-1.5 text-left text-[10px] transition-colors hover:bg-white/5" style={{ color: videoDuration === d ? '#0066FF' : 'rgba(203,213,225,0.8)', fontWeight: videoDuration === d ? 600 : 400 }}>{d}s</button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── CTA Row ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px]" style={{ color: 'rgba(148,163,184,0.35)' }}>剩余算力</span>
          <span className="text-[13px] font-bold" style={{ color: 'rgba(203,213,225,0.85)' }}>48,510</span>
        </div>
        <div className="flex items-center gap-2">
          <div id={isImage ? 'tour-credits' : undefined} className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#22d3ee' }}>electric_bolt</span>
            <span className="text-[13px] font-bold text-white">{isImage ? 20 : 100}</span>
          </div>
          <button
            onClick={() => {
              if (isImage) {
                const url = `https://picsum.photos/seed/${Date.now()}/400/400`
                addMaterial({ type: 'image', url, prompt: imagePrompt || '图片生成', ratio: imageRatio, model: imageModel, source: 'editor' })
              } else {
                addMaterial({ type: 'video', url: '', prompt: videoPrompt || '视频生成', ratio: videoRatio, model: videoModel, duration: videoDuration, source: 'editor' })
              }
            }}
            className="px-4 py-2 text-white text-[12px] font-bold flex items-center gap-1.5 transition-all hover:brightness-110"
            style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #0066FF 0%, #1a7fff 100%)', boxShadow: '0 4px 16px rgba(0,102,255,0.3)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }} aria-hidden="true">{isImage ? 'image' : 'videocam'}</span>
            {isImage ? '立即生图' : '立即生成'}
          </button>
        </div>
      </div>

      {/* ── 我的智能素材 ── */}
      <div id="tour-my-smart-materials" className="flex flex-col" style={{ gap: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(148,163,184,0.4)' }} aria-hidden="true">search</span>
          <input
            type="text"
            value={smartMaterialSearch}
            onChange={e => setSmartMaterialSearch(e.target.value)}
            placeholder="搜索素材…"
            className="w-full rounded-lg text-xs py-2 pl-8 pr-3 outline-none transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #222226', color: 'rgba(203,213,225,0.9)' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0066FF' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#222226' }}
            aria-label="搜索AI素材"
          />
        </div>
        <div className="flex gap-1">
          {(['图片', '视频'] as const).map(f => (
            <button key={f} onClick={() => setSmartMaterialFilter(f)} className="px-2 py-0.5 text-[9px] font-medium rounded transition-all" style={{ backgroundColor: smartMaterialFilter === f ? '#0066FF' : 'rgba(255,255,255,0.05)', color: smartMaterialFilter === f ? 'white' : 'rgba(148,163,184,0.5)', border: `1px solid ${smartMaterialFilter === f ? '#0066FF' : 'rgba(255,255,255,0.06)'}` }}>{f}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {smartMaterials
            .filter(m => m.type === (smartMaterialFilter === '图片' ? 'image' : 'video'))
            .filter(m => !smartMaterialSearch || m.prompt.toLowerCase().includes(smartMaterialSearch.toLowerCase()))
            .map((item) => (
            <div
              key={item.id}
              className="relative overflow-hidden cursor-pointer group"
              style={{ borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.04)', aspectRatio: item.type === 'video' ? '16/9' : '1/1' }}
              onClick={() => { if (item.type === 'image') setImagePrompt(item.prompt); else { if (item.ratio) setVideoRatio(item.ratio as VideoRatio); if (item.model) setVideoModel(item.model as VideoModel); if (item.duration) setVideoDuration(item.duration) } }}
            >
              {item.type === 'image' ? (
                <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.08), rgba(112,0,255,0.08))' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: 'rgba(148,163,184,0.2)' }}>movie</span>
                </div>
              )}
              <div className="absolute bottom-0.5 right-0.5 px-1 py-px" style={{ backgroundColor: item.type === 'video' ? 'rgba(112,0,255,0.6)' : 'rgba(0,0,0,0.55)', borderRadius: '3px' }}>
                <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.type === 'video' ? '视频' : 'AI生成'}</span>
              </div>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-0.5">
                <div className="flex justify-end">
                  <button onClick={(e) => { e.stopPropagation(); setLightboxItem(item) }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="放大查看">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>zoom_in</span>
                  </button>
                </div>
                <div className="flex justify-end gap-0.5">
                  <button onClick={(e) => { e.stopPropagation() }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="使用">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>add_circle</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation() }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="下载">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>download</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteMaterial(item.id) }} className="w-5 h-5 flex items-center justify-center" style={{ borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.75)' }} aria-label="删除">
                    <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    )
  }

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
          <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>返回首页
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

        {/* ── Icon Sidebar (full height, spans body + timeline) ── */}
        <aside className="w-16 flex flex-col border-r shrink-0" style={{ backgroundColor: '#0A0A0B', borderColor: '#222226' }}>
          <nav className="flex flex-col gap-0.5 w-full overflow-y-auto flex-1" style={{ scrollbarWidth: 'none' }} aria-label="工具栏">
            {SIDEBAR_TOOLS.map(({ icon, label, aiPlus }) => {
              const active = activeTool === label
              return (
                <button key={label} onClick={() => { setActiveTool(label); setSelectedTrack(null) }} className="relative flex flex-col items-center gap-0.5 cursor-pointer transition-colors py-2.5 w-full shrink-0" style={{ color: active ? '#0066FF' : 'rgba(148,163,184,0.5)', borderLeft: active ? '2px solid #0066FF' : '2px solid transparent', backgroundColor: active ? 'rgba(0,102,255,0.05)' : 'transparent' }} aria-label={label} aria-pressed={active}>
                  <div className="relative">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }} aria-hidden="true">{icon}</span>
                    {aiPlus && <span className="absolute -top-1 -right-2 text-[7px] font-black px-0.5 rounded" style={{ backgroundColor: '#0066FF', color: 'white', lineHeight: '1.4' }}>AI+</span>}
                  </div>
                  <span className="text-[9px] leading-tight text-center">{label}</span>
                </button>
              )
            })}
            {/* ── 素材优化 (appears when track selected) ── */}
            {selectedTrack && (() => {
              const active = activeTool === '素材优化'
              return (
                <>
                  <div className="mx-2 my-1" style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <button onClick={() => setActiveTool('素材优化')} className="relative flex flex-col items-center gap-0.5 cursor-pointer transition-colors py-2.5 w-full shrink-0" style={{ color: active ? '#0066FF' : 'rgba(148,163,184,0.5)', borderLeft: active ? '2px solid #0066FF' : '2px solid transparent', backgroundColor: active ? 'rgba(0,102,255,0.05)' : 'transparent' }} aria-label="素材优化" aria-pressed={active}>
                    <div className="relative">
                      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>auto_fix_high</span>
                      <span className="absolute -top-1 -right-2 text-[7px] font-black px-0.5 rounded" style={{ backgroundColor: 'rgba(255,165,0,0.9)', color: 'white', lineHeight: '1.4' }}>新</span>
                    </div>
                    <span className="text-[9px] leading-tight text-center">素材优化</span>
                  </button>
                </>
              )
            })()}
          </nav>
        </aside>

        {/* ── Right column: [Left Panel + Canvas] above [Timeline] ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">

            {/* ── Left Panel (resizable) ── */}
            <aside id="tour-material-panel" className="flex flex-col border-r shrink-0 overflow-hidden relative" style={{ width: `${leftPanelWidth}px`, backgroundColor: '#0A0A0B', borderColor: '#222226' }}>
              {activeTool === '素材优化' && selectedTrack ? (
                <MaterialOptimizePanel />
              ) : (
                <>
                  <div className="flex border-b shrink-0" style={{ borderColor: '#222226' }}>
                    {(['本地素材', 'AI素材'] as MaterialTab[]).map((tab) => (
                      <button key={tab} id={tab === 'AI素材' ? 'tour-smart-material-tab' : undefined} onClick={() => setMaterialTab(tab)} className="flex-1 py-3 text-xs font-medium transition-colors" style={{ color: materialTab === tab ? '#0066FF' : 'rgba(148,163,184,0.6)', borderBottom: materialTab === tab ? '2px solid #0066FF' : '2px solid transparent', fontWeight: materialTab === tab ? 700 : 500 }}>{tab}</button>
                    ))}
                  </div>
                  {materialTab === '本地素材' ? <LocalMaterialsPanel /> : <SmartGeneratePanel />}
                </>
              )}
              {/* Drag handle */}
              <div onMouseDown={handleLeftResizeStart} className="absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors hover:bg-blue-500/30" style={{ zIndex: 10 }} />
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

          {/* ── Timeline (resizable, to the right of icon sidebar) ── */}
          <div className="shrink-0 flex flex-col relative" style={{ height: `${timelineHeight}px`, backgroundColor: '#0A0A0B', borderTop: '1px solid #222226' }}>
            {/* Resize handle on top */}
            <div onMouseDown={handleTimelineResizeStart} className="absolute top-0 left-0 right-0 h-1 cursor-row-resize transition-colors hover:bg-blue-500/30" style={{ zIndex: 10 }} />
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
                      cursor: clip01Loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.3s, background-color 0.3s',
                      outline: selectedTrack?.id === 'clip01' ? '2px solid #0066FF' : 'none',
                      outlineOffset: '1px',
                    }}
                    onClick={() => { if (!clip01Loading) { setSelectedTrack(TRACK_CLIPS[0]); setActiveTool('素材优化'); setOptimizeTab('素材更换') } }}
                    onContextMenu={handleClip01ContextMenu}
                    title={clip01Loading ? '处理中，暂不可操作' : '点击选中，右键查看操作'}
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

            {/* Video Track 2 – 本地上传素材 */}
            <div className="h-12 flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5" style={{ backgroundColor: 'rgba(34,197,94,0.04)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="material-symbols-outlined text-xs" style={{ color: 'rgba(134,239,172,0.6)' }} aria-hidden="true">image</span>
                <span className="text-[8px]" style={{ color: 'rgba(134,239,172,0.4)' }}>V2</span>
              </div>
              <div className="flex-1 relative p-1" style={{ backgroundColor: 'rgba(255,255,255,0.01)' }}>
                <div
                  className="absolute rounded px-2 flex items-center gap-2 overflow-hidden select-none cursor-pointer group"
                  style={{
                    left: `${CLIP_LEFT + CLIP_WIDTH + 12}px`,
                    width: '140px',
                    height: '40px',
                    top: '2px',
                    backgroundColor: selectedTrack?.id === 'local01' ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.12)',
                    borderLeft: '2px solid rgba(34,197,94,0.6)',
                    outline: selectedTrack?.id === 'local01' ? '2px solid #60A5FA' : 'none',
                    outlineOffset: '1px',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={() => { setSelectedTrack(TRACK_CLIPS[1]); setActiveTool('素材优化'); setOptimizeTab('动画效果') }}
                  title="点击选中，进入素材优化"
                >
                  {/* Thumbnail strip */}
                  <div className="w-8 h-full rounded shrink-0 overflow-hidden" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
                    <img src="https://picsum.photos/seed/local01/32/40" alt="" className="w-full h-full object-cover opacity-70" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] truncate font-medium" style={{ color: '#86efac' }}>photo_001.jpg</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[8px] px-1 py-px rounded font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: 'rgba(134,239,172,0.8)' }}>本地</span>
                      <span className="text-[8px]" style={{ color: 'rgba(134,239,172,0.4)' }}>2.3s</span>
                    </div>
                  </div>
                </div>
              </div>
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
          </div> {/* end right column */}
      </div> {/* end body */}

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
