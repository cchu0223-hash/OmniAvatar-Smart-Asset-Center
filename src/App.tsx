// Styles are in index.html

import { useState, useEffect, useRef } from 'react'
import TextType from './TextType'
import { useNavigate } from 'react-router-dom'
import { useTour } from './useTour'
import { addMaterial } from './smartMaterialsStore'

type GenerationCategory = 'image' | 'video'
type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16'
type Resolution = '720p' | '1080p' | '2K'

interface HistoryItem {
  id: string
  type: 'image' | 'video'
  prompt: string
  thumbnail: string
  aspectRatio: string
  timestamp: string
  status: 'completed' | 'generating'
  // Task linkage for generating cards & param recall
  taskId?: string
  model?: string
  resolution?: string
  duration?: number
}

type TaskStatus = 'queued' | 'generating' | 'completed' | 'failed'

interface TaskItem {
  id: string
  type: GenerationCategory
  status: TaskStatus
  progress: number
  prompt: string
  thumbnail: string
  thumbnails: string[] // 图片任务生成4张，视频任务1张
  model: string
  aspectRatio: AspectRatio
  resolution: Resolution
  duration?: number
  estimatedTime: number
  createdAt: number
}

// 格式化提交时间
const formatSubmitTime = (ts: number): string => {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function App() {
  const navigate = useNavigate()

  // ── Onboarding Tour (首页 3 步引导) ──
  useTour(
    'home-main',
    [
      {
        element: '#tour-category-capsules',
        popover: {
          title: '选择素材类型',
          description: '点击选择您需要的素材类型。',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-params-bar',
        popover: {
          title: '调整素材格式',
          description: '在这里调整您需要的素材格式。',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '#tour-my-tab',
        popover: {
          title: '查看历史任务',
          description: '在这里可以查看您历史提交的生成任务，并支持重新编辑生成或收藏至素材。',
          side: 'bottom',
          align: 'center',
        },
      },
      {
        element: '#tour-credits',
        popover: {
          title: '算力中心',
          description: '生成素材需要消耗算力，您可点击这里进行查看或充值。',
          side: 'bottom',
          align: 'end',
        },
      },
    ],
    { delay: 800 },
  )

  const [category, setCategory] = useState<GenerationCategory>('image')
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('Flux Pro')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1')
  const [selectedResolution, setSelectedResolution] = useState<Resolution>('1080p')
  const [duration, setDuration] = useState(10)
  const [inputValue, setInputValue] = useState('')
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [hasMoreHistory, setHasMoreHistory] = useState(true)
  const [taskQueue, setTaskQueue] = useState<TaskItem[]>([])
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const [hoveredImageKey, setHoveredImageKey] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<{ url: string; prompt: string } | null>(null)
  // Feed tab & search
  const [feedTab, setFeedTab] = useState<'recommend' | 'mine'>('recommend')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  // "我的" tab - selected work
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null)
  // Lightbox / video modal
  const [lightboxItem, setLightboxItem] = useState<HistoryItem | null>(null)
  // Reference image from "做同款"
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  // ActionDock auto-hide after all tasks complete
  const [showDock, setShowDock] = useState(true)

  const controlBarRef = useRef<HTMLDivElement>(null)
  const taskIdCounter = useRef(0)

  const categoryConfig = {
    image: {
      models: ['Flux Pro', 'DALL-E 3', 'Midjourney V6'],
      aspectRatios: ['1:1', '3:4', '4:3', '16:9', '9:16'] as AspectRatio[],
      resolutions: ['720p', '1080p', '2K'] as Resolution[],
      showDuration: false,
      credits: 50,
      buttonText: '生成',
      placeholder: '描述你想生成的图片内容，例如：一只穿着宇航服的猫咪漫步在月球表面...',
    },
    video: {
      models: ['Seedance 2.0', 'Vidu 2.0', 'Veo 3.0'],
      aspectRatios: ['3:4', '4:3', '16:9', '9:16'] as AspectRatio[],
      resolutions: ['480p', '720p', '1080p', '2K'] as Resolution[],
      showDuration: true,
      durationRange: { min: 4, max: 15, default: 10 },
      credits: 100,
      buttonText: '生成',
      placeholder: '描述你想生成的视频内容，例如：一片金色麦田在夕阳下随风摇曳...',
    },
  }

  useEffect(() => {
    const config = categoryConfig[category]
    setSelectedModel(config.models[0])
    setSelectedAspectRatio(config.aspectRatios[0])
    setSelectedResolution(config.resolutions[0])
    if (category === 'video') {
      setDuration(categoryConfig.video.durationRange.default)
    }
  }, [category])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (controlBarRef.current && !controlBarRef.current.contains(event.target as Node)) {
        setActivePopup(null)
      }
    }
    if (activePopup) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activePopup])

  // 示例文案库
  const exampleTexts = [
    '讯飞智作，企业级AI视频创作平台，专为营销场景而生。从脚本构思到专业成片，只需一键操作。强大的AI引擎理解您的需求，自动生成高质量视频内容。无论是产品宣传、品牌故事还是营销活动，讯飞智作都能帮您快速产出2K级专业视频。让每一帧都承载品牌价值，让每一个故事都触达人心。',
    '在数字化营销时代，讯飞智作为您打造视频生产闭环。从内容策划到视频渲染，全流程AI加持，大幅提升创作效率。我们的智能分镜系统能够精准理解您的创意，将文字描述转化为生动画面。配合强大的素材库和渲染引擎，让专业级视频制作变得触手可及。选择讯飞智作，让您的营销内容更出彩。',
    '讯飞智作革新企业视频创作方式，AI驱动的创作流程让视频制作不再复杂。只需输入您的创意文案，我们的智能系统自动完成分镜设计、画面生成、动效添加等全部工作。支持多种视频风格，适配各类营销场景。从产品介绍到品牌形象片，讯飞智作都能为您呈现专业品质。让AI成为您的创意伙伴。'
  ]

  // Mock history data
  const generateMockHistory = (count: number, offset: number): HistoryItem[] => {
    const prompts = [
      '赛博朋克风格的未来城市夜景',
      '水墨画风格的山水田园',
      '一只柴犬在樱花树下奔跑',
      '极简主义风格的产品展示',
      '星空下的露营帐篷',
      '蒸汽波风格的日落海滩',
      '微距摄影风花瓣上的露珠',
      '古风仙侠场景云海仙山',
      '3D渲染的几何抽象艺术',
      '电影级画质的雨中街道',
      '动漫风格的猫咪咖啡馆',
      '航拍视角的梯田日出',
    ]
    const aspects = ['1:1', '3:4', '4:3', '16:9', '9:16']
    return Array.from({ length: count }, (_, i) => {
      const idx = offset + i
      const isVideo = idx % 3 === 0
      return {
        id: `item-${idx}`,
        type: isVideo ? 'video' as const : 'image' as const,
        prompt: prompts[idx % prompts.length],
        thumbnail: `https://picsum.photos/seed/${idx + 100}/${isVideo ? '400/300' : aspects[idx % aspects.length] === '9:16' ? '300/500' : aspects[idx % aspects.length] === '16:9' ? '500/300' : '400/400'}`,
        aspectRatio: aspects[idx % aspects.length],
        timestamp: `${Math.floor(Math.random() * 24)}小时前`,
        status: 'completed' as const,
      }
    })
  }

  // Load initial history
  useEffect(() => {
    const timer = setTimeout(() => {
      setHistoryItems(generateMockHistory(12, 0))
      setIsLoadingHistory(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Load more history (infinite scroll)
  const loadMoreHistory = () => {
    if (!hasMoreHistory || isLoadingHistory) return
    setIsLoadingHistory(true)
    setTimeout(() => {
      const newItems = generateMockHistory(8, historyItems.length)
      setHistoryItems(prev => [...prev, ...newItems])
      setIsLoadingHistory(false)
      if (historyItems.length + 8 >= 40) setHasMoreHistory(false)
    }, 1000)
  }

  // "做同款" — 将推荐卡片的参考图和文本填入胶囊
  const handleMakeSimilar = (item: HistoryItem) => {
    setReferenceImage(item.thumbnail)
    setInputValue(item.prompt)
    if (item.type === 'video') setCategory('video')
    else setCategory('image')
    // 滚动到输入区域
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 自动选中"我的"第一个任务
  useEffect(() => {
    if (feedTab === 'mine' && !selectedWorkId && taskQueue.length > 0) {
      setSelectedWorkId(taskQueue[taskQueue.length - 1].id)
    }
  }, [feedTab, taskQueue.length])

  // 筛选推荐内容
  const filteredRecommend = searchQuery.trim()
    ? historyItems.filter(item => item.prompt.includes(searchQuery.trim()))
    : historyItems

  // 当前选中的作品
  const selectedWork = taskQueue.find(t => t.id === selectedWorkId) ?? null

  // ActionDock: 所有任务完成后 3s 自动隐藏
  useEffect(() => {
    if (taskQueue.length === 0) return
    const allDone = taskQueue.every(t => t.status === 'completed' || t.status === 'failed')
    if (allDone) {
      const timer = setTimeout(() => setShowDock(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setShowDock(true)
    }
  }, [taskQueue])

  // 点击示例按钮
  const handleExample = () => {
    const randomText = exampleTexts[Math.floor(Math.random() * exampleTexts.length)]
    setInputValue(randomText)
  }

  // 任务进度模拟
  const startNextTask = (taskId: string) => {
    setTaskQueue(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'generating' as TaskStatus } : t
    ))
    const interval = setInterval(() => {
      setTaskQueue(prev => {
        const task = prev.find(t => t.id === taskId)
        if (!task || task.status !== 'generating') {
          clearInterval(interval)
          return prev
        }
        const newProgress = Math.min(task.progress + Math.random() * 3 + 1, 100)
        const newEstimate = Math.max(0, Math.round(task.estimatedTime * (1 - newProgress / 100)))
        if (newProgress >= 100) {
          clearInterval(interval)
          return prev.map(t =>
            t.id === taskId ? { ...t, progress: 100, status: 'completed' as TaskStatus, estimatedTime: 0 } : t
          )
        }
        return prev.map(t =>
          t.id === taskId ? { ...t, progress: newProgress, estimatedTime: newEstimate } : t
        )
      })
    }, 300)
  }

  // 参数回溯 — 从 TaskItem
  const restoreTaskParams = (task: TaskItem) => {
    setCategory(task.type)
    setInputValue(task.prompt)
    setSelectedModel(task.model)
    setSelectedAspectRatio(task.aspectRatio)
    setSelectedResolution(task.resolution)
    if (task.duration) setDuration(task.duration)
  }

  // 点击生成按钮
  const handleGenerate = () => {
    if (!inputValue.trim()) return
    const taskId = `task-${++taskIdCounter.current}`
    const seed = Date.now()
    const isImage = category === 'image'
    const thumbnails = isImage
      ? [0, 1, 2, 3].map(i => `https://picsum.photos/seed/${seed + i}/400/400`)
      : [`https://picsum.photos/seed/${seed}/400/300`]
    const newTask: TaskItem = {
      id: taskId,
      type: category,
      status: 'queued',
      progress: 0,
      prompt: inputValue.trim(),
      thumbnail: thumbnails[0],
      thumbnails,
      model: selectedModel,
      aspectRatio: selectedAspectRatio,
      resolution: selectedResolution,
      duration: category === 'video' ? duration : undefined,
      estimatedTime: category === 'video' ? 30 : 15,
      createdAt: seed,
    }
    setTaskQueue(prev => [...prev, newTask])
    setInputValue('')
    setReferenceImage(null)
    setShowDock(true)
    // 自动切换到"我的"tab，选中新任务
    setFeedTab('mine')
    setSelectedWorkId(taskId)
    setTimeout(() => startNextTask(taskId), 500)
  }

  const handleDeleteTask = (taskId: string) => {
    setTaskQueue(prev => prev.filter(t => t.id !== taskId))
    if (selectedWorkId === taskId) setSelectedWorkId(null)
  }

  return (
    <>
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="shape-blob w-[500px] h-[500px] bg-purple-900/30 rounded-full top-[-10%] right-[-5%]"></div>
        <div className="shape-blob w-[600px] h-[600px] bg-blue-900/20 rounded-full bottom-[-10%] left-[-10%]"></div>
        <div className="absolute top-[20%] left-[10%] w-1 h-1 bg-white/20 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
        <div className="absolute top-[60%] right-[15%] w-1.5 h-1.5 bg-accent-cyan/30 rounded-full shadow-[0_0_15px_rgba(0,240,255,0.6)]"></div>
      </div>

      {/* Main Container */}
      <div className="relative flex min-h-screen w-full flex-col z-10">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/5 px-6 py-4 lg:px-20 bg-[#0B0C10]/60 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center rounded-xl text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-white/10">
                <span className="material-symbols-outlined fill-1" style={{ fontSize: '24px' }}>movie_filter</span>
              </div>
              <h2 className="text-lg font-semibold tracking-wide text-white/90">讯飞智作</h2>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <button onClick={() => navigate('/professional-edit')} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>movie_edit</span>
              专业剪辑
            </button>
          </div>
          <div className="flex items-center gap-5">
            <div id="tour-credits" className="flex items-center bg-white/5 px-4 py-1.5 rounded-full border border-white/5 shadow-inner cursor-pointer hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-sm mr-2 text-accent-cyan" style={{ fontVariationSettings: '"FILL" 1' }}>bolt</span>
              <span className="text-xs font-semibold text-slate-300 tracking-wide">算力: <span className="text-white">1280</span></span>
            </div>
            <div className="w-9 h-9 rounded-full ring-2 ring-white/10 p-0.5 cursor-pointer hover:ring-accent-cyan/50 transition-all">
              <img className="w-full h-full object-cover rounded-full" alt="User profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2U9MK9erwVfZa23HK-ysrpAKtDc4pfvDUVcPBRIYINFECFX4FGR6xYQX63GXfWyg_4czgJn6bl1foWrZnaEePTOhNlCL1Bu6Brh1tlFpbmAk4f6WxpNeRm0Vb47siUDmWn_xMwr4Nu7TzgN70eABzuA-l-0ZDJa_TxZB0sxDyg2zv5Q6HORVvuuqPF8yU8idodH7K1Dp1ghE-oR1w5ndiQtiWbEecfMzhG3d7ofK0GDBHtUNeyPlUbaIBgqDK30-jruLrygaZEaa3" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-24 lg:py-32 flex flex-col justify-center relative">
          {/* Title Section */}
          <div className="text-center mb-16 lg:mb-20 relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-cyan/5 blur-[100px] rounded-full pointer-events-none"></div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight flex items-center justify-center flex-wrap gap-x-3">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap">开启您的企业级</span>
              <TextType
                text={['高质量 AI 创作', '沉浸式视频生成', '智能内容生产']}
                typingSpeed={120}
                deletingSpeed={80}
                pauseDuration={3000}
                loop={true}
                className="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent text-glow whitespace-nowrap"
                cursorClassName="bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent"
              />
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide max-w-2xl mx-auto">从图片生成到视频创作，AI 驱动的一站式内容生产平台</p>
          </div>

          {/* Input Panel */}
          <div className="w-full relative group perspective-1000">
            <div className="absolute -left-4 top-10 w-2 h-20 bg-gradient-to-b from-transparent via-accent-cyan/20 to-transparent rounded-full blur-[1px]"></div>
            <div className="absolute -right-4 bottom-20 w-2 h-20 bg-gradient-to-b from-transparent via-accent-purple/20 to-transparent rounded-full blur-[1px]"></div>
            <div className="glass-panel-premium rounded-[2rem] p-1 shadow-2xl transition-all duration-500">
              <div className="bg-[#0B0C10]/40 rounded-[1.9rem] p-6 lg:p-10 backdrop-blur-sm">
                {/* Input Area */}
                <div className="input-glow-border min-h-[180px] p-5 mb-8 relative group/input">
                  <div className="absolute inset-0 overflow-hidden rounded-[1rem] pointer-events-none opacity-20">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-cyan to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]"></div>
                    <div className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-purple to-transparent translate-x-[100%] animate-[shimmer_3s_infinite_reverse]"></div>
                  </div>
                  <div className="flex gap-5 h-full">
                    {/* Reference Upload / Preview */}
                    {referenceImage ? (
                      <div className="flex-shrink-0 w-28 h-28 mt-1 rounded-xl overflow-hidden relative group/ref border border-accent-cyan/30">
                        <img src={referenceImage} alt="参考图" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/ref:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            onClick={() => setReferenceImage(null)}
                            className="w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
                            aria-label="移除参考图"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-accent-cyan/80 backdrop-blur-sm">参考图</div>
                      </div>
                    ) : (
                      <button className="flex-shrink-0 w-28 h-28 mt-1 rounded-xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-slate-500 hover:bg-white/10 hover:border-accent-cyan/40 hover:text-accent-cyan transition-all duration-300 group/upload" aria-label="上传参考图片">
                        <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center mb-2 group-hover/upload:scale-110 transition-transform">
                          <span className="material-symbols-outlined text-2xl" aria-hidden="true">add_photo_alternate</span>
                        </div>
                        <span className="text-[10px] font-medium tracking-wider uppercase">Reference</span>
                      </button>
                    )}

                    {/* Text Input */}
                    <div className="flex-1 h-full relative">
                      <div className="absolute top-0 right-0 z-20">
                        <button
                          onClick={handleExample}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-medium text-accent-cyan/80 transition-all hover:text-accent-cyan hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                        >
                          <span className="material-symbols-outlined text-sm" aria-hidden="true">lightbulb</span>
                          示例
                        </button>
                      </div>
                      <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full h-36 bg-transparent border-none p-1 focus:ring-0 resize-none text-lg text-slate-200 placeholder-slate-600 leading-relaxed font-light outline-none"
                        placeholder={categoryConfig[category].placeholder}
                        aria-label="视频内容描述"
                      />
                    </div>
                  </div>
                </div>

                {/* Capsule Control Bar */}
                <div ref={controlBarRef} id="tour-params-bar" className="flex flex-wrap items-center gap-3 pt-2">
                  {/* Left Zone: Category Capsules */}
                  <div id="tour-category-capsules" className="flex items-center bg-white/[0.03] rounded-xl border border-white/5 p-1">
                    <button
                      onClick={() => setCategory('image')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        category === 'image'
                          ? 'bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 text-white border border-white/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">image</span>
                      <span>图片生成</span>
                    </button>
                    <button
                      onClick={() => setCategory('video')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        category === 'video'
                          ? 'bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 text-white border border-white/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">videocam</span>
                      <span>视频生成</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

                  {/* Right Zone: Dynamic Parameter Capsules */}
                  <div className="flex flex-wrap items-center gap-2 flex-1">

                    {/* Aspect Ratio */}
                    <div className="relative z-[100]">
                      <button
                        onClick={() => setActivePopup(activePopup === 'ratio' ? null : 'ratio')}
                        className="btn-neon-border flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-medium tracking-wide group cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-accent-cyan transition-colors" aria-hidden="true">aspect_ratio</span>
                        <span className="group-hover:text-white transition-colors">{selectedAspectRatio}</span>
                        <span className="material-symbols-outlined text-slate-600 text-xs group-hover:text-accent-cyan transition-colors" aria-hidden="true">expand_more</span>
                      </button>
                      {activePopup === 'ratio' && (
                        <div className="absolute bottom-full left-0 mb-2 w-36 rounded-xl bg-[#1A1B23]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] animate-[popup-up_0.2s_ease-out]">
                          {categoryConfig[category].aspectRatios.map((ratio) => (
                            <button
                              key={ratio}
                              onClick={() => { setSelectedAspectRatio(ratio); setActivePopup(null) }}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                                selectedAspectRatio === ratio ? 'bg-accent-cyan/10 text-accent-cyan font-medium' : 'text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm" aria-hidden="true">{selectedAspectRatio === ratio ? 'check_circle' : 'circle'}</span>
                              <span>{ratio}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model */}
                    <div className="relative z-[100]">
                      <button
                        onClick={() => setActivePopup(activePopup === 'model' ? null : 'model')}
                        className="btn-neon-border flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-medium tracking-wide group cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-accent-cyan transition-colors" aria-hidden="true">deployed_code</span>
                        <span className="group-hover:text-white transition-colors">{selectedModel}</span>
                        <span className="material-symbols-outlined text-slate-600 text-xs group-hover:text-accent-cyan transition-colors" aria-hidden="true">expand_more</span>
                      </button>
                      {activePopup === 'model' && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-[#1A1B23]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] animate-[popup-up_0.2s_ease-out]">
                          {categoryConfig[category].models.map((model) => (
                            <button
                              key={model}
                              onClick={() => { setSelectedModel(model); setActivePopup(null) }}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                                selectedModel === model ? 'bg-accent-cyan/10 text-accent-cyan font-medium' : 'text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm" aria-hidden="true">{selectedModel === model ? 'check_circle' : 'circle'}</span>
                              <span>{model}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Resolution */}
                    <div className="relative z-[100]">
                      <button
                        onClick={() => setActivePopup(activePopup === 'resolution' ? null : 'resolution')}
                        className="btn-neon-border flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-medium tracking-wide group cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-accent-cyan transition-colors" aria-hidden="true">high_quality</span>
                        <span className="group-hover:text-white transition-colors">{selectedResolution}</span>
                        <span className="material-symbols-outlined text-slate-600 text-xs group-hover:text-accent-cyan transition-colors" aria-hidden="true">expand_more</span>
                      </button>
                      {activePopup === 'resolution' && (
                        <div className="absolute bottom-full left-0 mb-2 w-36 rounded-xl bg-[#1A1B23]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] animate-[popup-up_0.2s_ease-out]">
                          {categoryConfig[category].resolutions.map((res) => (
                            <button
                              key={res}
                              onClick={() => { setSelectedResolution(res as Resolution); setActivePopup(null) }}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                                selectedResolution === res ? 'bg-accent-cyan/10 text-accent-cyan font-medium' : 'text-white hover:bg-white/5'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm" aria-hidden="true">{selectedResolution === res ? 'check_circle' : 'circle'}</span>
                              <span>{res}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Duration - only for video */}
                    {category === 'video' && (
                      <div className="relative z-[100]">
                        <button
                          onClick={() => setActivePopup(activePopup === 'duration' ? null : 'duration')}
                          className="btn-neon-border flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-300 text-xs font-medium tracking-wide group cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-slate-400 text-base group-hover:text-accent-cyan transition-colors" aria-hidden="true">schedule</span>
                          <span className="group-hover:text-white transition-colors">{duration}s</span>
                          <span className="material-symbols-outlined text-slate-600 text-xs group-hover:text-accent-cyan transition-colors" aria-hidden="true">expand_more</span>
                        </button>
                        {activePopup === 'duration' && (
                          <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-[#1A1B23]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden z-[9999] p-4 animate-[popup-up_0.2s_ease-out]">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-slate-400 font-medium">视频时长</span>
                              <span className="text-sm text-accent-cyan font-bold">{duration}s</span>
                            </div>
                            <input
                              type="range"
                              min={categoryConfig.video.durationRange.min}
                              max={categoryConfig.video.durationRange.max}
                              value={duration}
                              onChange={(e) => setDuration(Number(e.target.value))}
                              aria-label="视频时长"
                              className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-cyan
                                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)] [&::-webkit-slider-thumb]:cursor-pointer
                                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-accent-cyan [&::-moz-range-thumb]:border-0
                                [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(0,240,255,0.5)]"
                              style={{
                                background: `linear-gradient(to right, #00f0ff 0%, #00f0ff ${((duration - categoryConfig.video.durationRange.min) / (categoryConfig.video.durationRange.max - categoryConfig.video.durationRange.min)) * 100}%, rgba(255,255,255,0.1) ${((duration - categoryConfig.video.durationRange.min) / (categoryConfig.video.durationRange.max - categoryConfig.video.durationRange.min)) * 100}%, rgba(255,255,255,0.1) 100%)`
                              }}
                            />
                            <div className="flex justify-between mt-2">
                              <span className="text-[10px] text-slate-500">{categoryConfig.video.durationRange.min}s</span>
                              <span className="text-[10px] text-slate-500">{categoryConfig.video.durationRange.max}s</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Generate Button Section */}
                  <div className="flex items-center gap-3 ml-auto pl-4 border-l border-white/5">
                    <div className="text-slate-400 font-medium text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                      <span className="material-symbols-outlined text-sm text-accent-purple animate-pulse" style={{ fontVariationSettings: '"FILL" 1' }} aria-hidden="true">stars</span>
                      <span className="bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent font-bold">{categoryConfig[category].credits}</span>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="btn-primary-gradient px-6 h-12 rounded-xl text-black flex items-center justify-center transform active:scale-95 font-bold tracking-wide text-white min-w-[120px]"
                    >
                      <span>{categoryConfig[category].buttonText}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ History Feed Area ═══ */}
          <div className="mt-12 w-full">
            {/* Tab Header */}
            <div className="flex items-center justify-between mb-6">
              {/* Left: Tabs */}
              <div className="flex items-center" role="tablist" aria-label="内容类型切换">
                <button
                  role="tab"
                  aria-selected={feedTab === 'recommend'}
                  onClick={() => setFeedTab('recommend')}
                  className={`relative px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                    feedTab === 'recommend' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  推荐
                  {feedTab === 'recommend' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple" />
                  )}
                </button>
                <button
                  id="tour-my-tab"
                  role="tab"
                  aria-selected={feedTab === 'mine'}
                  onClick={() => setFeedTab('mine')}
                  className={`relative px-5 py-2 text-sm font-medium transition-colors duration-200 ${
                    feedTab === 'mine' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  我的
                  {feedTab === 'mine' && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple" />
                  )}
                  {taskQueue.some(t => t.status === 'generating' || t.status === 'queued') && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                  )}
                </button>
              </div>
              {/* Right: Search */}
              <div className="flex items-center gap-2">
                {showSearch && (
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索作品…"
                    autoFocus
                    className="w-48 h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-accent-cyan/40 transition-colors"
                    aria-label="搜索作品"
                  />
                )}
                <button
                  onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery('') }}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors"
                  aria-label="搜索"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{showSearch ? 'close' : 'search'}</span>
                </button>
              </div>
            </div>

            {/* ── Tab: 推荐 ── */}
            {feedTab === 'recommend' && (
              <>
                {!isLoadingHistory && filteredRecommend.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">explore</span>
                    <p className="text-slate-500 text-sm font-light">{searchQuery ? '未找到匹配内容' : '暂无推荐内容'}</p>
                    <p className="text-slate-600 text-xs mt-1">探索更多创意灵感</p>
                  </div>
                ) : (
                  <>
                    <div className="waterfall-grid">
                      {filteredRecommend.map((item) => (
                        <div
                          key={item.id}
                          className="history-card rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] cursor-pointer group"
                          onClick={() => setLightboxItem(item)}
                        >
                          <div className="relative overflow-hidden">
                            <img
                              src={item.thumbnail}
                              alt={item.prompt}
                              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border border-white/10"
                              style={{ background: item.type === 'video' ? 'rgba(112,0,255,0.6)' : 'rgba(0,240,255,0.4)' }}>
                              <span className="flex items-center gap-1 text-white">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{item.type === 'video' ? 'videocam' : 'image'}</span>
                                {item.type === 'video' ? '视频' : '图片'}
                              </span>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMakeSimilar(item) }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-accent-cyan/20 hover:border-accent-cyan/40 transition-all duration-200"
                                aria-label="使用此作品做同款"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                                做同款
                              </button>
                            </div>
                            {item.type === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.prompt}</p>
                            <p className="text-[10px] text-slate-600 mt-2">{item.timestamp}</p>
                          </div>
                        </div>
                      ))}
                      {isLoadingHistory && Array.from({ length: 4 }, (_, i) => (
                        <div key={`skeleton-${i}`} className="skeleton-card rounded-xl overflow-hidden border border-white/5 bg-white/[0.03]">
                          <div className="bg-white/[0.05]" style={{ height: `${150 + (i % 3) * 50}px` }}></div>
                          <div className="p-3 space-y-2">
                            <div className="h-3 bg-white/[0.05] rounded w-full"></div>
                            <div className="h-3 bg-white/[0.05] rounded w-2/3"></div>
                            <div className="h-2 bg-white/[0.05] rounded w-1/4 mt-3"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {hasMoreHistory && !isLoadingHistory && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={loadMoreHistory}
                          className="px-6 py-2 rounded-full text-xs text-slate-400 bg-white/5 border border-white/5 hover:bg-white/10 hover:text-slate-300 transition-all"
                        >
                          加载更多
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── Tab: 我的 ── */}
            {feedTab === 'mine' && (
              <>
                {taskQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-700 mb-4">palette</span>
                    <p className="text-slate-500 text-sm font-light">还没有作品</p>
                    <p className="text-slate-600 text-xs mt-1">在上方输入描述开始创作</p>
                  </div>
                ) : (
                  <div className="flex gap-5 min-h-[420px]" style={{ animation: 'card-appear 0.3s ease-out' }}>
                    {/* Left: Navigation List */}
                    <div className="w-56 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto no-scrollbar pr-2" style={{ maxHeight: '600px' }}>
                      {[...taskQueue].reverse().map((task) => (
                        <button
                          key={task.id}
                          onClick={() => setSelectedWorkId(task.id)}
                          className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                            selectedWorkId === task.id
                              ? 'bg-white/[0.08] border border-accent-cyan/20 shadow-[0_0_12px_rgba(0,240,255,0.08)]'
                              : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/5'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative">
                            {(task.status === 'generating' || task.status === 'queued') ? (
                              <div className="w-full h-full bg-white/[0.05] flex items-center justify-center skeleton-card">
                                <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                                  <circle cx="12" cy="12" r="10" fill="none" stroke="#00f0ff" strokeWidth="2"
                                    strokeDasharray={`${2 * Math.PI * 10}`}
                                    strokeDashoffset={`${2 * Math.PI * 10 * (1 - task.progress / 100)}`}
                                    strokeLinecap="round" />
                                </svg>
                              </div>
                            ) : (
                              <img src={task.thumbnail} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-slate-300 line-clamp-1 leading-snug">{task.prompt}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] flex items-center gap-0.5 ${
                                task.status === 'completed' ? 'text-green-400/70' :
                                task.status === 'generating' ? 'text-accent-cyan/70' :
                                task.status === 'failed' ? 'text-red-400/70' : 'text-slate-600'
                              }`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '10px', fontVariationSettings: '"FILL" 1' }}>
                                  {task.status === 'completed' ? 'check_circle' : task.status === 'generating' ? 'progress_activity' : task.status === 'failed' ? 'error' : 'hourglass_top'}
                                </span>
                                {task.status === 'completed' ? '已完成' : task.status === 'generating' ? `${Math.round(task.progress)}%` : task.status === 'failed' ? '失败' : '排队中'}
                              </span>
                              <span className="text-[10px] text-slate-600">{task.type === 'video' ? '视频' : '图片'}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Right: Scrollable content area — sorted by createdAt desc */}
                    <div className="flex-1 overflow-y-auto no-scrollbar" style={{ maxHeight: '600px' }}>
                      <div className="flex flex-col gap-5">
                        {[...taskQueue].sort((a, b) => b.createdAt - a.createdAt).map(task => {
                          const isGenerating = task.status === 'generating' || task.status === 'queued'

                          // ── 生成中状态 ──
                          if (isGenerating) {
                            return (
                              <div key={task.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 skeleton-card">
                                <div className="flex items-center gap-4">
                                  <svg className="w-12 h-12 -rotate-90 flex-shrink-0" viewBox="0 0 48 48">
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                                    <circle cx="24" cy="24" r="20" fill="none" stroke="#00f0ff" strokeWidth="3"
                                      strokeDasharray={`${2 * Math.PI * 20}`}
                                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - task.progress / 100)}`}
                                      strokeLinecap="round" />
                                  </svg>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-300 line-clamp-1">{task.prompt}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <span className="text-[10px] text-accent-cyan">{Math.round(task.progress)}%</span>
                                      <span className="text-[10px] text-slate-600">{task.type === 'video' ? '视频' : '图片'} · {task.model} · {task.aspectRatio}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-600">
                                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                                  提交于 {formatSubmitTime(task.createdAt)}
                                </div>
                              </div>
                            )
                          }

                          // ── 图片作品：4张一行 ──
                          if (task.type === 'image' && task.status === 'completed') {
                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedWorkId(task.id)}
                                className={`relative group/card rounded-xl border p-4 cursor-pointer transition-all ${
                                  selectedWorkId === task.id ? 'border-accent-cyan/30 bg-white/[0.04] shadow-[0_0_12px_rgba(0,240,255,0.08)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.03]'
                                }`}
                              >
                                {/* 前往专业剪辑 hover 按钮 */}
                                <div className="absolute top-3 right-3 z-10 flex items-center overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/professional-edit') }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>movie_edit</span>
                                    前往专业剪辑
                                  </button>
                                </div>
                                {/* 4 images in a row */}
                                <div className="grid grid-cols-4 gap-2" onMouseLeave={() => setHoveredImageKey(null)}>
                                  {task.thumbnails.map((thumb, i) => {
                                    const key = `${task.id}-${i}`
                                    const isHovered = hoveredImageKey === key
                                    return (
                                      <div
                                        key={i}
                                        className="relative rounded-lg overflow-hidden border border-white/5 cursor-pointer"
                                        onMouseEnter={() => setHoveredImageKey(key)}
                                        onMouseLeave={() => setHoveredImageKey(null)}
                                        onClick={(e) => { e.stopPropagation(); setImagePreview({ url: thumb, prompt: task.prompt }) }}
                                      >
                                        <img
                                          src={thumb}
                                          alt={`${task.prompt} #${i + 1}`}
                                          className={`w-full aspect-square object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
                                          loading="lazy"
                                        />
                                        {isHovered && (
                                          <>
                                            {/* Top-right: bookmark */}
                                            <div className="absolute top-1 right-1">
                                              <button
                                                onClick={(e) => { e.stopPropagation(); addMaterial({ type: 'image', url: thumb, prompt: task.prompt, ratio: task.aspectRatio, model: task.model, source: 'studio' }) }}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 backdrop-blur-sm hover:bg-accent-purple/70 transition-colors"
                                                aria-label="收藏至我的素材"
                                              >
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>bookmark_add</span>
                                              </button>
                                            </div>
                                            {/* Bottom-right: download */}
                                            <div className="absolute bottom-1 right-1">
                                              <button
                                                onClick={(e) => { e.stopPropagation() }}
                                                className="w-6 h-6 flex items-center justify-center rounded-md bg-black/60 backdrop-blur-sm hover:bg-accent-cyan/70 transition-colors"
                                                aria-label="下载"
                                              >
                                                <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>download</span>
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                                {/* Prompt */}
                                <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">{task.prompt}</p>
                                {/* Parameters + submit time */}
                                <div className="flex items-center flex-wrap gap-1.5 mt-2">
                                  <span className="px-2 py-0.5 rounded-full bg-accent-cyan/10 text-[10px] text-accent-cyan/80 border border-accent-cyan/10">图片</span>
                                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.model}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.aspectRatio}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.resolution}</span>
                                  <span className="ml-auto text-[10px] text-slate-600 flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                                    {formatSubmitTime(task.createdAt)}
                                  </span>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); restoreTaskParams(task) }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>edit</span>
                                    重新编辑
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const taskId = `task-${++taskIdCounter.current}`
                                      const seed = Date.now()
                                      const thumbs = [0,1,2,3].map(i => `https://picsum.photos/seed/${seed + i}/400/400`)
                                      const newTask: TaskItem = {
                                        id: taskId, type: 'image', status: 'queued', progress: 0,
                                        prompt: task.prompt, thumbnail: thumbs[0], thumbnails: thumbs,
                                        model: task.model, aspectRatio: task.aspectRatio, resolution: task.resolution,
                                        estimatedTime: 15, createdAt: seed,
                                      }
                                      setTaskQueue(prev => [...prev, newTask])
                                      setShowDock(true)
                                      setSelectedWorkId(taskId)
                                      setTimeout(() => startNextTask(taskId), 500)
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>refresh</span>
                                    再次生成
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ml-auto"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>delete</span>
                                    删除
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          // ── 视频作品：1列横向 ──
                          if (task.type === 'video' && task.status === 'completed') {
                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedWorkId(task.id)}
                                className={`relative group/card rounded-xl border overflow-hidden cursor-pointer transition-all group ${
                                  selectedWorkId === task.id ? 'border-accent-cyan/30 bg-white/[0.04] shadow-[0_0_12px_rgba(0,240,255,0.08)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.03]'
                                }`}
                              >
                                {/* 前往专业剪辑 hover 按钮 */}
                                <div className="absolute top-3 right-3 z-10 flex items-center overflow-hidden rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); navigate('/professional-edit') }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-slate-300 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>movie_edit</span>
                                    前往专业剪辑
                                  </button>
                                </div>
                                <div className="flex">
                                  <div className="relative overflow-hidden w-72 flex-shrink-0">
                                    <img src={task.thumbnail} alt={task.prompt} className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">{task.prompt}</p>
                                      <div className="flex items-center flex-wrap gap-1.5 mt-3">
                                        <span className="px-2 py-0.5 rounded-full bg-accent-purple/10 text-[10px] text-accent-purple/80 border border-accent-purple/10">视频</span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.model}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.aspectRatio}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.resolution}</span>
                                        {task.duration && (
                                          <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-500 border border-white/5">{task.duration}s</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-600">
                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                                        提交于 {formatSubmitTime(task.createdAt)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-3">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); restoreTaskParams(task) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
                                        重新编辑
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const taskId = `task-${++taskIdCounter.current}`
                                          const seed = Date.now()
                                          const thumbs = [`https://picsum.photos/seed/${seed}/400/300`]
                                          const newTask: TaskItem = {
                                            id: taskId, type: 'video', status: 'queued', progress: 0,
                                            prompt: task.prompt, thumbnail: thumbs[0], thumbnails: thumbs,
                                            model: task.model, aspectRatio: task.aspectRatio, resolution: task.resolution,
                                            duration: task.duration, estimatedTime: 30, createdAt: seed,
                                          }
                                          setTaskQueue(prev => [...prev, newTask])
                                          setShowDock(true)
                                          setSelectedWorkId(taskId)
                                          setTimeout(() => startNextTask(taskId), 500)
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-accent-cyan/10 hover:text-accent-cyan transition-all"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
                                        再次生成
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); addMaterial({ type: 'video', url: '', prompt: task.prompt, ratio: task.aspectRatio, model: task.model, duration: task.duration, source: 'studio' }) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-accent-purple/10 hover:text-accent-purple transition-all"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bookmark_add</span>
                                        收藏至素材
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ml-auto"
                                      >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          }

                          // ── 失败任务 ──
                          if (task.status === 'failed') {
                            return (
                              <div key={task.id} className="rounded-xl border border-red-500/10 bg-white/[0.02] p-4">
                                <div className="flex items-center gap-3">
                                  <span className="material-symbols-outlined text-2xl text-red-400/60">error_outline</span>
                                  <div className="flex-1">
                                    <p className="text-xs text-slate-300 line-clamp-1">{task.prompt}</p>
                                    <p className="text-[10px] text-red-400/60 mt-1">生成失败</p>
                                  </div>
                                  <span className="text-[10px] text-slate-600">{formatSubmitTime(task.createdAt)}</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
                                    aria-label="删除"
                                  >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return null
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

      </div>

      {/* ═══ Lightbox / Video Modal ═══ */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxItem(null)}
          role="dialog"
          aria-label={lightboxItem.type === 'video' ? '视频播放' : '查看大图'}
          style={{ animation: 'lightbox-fade-in 0.2s ease-out' }}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxItem(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors z-10"
              aria-label="关闭"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>

            {lightboxItem.type === 'video' ? (
              /* Video player */
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video flex flex-col">
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-accent-purple/10 to-accent-cyan/10 relative">
                  <img src={lightboxItem.thumbnail} alt="" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/20 transition-colors">
                      <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#0D0E14]/90">
                  <p className="text-sm text-slate-300 line-clamp-2">{lightboxItem.prompt}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => { handleMakeSimilar(lightboxItem); setLightboxItem(null) }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/20 text-xs font-medium text-white hover:from-accent-cyan/30 hover:to-accent-purple/30 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                      做同款
                    </button>
                    <span className="text-[10px] text-slate-600">{lightboxItem.aspectRatio} · {lightboxItem.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Image lightbox */
              <div className="rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={lightboxItem.thumbnail}
                  alt={lightboxItem.prompt}
                  className="w-full max-h-[70vh] object-contain bg-black/40"
                />
                <div className="p-4 bg-[#0D0E14]/90">
                  <p className="text-sm text-slate-300 line-clamp-2">{lightboxItem.prompt}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => { handleMakeSimilar(lightboxItem); setLightboxItem(null) }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/20 text-xs font-medium text-white hover:from-accent-cyan/30 hover:to-accent-purple/30 transition-all"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
                      做同款
                    </button>
                    <span className="text-[10px] text-slate-600">{lightboxItem.aspectRatio} · {lightboxItem.timestamp}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Single-image preview lightbox */}
      {imagePreview && (
        <div
          className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setImagePreview(null)}
          role="dialog"
          aria-label="查看大图"
          style={{ animation: 'lightbox-fade-in 0.2s ease-out' }}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-colors z-10"
              aria-label="关闭"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
            </button>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <img
                src={imagePreview.url}
                alt={imagePreview.prompt}
                className="w-full max-h-[70vh] object-contain bg-black/40"
              />
              <div className="p-4 bg-[#0D0E14]/90">
                <p className="text-sm text-slate-300 line-clamp-2">{imagePreview.prompt}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ActionDock - Floating Bottom Bar */}
      {taskQueue.length > 0 && showDock && (
        <div className="action-dock flex items-center gap-3" style={{ animation: 'dock-slide-up 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
          {/* Task Status Area — 横向滚动 */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" style={{ maxWidth: '360px' }}>
            {taskQueue.map((task) => (
              <div
                key={task.id}
                className="relative cursor-pointer flex-shrink-0"
                onMouseEnter={() => setHoveredTaskId(task.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
                onClick={() => restoreTaskParams(task)}
              >
                {/* Task Mini Icon with Ring Progress */}
                <div className={`w-10 h-10 rounded-xl overflow-hidden relative border ${
                  task.status === 'generating' ? 'border-accent-cyan/50' :
                  task.status === 'completed' ? 'border-green-500/50' :
                  task.status === 'failed' ? 'border-red-500/50' :
                  'border-white/10'
                }`}
                  style={{
                    animation: task.status === 'generating' ? 'task-breathe 2s ease-in-out infinite' :
                               task.status === 'completed' ? 'task-complete-flash 0.6s ease-out' : 'task-slide-in 0.3s ease-out',
                  }}
                >
                  <img src={task.thumbnail} alt="" className="w-full h-full object-cover" />
                  {/* Progress overlay */}
                  {task.status === 'generating' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                        <circle cx="12" cy="12" r="10" fill="none" stroke="#00f0ff" strokeWidth="2"
                          className="task-ring"
                          strokeDasharray={`${2 * Math.PI * 10}`}
                          strokeDashoffset={`${2 * Math.PI * 10 * (1 - task.progress / 100)}`}
                          strokeLinecap="round" />
                      </svg>
                    </div>
                  )}
                  {/* Status icons */}
                  {task.status === 'completed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="material-symbols-outlined text-green-400 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                    </div>
                  )}
                  {task.status === 'failed' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="material-symbols-outlined text-red-400 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                    </div>
                  )}
                  {task.status === 'queued' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="material-symbols-outlined text-slate-400 text-xs animate-pulse">hourglass_top</span>
                    </div>
                  )}
                </div>

                {/* Hover Popover */}
                {hoveredTaskId === task.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-xl bg-[#1A1B23]/95 backdrop-blur-xl border border-white/10 shadow-2xl p-4 z-[9999] animate-[popup-up_0.15s_ease-out]">
                    {/* Arrow */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1A1B23]/95 border-r border-b border-white/10 rotate-45"></div>
                    {/* Task name */}
                    <p className="text-xs text-white font-medium line-clamp-2 mb-2">{task.prompt}</p>
                    {/* Parameters */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 border border-white/5">
                        {task.type === 'video' ? '视频' : '图片'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 border border-white/5">
                        {task.aspectRatio}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 border border-white/5">
                        {task.model}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 border border-white/5">
                        {task.resolution}
                      </span>
                      {task.duration && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-slate-400 border border-white/5">
                          {task.duration}s
                        </span>
                      )}
                    </div>
                    {/* Progress */}
                    {task.status === 'generating' && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-accent-cyan">{Math.round(task.progress)}%</span>
                          <span className="text-slate-500">预计 {task.estimatedTime}s</span>
                        </div>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full transition-all duration-300"
                            style={{ width: `${task.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <p className="text-[10px] text-green-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                        已完成 · 点击回溯参数
                      </p>
                    )}
                    {task.status === 'queued' && (
                      <p className="text-[10px] text-slate-500">排队中...</p>
                    )}
                    {task.status === 'failed' && (
                      <p className="text-[10px] text-red-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">error</span>
                        生成失败
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="h-8 w-[1px] bg-white/10"></div>

          {/* Quick info */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="material-symbols-outlined text-sm text-accent-cyan/60">task_alt</span>
            <span>{taskQueue.filter(t => t.status === 'completed').length}/{taskQueue.length} 完成</span>
          </div>
        </div>
      )}

    </>
  )
}

export default App
