import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from './useTheme'
import { lipsyncTargetLanguageList as LANGS } from './lipsyncLanguages'

import type { Theme } from './useTheme'

type LipSyncStage = 'idle' | 'uploading' | 'parsing' | 'editing'
type ActiveTab = 'more' | 'mine'

interface LipSyncTask {
  id: string
  name: string
  status: 'processing' | 'success' | 'failed' | 'draft' | 'bg-parsing'
  progress: number
  targetLanguage: string
  duration: string
  createdAt: number
  savedSegments?: typeof SEGMENTS
}

const CARDS = [
  { img: '/vcard-1.png', lang: 'EN', cat: '短剧', title: '霸道总裁一张嘴，蜡笔小新跑断腿' },
  { img: '/vcard-2.png', lang: 'JA', cat: '个人演讲', title: '乔布斯 2005 Stanford 演讲日语版' },
  { img: '/vcard-3.png', lang: 'KO', cat: '广告营销', title: '某品牌护肤品 TVC 韩语对口型' },
  { img: '/vcard-4.png', lang: 'EN', cat: '品牌营销', title: '歌剧魅影男主唱海绵宝宝' },
  { img: '/vcard-5.png', lang: 'RU', cat: '教育培训', title: '物理公开课——牛顿第三定律' },
  { img: '/vcard-6.png', lang: 'ES', cat: '短剧', title: '漫威经典对白西班牙语重制版' },
]

const SEGMENTS = [
  { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: 'Sometimes you have to let go of the picture you had in mind, and see the beauty in the story you\'re living.', hl: 'Sometimes' },
  { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: 'You know, every great story begins with a single brave decision. That\'s what brought us here today.', hl: 'every great story' },
]

/** 落地页 Mock：切换目标语言后「翻译」结果（结构对齐 SEGMENTS，正式环境走翻译 API） */
const SEGMENTS_FOR_LANG: Record<string, typeof SEGMENTS> = {
  '中文 · ZH': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: '有时你必须放下心中预设的那幅画，才能看见你所经历的故事里藏着的美。', hl: '有时' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: '要知道，每个伟大的故事都始于一次勇敢的决定。正是它把我们带到了今天。', hl: '每个伟大' },
  ],
  '英语 · EN': SEGMENTS,
  '日语 · JA': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: 'ときには、頭に描いていた絵を手放して、目の前の物語の美しさに気づく必要があります。', hl: 'ときには' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: 'すごい物語は、たった一つの勇気ある決断から始まる。今日ここにいるのもそのおかげだ。', hl: 'すごい物語' },
  ],
  '韩语 · KO': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: '때로는 머릿속에 그려 둔 그림을 내려놓아야 살아가는 이야기의 아름다움을 볼 수 있어요.', hl: '때로는' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: '위대한 이야기는 모두 단 하나의 용기 있는 선택에서 시작돼요. 오늘 우리가 여기 있는 것도 그래서예요.', hl: '위대한' },
  ],
  '俄语 · RU': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: 'Иногда нужно отпустить картину, которую вы держали в голове, и увидеть красоту истории, в которой вы живёте.', hl: 'Иногда' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: 'Знаете, великая история начинается с одного смелого решения. Именно оно привело нас сюда сегодня.', hl: 'великая история' },
  ],
  '阿拉伯语 · AR': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: 'أحيانًا عليك أن تترك الصورة التي رسمتها في ذهنك لترى جمال القصة التي تعيشها.', hl: 'أحيانًا' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: 'كل قصة عظيمة تبدأ بقرار شجاع واحد. هذا ما جاء بنا إلى هنا اليوم.', hl: 'قصة' },
  ],
  '西班牙语 · ES': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: 'A veces tienes que soltar la imagen que tenías en mente y ver la belleza de la historia que estás viviendo.', hl: 'A veces' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: 'Toda gran historia empieza con una sola decisión valiente. Eso es lo que nos trajo hasta hoy.', hl: 'gran historia' },
  ],
  '粤语 · YUE': [
    { id: 1, speaker: 'Speaker 1', range: '00:00—00:12', text: '有時你要放低个脑入面幅相先至睇到你经历紧个故事有几靓。', hl: '有時' },
    { id: 2, speaker: 'Speaker 2', range: '00:15—00:45', text: '每个劲故事都系由一个勇敢决定开始嘅，我哋今日坐喺度都系咁样。', hl: '劲故事' },
  ],
}

const MINE_MOCK: LipSyncTask[] = [
  { id: 'm1', name: '黑色星期四.avi', status: 'processing', progress: 42, targetLanguage: '英文', duration: '1m14s', createdAt: Date.now() - 60000 * 5 },
  { id: 'm2', name: 'product_ad.mp4', status: 'success', progress: 100, targetLanguage: '日语', duration: '0m58s', createdAt: Date.now() - 60000 * 60 },
  { id: 'm3', name: 'keynote_clip.mov', status: 'failed', progress: 0, targetLanguage: '韩语', duration: '2m03s', createdAt: Date.now() - 60000 * 120 },
  { id: 'm4', name: 'brand_video.mp4', status: 'draft', progress: 0, targetLanguage: '英语', duration: '2m10s', createdAt: Date.now() - 60000 * 200, savedSegments: SEGMENTS },
]

export default function LipSyncPage() {
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()
  const [stage, setStage] = useState<LipSyncStage>('idle')
  const [activeTab, setActiveTab] = useState<ActiveTab>('more')
  const [tasks, setTasks] = useState<LipSyncTask[]>(MINE_MOCK)
  const [showZtkModal, setShowZtkModal] = useState(false)
  const [compareCard, setCompareCard] = useState<typeof CARDS[0] | null>(null)
  const [showSubmitBanner, setShowSubmitBanner] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [parseProgress, setParseProgress] = useState(0)
  // typewriter: how many chars of each segment text are revealed
  const [twRevealed, setTwRevealed] = useState<number[]>([])
  const [selectedLang, setSelectedLang] = useState('英语 · EN')
  const [langTranslating, setLangTranslating] = useState(false)
  const langTransTimerRef = useRef<number | null>(null)
  const [segments, setSegments] = useState(SEGMENTS)
  const [segHistory, setSegHistory] = useState<typeof SEGMENTS[]>([SEGMENTS])
  const [segHistIdx, setSegHistIdx] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('上传视频.mp4')
  const [durationWarning, setDurationWarning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasExceededLimit, setHasExceededLimit] = useState(false)
  const [warningMessage, setWarningMessage] = useState('')

  // ── 阈值配置 ──
  const MAX_SEGMENT_LENGTH = 200
  const MAX_TOTAL_LENGTH = 2000

  // ── 检测字数限制 ──
  const checkLimits = (segs: typeof SEGMENTS) => {
    const totalLength = segs.reduce((sum, s) => sum + s.text.length, 0)
    const longSegment = segs.find(s => s.text.length > MAX_SEGMENT_LENGTH)

    if (totalLength > MAX_TOTAL_LENGTH) {
      setHasExceededLimit(true)
      setWarningMessage(`总字数 ${totalLength} 超出限制 ${MAX_TOTAL_LENGTH}，请精简内容`)
      return false
    }
    if (longSegment) {
      setHasExceededLimit(true)
      setWarningMessage('')
      return false
    }

    setHasExceededLimit(false)
    setWarningMessage('')
    return true
  }

  // ── uploading: progress bar ──
  useEffect(() => {
    if (stage !== 'uploading') return
    setUploadProgress(0)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 8 + 4
      if (p >= 100) {
        clearInterval(iv)
        setUploadProgress(100)
        setTimeout(() => { setStage('parsing'); setParseProgress(0); setTwRevealed([]) }, 300)
      } else {
        setUploadProgress(p)
      }
    }, 120)
    return () => clearInterval(iv)
  }, [stage])

  // ── parsing: typewriter per segment ──
  useEffect(() => {
    if (stage !== 'parsing') return
    // Phase 1: parse progress bar 0→100 (2s)
    let p = 0
    const parseIv = setInterval(() => {
      p += Math.random() * 6 + 3
      if (p >= 100) { clearInterval(parseIv); setParseProgress(100) }
      else setParseProgress(p)
    }, 120)

    // Phase 2: typewriter segments start after 1s
    const segs = SEGMENTS
    const totalChars = segs.reduce((a, s) => a + s.text.length, 0)
    const msPerChar = 2800 / totalChars // spread over ~2.8s
    let segIdx = 0
    let charIdx = 0
    const revealed = segs.map(() => 0)

    const startTw = setTimeout(() => {
      const twIv = setInterval(() => {
        if (segIdx >= segs.length) { clearInterval(twIv); return }
        charIdx++
        revealed[segIdx] = charIdx
        setTwRevealed([...revealed])
        if (charIdx >= segs[segIdx].text.length) {
          segIdx++
          charIdx = 0
          if (segIdx >= segs.length) { clearInterval(twIv); setTimeout(() => setStage('editing'), 500) }
        }
      }, msPerChar)
      return () => clearInterval(twIv)
    }, 1000)

    return () => { clearInterval(parseIv); clearTimeout(startTw) }
  }, [stage])

  // ── task progress simulation ──
  useEffect(() => {
    const iv = setInterval(() => {
      setTasks(prev => prev.map(t => {
        if (t.status === 'processing' && t.progress < 100) {
          const np = Math.min(t.progress + Math.random() * 3, 100)
          return { ...t, progress: np, status: np >= 100 ? 'success' : 'processing' }
        }
        if (t.status === 'bg-parsing' && t.progress < 100) {
          const np = Math.min(t.progress + Math.random() * 4 + 1, 100)
          return { ...t, progress: np, status: np >= 100 ? 'draft' : 'bg-parsing', savedSegments: np >= 100 ? SEGMENTS : undefined }
        }
        return t
      }))
    }, 800)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => () => {
    if (langTransTimerRef.current != null) window.clearTimeout(langTransTimerRef.current)
  }, [])

  const handleUpload = (name?: string) => {
    const fname = name || '上传视频.mp4'
    // mock: .avi or filenames > 5min duration trigger warning
    const mockLong = fname.endsWith('.avi') || fname.toLowerCase().includes('long')
    if (mockLong) { setUploadedFileName(fname); setDurationWarning(true); return }
    setDurationWarning(false)
    setUploadedFileName(fname)
    setStage('uploading')
  }

  // parsing buttons
  const handleCancelParsing = () => { setStage('idle') }
  const handleBgParsing = () => {
    setTasks(prev => [{ id: Date.now().toString(), name: uploadedFileName, status: 'bg-parsing', progress: 0, targetLanguage: selectedLang.split(' · ')[0], duration: '–', createdAt: Date.now() }, ...prev])
    setStage('idle')
    setActiveTab('mine')
  }

  // editing buttons
  const handleCancelEdit = () => { setStage('idle') }
  const handleSaveDraft = () => {
    setTasks(prev => [{ id: Date.now().toString(), name: uploadedFileName, status: 'draft', progress: 0, targetLanguage: selectedLang.split(' · ')[0], duration: '1m20s', createdAt: Date.now(), savedSegments: segments }, ...prev])
    setStage('idle')
    setActiveTab('mine')
  }
  const handleGenerateVideo = () => {
    setTasks(prev => [{ id: Date.now().toString(), name: uploadedFileName, status: 'processing', progress: 0, targetLanguage: selectedLang.split(' · ')[0], duration: '1m20s', createdAt: Date.now() }, ...prev])
    setStage('idle')
    setActiveTab('mine')
    setShowSubmitBanner(true)
    setTimeout(() => setShowSubmitBanner(false), 4000)
  }

  // resume draft
  const handleResumeDraft = (task: LipSyncTask) => {
    if (langTransTimerRef.current != null) { window.clearTimeout(langTransTimerRef.current); langTransTimerRef.current = null }
    setLangTranslating(false)
    if (task.savedSegments) {
      setSegments(task.savedSegments)
      setSegHistory([task.savedSegments])
      setSegHistIdx(0)
    }
    setUploadedFileName(task.name)
    setStage('editing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSegmentEdit = (id: number, text: string) => {
    setSegments(prev => {
      const next = prev.map(s => s.id === id ? { ...s, text } : s)
      checkLimits(next)
      setSegHistory(h => { const nh = h.slice(0, segHistIdx + 1); nh.push(next); return nh })
      setSegHistIdx(i => i + 1)
      return next
    })
  }

  /** 切换目标语言：展示翻译中 → Mock 覆盖台词；写入历史栈，可点撤回撤销本次翻译 */
  const handleSelectLang = (l: string) => {
    if (l === selectedLang || langTranslating) return
    if (langTransTimerRef.current != null) window.clearTimeout(langTransTimerRef.current)
    setEditingId(null)
    setSelectedLang(l)
    setLangTranslating(true)
    langTransTimerRef.current = window.setTimeout(() => {
      langTransTimerRef.current = null
      setSegments(prev => {
        const next = SEGMENTS_FOR_LANG[l] ?? prev
        setSegHistIdx(idx => {
          setSegHistory(h => {
            const nh = h.slice(0, idx + 1)
            nh.push(next)
            return nh
          })
          return idx + 1
        })
        return next
      })
      setLangTranslating(false)
    }, 1400)
  }
  const handleSegUndo = () => {
    if (segHistIdx <= 0) return
    const ni = segHistIdx - 1; setSegHistIdx(ni); setSegments(segHistory[ni])
  }
  const handleSegRedo = () => {
    if (segHistIdx >= segHistory.length - 1) return
    const ni = segHistIdx + 1; setSegHistIdx(ni); setSegments(segHistory[ni])
  }

  // ZTK from card: skip upload/parsing, go directly to editing with preset segments
  const handleZtkFromCard = (card: typeof CARDS[0]) => {
    setUploadedFileName(card.title + '.mp4')
    setSegments(SEGMENTS)
    setSegHistory([SEGMENTS])
    setSegHistIdx(0)
    setSelectedLang('英语 · EN')
    setLangTranslating(false)
    if (langTransTimerRef.current != null) { window.clearTimeout(langTransTimerRef.current); langTransTimerRef.current = null }
    setStage('editing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const fmtTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ fontFamily: "'PingFang SC','Microsoft YaHei','Helvetica Neue',sans-serif", backgroundColor: 'var(--bg-page)', backgroundImage: 'url(/hero-banner-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center -160px', backgroundAttachment: 'fixed' }}
    >
      <div className="fixed inset-0 pointer-events-none lipsync-overlay" style={{ zIndex: 0 }} />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* Header */}
        <header className="flex items-center justify-between px-8 h-14 sticky top-0" style={{ background: 'var(--bg-header)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border-header)', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" title="返回首页" onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer" style={{ transition: 'filter 0.2s' }} onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.18)')} onMouseLeave={e => (e.currentTarget.style.filter = 'none')}>
              <img src={theme === 'light' ? '/logo-light.png' : '/title-logo.gif'} alt="" style={{ height: '28px' }} />
            </button>
            <div style={{ width: '1px', height: '16px', background: 'var(--border-main)' }} />
            <button type="button" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.15s, background 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>auto_awesome</span>
              AI素材生成
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.2)', color: '#00f2ff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>record_voice_over</span>
              AI对口型
            </div>
            <button type="button" onClick={() => navigate('/professional-edit')} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', transition: 'color 0.15s, background 0.15s' }} onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }} onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>movie_edit</span>
              专业剪辑
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#a78bfa', fontVariationSettings: '"FILL" 1' }}>bolt</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>算力: <span style={{ color: '#7fd6ff', fontWeight: 700 }}>48,510</span></span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <button className="lipsync-login-btn" style={{ height: '36px', padding: '0 16px', borderRadius: '8px', color: 'rgba(2,241,255,1)', border: '1px solid rgba(2,241,255,1)', background: 'rgba(2,241,255,0.08)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(24,144,255,0.5)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>登录 / 注册</button>
          </div>
        </header>

        <main style={{ maxWidth: '1267px', margin: '0 auto', padding: '0 32px 60px' }}>
          <section style={{ paddingTop: '48px', minHeight: '520px' }}>

            {/* IDLE */}
            <div style={{ display: stage === 'idle' ? 'grid' : 'none', gridTemplateColumns: '1fr min(536px,48%)', gap: '40px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <img src="/title-logo.gif" alt="" style={{ width: '62px', height: '62px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <TypewriterTitle />
                    <p className="lipsync-subtitle" style={{ fontSize: '18px', fontWeight: 400, color: 'rgba(112,207,255,0.65)', margin: 0 }}>多语种真实 AI对口型视频，让您的视频全球发声。</p>
                  </div>
                </div>
                <UploadCard isDragOver={isDragOver} onDragOver={() => setIsDragOver(true)} onDragLeave={() => setIsDragOver(false)} onDrop={() => { setIsDragOver(false); handleUpload() }} onUpload={handleUpload} />
                {durationWarning && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fbbf24', flexShrink: 0, marginTop: '1px' }}>warning</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '13px', color: 'rgba(251,191,36,0.9)', lineHeight: 1.5 }}>视频时长超过 5min，建议前往<button type="button" onClick={() => navigate('/professional-edit')} style={{ background: 'none', border: 'none', color: '#00f2ff', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>专业剪辑</button>分段进行 AI对口型</p>
                    </div>
                    <button onClick={() => setDurationWarning(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                  </div>
                )}
              </div>
              <DemoVideoCard />
            </div>

            {/* EDITOR pane */}
            {stage !== 'idle' && (
              <EditorPane
                stage={stage}
                fileName={uploadedFileName}
                uploadProgress={uploadProgress}
                parseProgress={parseProgress}
                twRevealed={twRevealed}
                selectedLang={selectedLang}
                langTranslating={langTranslating}
                onLangChange={handleSelectLang}
                segments={segments}
                editingId={editingId}
                editText={editText}
                onEditStart={(id, text) => { setEditingId(id); setEditText(text) }}
                onEditChange={setEditText}
                onEditSave={(id) => { handleSegmentEdit(id, editText); setEditingId(null) }}
                onEditCancel={() => setEditingId(null)}
                isSaving={isSaving}
                onSavingChange={setIsSaving}
                hasExceededLimit={hasExceededLimit}
                warningMessage={warningMessage}
                maxSegmentChars={MAX_SEGMENT_LENGTH}
                onCancelParsing={handleCancelParsing}
                onBgParsing={handleBgParsing}
                onCancelEdit={handleCancelEdit}
                onSaveDraft={handleSaveDraft}
                onGenerateVideo={handleGenerateVideo}
                onUndo={handleSegUndo}
                onRedo={handleSegRedo}
                canUndo={segHistIdx > 0}
                canRedo={segHistIdx < segHistory.length - 1}
                onNavigateProEdit={() => navigate('/professional-edit')}
              />
            )}
          </section>

          {/* Tabs — always visible */}
          {(
            <div style={{ marginTop: '48px' }}>
              <div style={{ display: 'flex', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', gap: '48px' }}>
                  {(['more', 'mine'] as ActiveTab[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'tab-btn-active' : 'tab-btn-inactive'} style={{ background: 'none', border: 'none', fontSize: '15px', fontWeight: 500, color: activeTab === tab ? '#ffffff' : 'rgba(255,255,255,0.5)', padding: '0 0 12px', cursor: 'pointer', position: 'relative', transition: 'color 0.2s' }}>
                      {tab === 'more' ? '更多实例' : '我的合成'}
                      {activeTab === tab && <span className="tab-indicator" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', borderRadius: '2px', background: 'linear-gradient(90deg,#00f2ff,#0066ff)' }} />}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'more' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px 12px' }}>
                  {CARDS.map((card, i) => (
                    <VideoCard key={i} card={card} onPlay={() => setCompareCard(card)} onZtk={() => handleZtkFromCard(card)} />
                  ))}
                </div>
              )}

              {activeTab === 'mine' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {showSubmitBanner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(0,242,234,0.08)', border: '1px solid rgba(0,242,234,0.25)', marginBottom: '4px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#00f2ea', flexShrink: 0 }}>check_circle</span>
                      <span style={{ fontSize: '13px', color: 'rgba(203,213,225,0.9)' }}>任务已提交，正在处理中，请稍候查看进度</span>
                    </div>
                  )}
                  {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '14px' }}>暂无合成记录</div>}
                  {tasks.map(task => (
                    <MineCard key={task.id} task={task} fmtTime={fmtTime} onDelete={id => setTasks(prev => prev.filter(t => t.id !== id))} onResume={handleResumeDraft} />
                  ))}
                  {tasks.length > 0 && (
                    <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>任务记录支持保留近 3 年提交历史</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showZtkModal && <ZtkModal onClose={() => setShowZtkModal(false)} />}
      {compareCard && <CompareModal card={compareCard} onClose={() => setCompareCard(null)} onZtk={() => { setCompareCard(null); handleZtkFromCard(compareCard) }} />}
    </div>
  )
}

// ── TypewriterTitle ──
function TypewriterTitle() {
  const [t1, setT1] = useState('')
  const [t2, setT2] = useState('')
  const [phase, setPhase] = useState<'p1' | 'p2' | 'done'>('p1')
  const P1 = '讯飞智作'; const P2 = '，AI对口型一步到位'
  useEffect(() => {
    let i = 0
    if (phase === 'p1') {
      const iv = setInterval(() => { i++; setT1(P1.slice(0, i)); if (i >= P1.length) { clearInterval(iv); setPhase('p2') } }, 95)
      return () => clearInterval(iv)
    }
    if (phase === 'p2') {
      const iv = setInterval(() => { i++; setT2(P2.slice(0, i)); if (i >= P2.length) { clearInterval(iv); setPhase('done') } }, 72)
      return () => clearInterval(iv)
    }
  }, [phase])
  return (
    <h1 className="lipsync-hero-title" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 'clamp(20px,2.4vw,34px)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.35px', margin: 0, whiteSpace: 'nowrap' }}>
      <span className="title-t1" style={{ background: 'linear-gradient(180deg,#fff,#cbd5e0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t1}</span>
      <span style={{ background: 'linear-gradient(90deg,#00f2ff,#3b82f6,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t2}</span>
      {phase !== 'done' && <span style={{ display: 'inline-block', width: '3px', height: '1em', background: '#00f2ff', marginLeft: '2px', verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </h1>
  )
}

// ── UploadCard ──
function UploadCard({ isDragOver, onDragOver, onDragLeave, onDrop, onUpload }: { isDragOver: boolean; onDragOver: () => void; onDragLeave: () => void; onDrop: () => void; onUpload: () => void }) {
  return (
    <div onDragOver={e => { e.preventDefault(); onDragOver() }} onDragLeave={onDragLeave} onDrop={e => { e.preventDefault(); onDrop() }}
      className="upload-card"
      style={{ width: '100%', maxWidth: '602px', height: '258px', background: 'var(--bg-card)', backdropFilter: 'blur(22px) saturate(1.2)', border: `1px solid ${isDragOver ? 'rgba(24,144,255,0.65)' : 'var(--border-card)'}`, borderRadius: '18px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s,box-shadow 0.2s', boxShadow: isDragOver ? '0 0 0 3px rgba(24,144,255,0.18),0 20px 60px rgba(0,0,0,0.4)' : 'var(--shadow-card)', cursor: 'pointer', overflow: 'hidden' }}
      onClick={onUpload}
      onMouseEnter={e => { if (!isDragOver) { e.currentTarget.style.borderColor = 'var(--border-card-hover)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(24,144,255,0.12),0 20px 60px rgba(0,0,0,0.4)' } }}
      onMouseLeave={e => { if (!isDragOver) { e.currentTarget.style.borderColor = 'var(--border-card)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)' } }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,rgba(0,242,255,0.15),rgba(59,130,246,0.15))', border: '1px solid rgba(0,242,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#00f2ff' }}>upload_file</span>
        </div>
        <p className="upload-main-text" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-bright)', margin: 0 }}>点击上传视频</p>
        <p className="upload-formats" style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0 }}>支持 mp4、mov 格式，时长不超过 5min</p>
      </div>
      <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
        <button onClick={e => { e.stopPropagation(); onUpload() }} style={{ flex: 1, height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(0,242,255,0.15),rgba(59,130,246,0.12))', border: '1px solid rgba(0,242,255,0.3)', color: '#00f2ff', fontSize: '14px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,242,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,rgba(0,242,255,0.15),rgba(59,130,246,0.12))'; e.currentTarget.style.transform = 'none' }}>上传视频</button>
      </div>
    </div>
  )
}

// ── DemoVideoCard ──
function DemoVideoCard() {
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '658/461', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s,box-shadow 0.3s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,.55)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
      <img src="/vcard-4.png" alt="AI 对口型示例" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(0,0,0,0.58) 100%)' }} />
      <p style={{ position: 'absolute', top: '16px', left: '16px', margin: 0, fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.96)', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}>歌剧魅影男主唱海绵宝宝</p>
      <div style={{ position: 'absolute', top: '14px', right: '16px' }}>
        <button onClick={() => setMuted(v => !v)} style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.95)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{muted ? 'volume_off' : 'volume_up'}</span>
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: '16px', left: '24px', right: '20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button onClick={() => setPlaying(v => !v)} style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.95)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{playing ? 'pause' : 'play_arrow'}</span>
        </button>
      </div>
    </div>
  )
}

function ZtkButton({ onClick, small }: { onClick: () => void; small?: boolean }) {
  return (
    <button onClick={onClick} style={{ height: small ? '28px' : '40px', padding: small ? '0 14px 0 30px' : '0 22px 0 44px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.92)', fontFamily: "'Piazzolla',serif", fontSize: small ? '12px' : '14px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.6)'; e.currentTarget.style.background = 'rgba(0,229,255,0.1)'; e.currentTarget.style.color = 'rgba(0,229,255,0.92)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.92)' }}
    >
      <span style={{ position: 'absolute', left: small ? '12px' : '16px', top: '50%', transform: 'translateY(-50%)' }}>✦</span>
      做同款
    </button>
  )
}

// ── helpers ──
const TOTAL_DUR = 45 // seconds mock total duration
function parseRange(range: string): { start: number; end: number } {
  const [s, e] = range.split('—')
  const toSec = (t: string) => { const [m, ss] = t.split(':'); return +m * 60 + +ss }
  return { start: toSec(s), end: toSec(e) }
}
function fmtSec(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/** 时间轴分段：段落按时长比例占宽，中间空白时段为间隔条 */
function buildTimelinePieces(segs: typeof SEGMENTS, totalDur: number): Array<{ kind: 'gap'; dur: number } | { kind: 'seg'; seg: typeof SEGMENTS[0] }> {
  const sorted = [...segs].sort((a, b) => parseRange(a.range).start - parseRange(b.range).start)
  const pieces: Array<{ kind: 'gap'; dur: number } | { kind: 'seg'; seg: typeof SEGMENTS[0] }> = []
  let t = 0
  for (const seg of sorted) {
    const { start, end } = parseRange(seg.range)
    if (start > t) pieces.push({ kind: 'gap', dur: start - t })
    pieces.push({ kind: 'seg', seg })
    t = Math.max(t, end)
  }
  if (t < totalDur) pieces.push({ kind: 'gap', dur: totalDur - t })
  return pieces
}

// ── EditorPane ──
function EditorPane({ stage, fileName, uploadProgress, parseProgress, twRevealed, selectedLang, langTranslating, onLangChange, segments, editingId, editText, onEditStart, onEditChange, onEditSave, onEditCancel, isSaving, onSavingChange, hasExceededLimit, warningMessage, maxSegmentChars, onCancelParsing, onBgParsing, onCancelEdit, onSaveDraft, onGenerateVideo, onUndo, onRedo, canUndo, canRedo, onNavigateProEdit }: {
  stage: LipSyncStage; fileName: string; uploadProgress: number; parseProgress: number; twRevealed: number[]
  selectedLang: string; langTranslating: boolean; onLangChange: (l: string) => void; segments: typeof SEGMENTS
  editingId: number | null; editText: string
  onEditStart: (id: number, text: string) => void; onEditChange: (t: string) => void
  onEditSave: (id: number) => void; onEditCancel: () => void
  isSaving: boolean; onSavingChange: (v: boolean) => void
  hasExceededLimit: boolean; warningMessage: string; maxSegmentChars: number
  onCancelParsing: () => void; onBgParsing: () => void
  onCancelEdit: () => void; onSaveDraft: () => void; onGenerateVideo: () => void
  onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean
  onNavigateProEdit: () => void
}) {
  const [showLangDrop, setShowLangDrop] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [aiWatermark, setAiWatermark] = useState(true)
  const timelineRef = useRef<HTMLDivElement>(null)

  // playback simulation
  useEffect(() => {
    if (!isPlaying) return
    const iv = setInterval(() => {
      setCurrentTime(t => {
        if (t >= TOTAL_DUR) { setIsPlaying(false); return 0 }
        return t + 0.1
      })
    }, 100)
    return () => clearInterval(iv)
  }, [isPlaying])

  // active segment from currentTime
  const activeSegId = segments.find(s => {
    const { start, end } = parseRange(s.range)
    return currentTime >= start && currentTime <= end
  })?.id ?? null

  // seek on timeline click/drag
  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setCurrentTime(ratio * TOTAL_DUR)
  }
  const [dragging, setDragging] = useState(false)
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    seekFromEvent(e); setDragging(true)
  }
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!timelineRef.current) return
      const rect = timelineRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      setCurrentTime(ratio * TOTAL_DUR)
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging])

  /** 段落「播放 / 暂停」：正在播本段则暂停；已暂停且指针在本段则续播；否则跳到段首并播放 */
  const handleSegPlayToggle = (segId: number) => {
    const seg = segments.find(s => s.id === segId)
    if (!seg) return
    const { start, end } = parseRange(seg.range)
    const playheadInThisSeg = currentTime >= start && currentTime <= end
    if (isPlaying && activeSegId === segId) {
      setIsPlaying(false)
      return
    }
    if (!isPlaying && playheadInThisSeg) {
      setIsPlaying(true)
      return
    }
    setCurrentTime(start)
    setIsPlaying(true)
  }

  const topLabel = stage === 'uploading' ? `上传中… ${Math.round(uploadProgress)}%`
    : stage === 'parsing' ? '视频解析中…'
    : `${fileName} 的合成`

  const progressPct = (currentTime / TOTAL_DUR) * 100

  return (
    <div className="hero-editor" style={{ border: '1px solid var(--border-main)', borderRadius: '16px', background: 'var(--bg-editor)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div className="hero-editor-top" style={{ minHeight: '46px', padding: '0 16px', borderBottom: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {(stage === 'uploading' || stage === 'parsing') && (
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #00f2ff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          )}
          <span className="hero-editor-filename" style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topLabel}</span>
        </div>
        {/* AI Watermark toggle — only in editing stage */}
        {stage === 'editing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>AI 水印</span>
            <button
              onClick={() => setAiWatermark(v => !v)}
              style={{ position: 'relative', width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', background: aiWatermark ? 'linear-gradient(90deg,#00c2ff,#5752ff)' : 'rgba(255,255,255,0.15)', padding: 0 }}
              title={aiWatermark ? '关闭 AI 水印' : '开启 AI 水印'}
            >
              <span style={{ position: 'absolute', top: '2px', left: aiWatermark ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#ffffff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {stage === 'editing' && (
            <span style={{ fontSize: '13px', background: 'linear-gradient(90deg,#00f2ff,#41bcc3,#6b8cff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>预计消耗 <b>125</b> 算力</span>
          )}
          {(stage === 'uploading' || stage === 'parsing') && (
            <>
              <EdBtn onClick={onCancelParsing}>取消解析</EdBtn>
              {stage === 'parsing' && <EdBtn onClick={onBgParsing}>后台解析</EdBtn>}
            </>
          )}
          {stage === 'editing' && (
            <>
              <EdBtn onClick={onCancelEdit}>取消合成</EdBtn>
              <EdBtn onClick={onSaveDraft}>保存草稿</EdBtn>
              <EdBtn primary onClick={onGenerateVideo} disabled={hasExceededLimit || isSaving || editingId !== null}>合成视频</EdBtn>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(260px,1fr)', minHeight: 'min(506px,58vh)', alignItems: 'stretch' }}>
        {/* Left */}
        <div className="hero-ed-left" style={{ minHeight: 0, background: 'var(--bg-panel)', padding: '16px 12px 12px', display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--border-main)' }}>
          <div style={{ flex: '1 1 0', minHeight: '168px', maxHeight: '70%', borderRadius: '6px', overflow: 'hidden', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img src="/vcard-4.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: stage === 'editing' ? 1 : 0.35 }} />
            {stage !== 'editing' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(0,242,255,0.6)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px', color: 'rgba(0,242,255,0.7)' }}>{stage === 'uploading' ? '上传中…' : '解析中…'}</span>
              </div>
            )}
            {/* active segment overlay */}
            {stage === 'editing' && isPlaying && activeSegId !== null && (
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: 'rgba(0,242,255,0.9)', textAlign: 'center', pointerEvents: 'none' }}>
                {segments.find(s => s.id === activeSegId)?.range}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 4px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary2)' }}>
              {stage === 'editing' ? fmtSec(currentTime) : '00:00'}
              <span style={{ color: 'var(--text-muted)' }}>/{fmtSec(TOTAL_DUR)}</span>
            </span>
            {stage === 'editing' && (
              <button onClick={() => setIsPlaying(v => !v)} style={{ marginLeft: 'auto', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
            )}
            {stage !== 'editing' && <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--text-secondary2)', fontSize: '12px' }}>▶</span>}
            <span style={{ cursor: 'pointer', color: 'var(--text-dim)', fontSize: '12px' }}>⛶</span>
          </div>
          {/* Timeline strip */}
          <div
            ref={timelineRef}
            className="hero-ed-strip"
            style={{ height: '32px', borderRadius: '6px', background: 'var(--bg-timeline)', overflow: 'hidden', position: 'relative', cursor: stage === 'editing' ? 'pointer' : 'default', userSelect: 'none' }}
            onMouseDown={stage === 'editing' ? handleTimelineMouseDown : undefined}
          >
            {stage === 'uploading' && (
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg,rgba(0,242,255,0.4),rgba(59,130,246,0.4))', borderRadius: '6px', transition: 'width 0.12s ease' }} />
            )}
            {stage === 'parsing' && (
              <>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(0,242,255,0.15),rgba(59,130,246,0.15))' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(0,242,255,0.7)' }}>解析中 {Math.round(parseProgress)}%</span>
                </div>
              </>
            )}
            {stage === 'editing' && (
              <>
                <div className="hero-ed-strip-segments" style={{ position: 'absolute', inset: '4px 5px', display: 'flex', gap: '3px', alignItems: 'stretch', zIndex: 0, pointerEvents: 'none' }}>
                  {buildTimelinePieces(segments, TOTAL_DUR).map((piece, i) => {
                    if (piece.kind === 'gap') {
                      return <div key={`g-${i}`} className="hero-ed-strip-gap" style={{ flex: piece.dur, minWidth: 0, borderRadius: '4px' }} />
                    }
                    const { seg } = piece
                    const r = parseRange(seg.range)
                    const dur = r.end - r.start
                    const isPlayingThisSeg = isPlaying && seg.id === activeSegId
                    return (
                      <div
                        key={seg.id}
                        className={isPlayingThisSeg ? 'hero-ed-strip-chunk hero-ed-strip-chunk--active' : 'hero-ed-strip-chunk'}
                        style={{ flex: dur, minWidth: 0, borderRadius: '4px', transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s' }}
                      />
                    )
                  })}
                </div>
                {/* playhead */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${progressPct}%`, width: '2px', zIndex: 2, background: '#00f2ff', boxShadow: '0 0 6px rgba(0,242,255,0.8)', transition: dragging ? 'none' : 'left 0.1s linear', pointerEvents: 'none', marginLeft: '-1px' }} />
              </>
            )}
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>

        {/* Right: dialogue — 脚注固定在列底部，台词区单独滚动 */}
        <div className="hero-ed-right" style={{ minHeight: 0, height: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="hero-ed-right-title" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>对话解析</span>
              <InfoTip text="对话修改后的人物口型需点击合成视频后生效" />
              {stage === 'editing' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.2)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#00f2ff', fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                    <span style={{ fontSize: '11px', color: '#a5f3fc', whiteSpace: 'nowrap' }}>解析完成</span>
                  </div>
                  <button onClick={onUndo} disabled={!canUndo} title="撤回" style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', color: canUndo ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canUndo ? 'pointer' : 'not-allowed', transition: 'all 0.15s', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>undo</span>
                  </button>
                  <button onClick={onRedo} disabled={!canRedo} title="重做" style={{ width: '24px', height: '24px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--border-subtle)', color: canRedo ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canRedo ? 'pointer' : 'not-allowed', transition: 'all 0.15s', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>redo</span>
                  </button>
                </>
              )}
              {stage === 'parsing' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(0,242,255,0.8)', animation: 'pulseFade 1.5s ease-in-out infinite' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f2ff', display: 'inline-block', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
                  解析中
                  <style>{`@keyframes pulseFade{0%,100%{opacity:0.6}50%{opacity:1}} @keyframes pulseDot{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}`}</style>
                </span>
              )}
            </div>
            {/* Lang select */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => !langTranslating && setShowLangDrop(v => !v)}
                disabled={stage === 'editing' && langTranslating}
                className="hero-ed-lang-select"
                style={{ minWidth: '148px', height: '34px', padding: '0 10px', background: 'var(--bg-panel)', border: '1px solid var(--border-main)', borderRadius: '8px', color: 'var(--text-bright)', fontSize: '13px', cursor: stage === 'editing' && langTranslating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: stage === 'editing' && langTranslating ? 0.65 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#00f2ff' }}>translate</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{selectedLang}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{showLangDrop ? 'expand_less' : 'expand_more'}</span>
              </button>
              {showLangDrop && (
                <div style={{ position: 'absolute', right: 0, top: '38px', width: '180px', background: 'var(--bg-dropdown)', border: '1px solid var(--border-main)', borderRadius: '8px', zIndex: 20, overflow: 'hidden' }}>
                  {LANGS.map(l => (
                    <button
                      key={l}
                      type="button"
                      className={l === selectedLang ? 'hero-ed-lang-option hero-ed-lang-option--active' : 'hero-ed-lang-option'}
                      disabled={langTranslating}
                      onClick={() => { if (!langTranslating) { onLangChange(l); setShowLangDrop(false) } }}
                    >{l}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {stage === 'editing' && langTranslating && (
            <div className="hero-ed-lang-translating" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.22)' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(0,242,255,0.35)', borderTopColor: '#00f2ff', animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary2)' }}>翻译中… 正在将台词转为 <strong style={{ color: 'var(--text-bright)' }}>{selectedLang.split(' · ')[0]}</strong>，请稍候</span>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          <div className="hero-ed-right-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Segments */}
            {stage === 'uploading' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, minHeight: '120px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>上传完成后开始解析…</p>
              </div>
            )}

            {/* 总字数超限：顶栏提示 */}
            {stage === 'editing' && hasExceededLimit && warningMessage !== '' && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.28)', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24', flexShrink: 0, marginTop: '1px', fontVariationSettings: '"FILL" 1' }}>warning</span>
                <span style={{ fontSize: '12px', color: 'rgba(251,191,36,0.9)', lineHeight: 1.5 }}>{warningMessage}，合成视频已暂停</span>
              </div>
            )}

            {(stage === 'parsing' || stage === 'editing') && segments.map((seg, si) => (
              <SegmentItem
                key={seg.id}
                seg={seg}
                isEditing={editingId === seg.id}
                isActive={stage === 'editing' && !langTranslating && isPlaying && seg.id === activeSegId}
                editText={editText}
                onEditStart={() => {
                  setIsPlaying(false)
                  onEditStart(seg.id, seg.text)
                }}
                onEditChange={onEditChange}
                onEditSave={() => onEditSave(seg.id)}
                onEditCancel={onEditCancel}
                isSaving={isSaving}
                onSavingChange={onSavingChange}
                revealedChars={stage === 'parsing' ? (twRevealed[si] ?? 0) : seg.text.length}
                disabled={stage === 'parsing' || (stage === 'editing' && langTranslating)}
                onPlayToggle={() => handleSegPlayToggle(seg.id)}
                maxSegmentChars={maxSegmentChars}
                showSavedLengthWarn={stage === 'editing'}
              />
            ))}
          </div>

          {stage === 'editing' && (
            <div className="hero-ed-footnote" style={{ flexShrink: 0, padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span className="material-symbols-outlined hero-ed-footnote-icon" style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }}>info</span>
              <p className="hero-ed-footnote-text" style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                如发现解析不准确，您可前往
                <button type="button" className="hero-ed-footnote-link" onClick={onNavigateProEdit} style={{ background: 'none', border: 'none', color: 'rgba(0,242,255,0.6)', fontSize: '12px', cursor: 'pointer', padding: 0 }}>「专业剪辑」</button>
                （可点击跳转），将原视频导入并插入轨道，手动分段后，逐段右键进行 AI对口型，进一步提高准确率。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isLight = theme === 'light'
  return (
    <button
      onClick={onToggle}
      title={isLight ? '切换夜间模式' : '切换日间模式'}
      style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'var(--text-secondary2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f2ff'; e.currentTarget.style.color = '#00f2ff' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary2)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{isLight ? 'dark_mode' : 'light_mode'}</span>
    </button>
  )
}

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="hero-ed-infotip" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="hero-ed-infotip-trigger" style={{ width: '16px', height: '16px', borderRadius: '50%', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none', lineHeight: 1 }}>i</span>
      {show && (
        <span className="hero-ed-infotip-bubble" style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', lineHeight: 1.45, zIndex: 50, pointerEvents: 'none', maxWidth: 'min(280px, 70vw)', width: 'max-content' }}>
          {text}
        </span>
      )}
    </span>
  )
}

function EdBtn({ children, primary, onClick, disabled }: { children: React.ReactNode; primary?: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className={primary ? 'hero-ed-btn-primary' : 'hero-ed-btn'} style={{ height: '35px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: disabled ? 0.45 : 1, ...(primary ? { background: 'linear-gradient(90deg,rgb(42,19,255),rgb(83,64,255),rgb(11,255,239))', color: '#ffffff', border: 'none' } : { background: 'var(--bg-panel)', border: '1px solid var(--border-main)', color: 'rgba(255,255,255,0.8)' }) }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
    >{children}</button>
  )
}

// ── SegmentItem ──
function SegmentItem({ seg, isEditing, isActive, editText, onEditStart, onEditChange, onEditSave, onEditCancel, isSaving, onSavingChange, revealedChars, disabled, onPlayToggle, maxSegmentChars, showSavedLengthWarn }: {
  seg: typeof SEGMENTS[0]; isEditing: boolean; isActive: boolean; editText: string
  onEditStart: () => void; onEditChange: (t: string) => void; onEditSave: () => void; onEditCancel: () => void
  isSaving: boolean; onSavingChange: (v: boolean) => void
  revealedChars: number; disabled: boolean; onPlayToggle: () => void; maxSegmentChars: number
  /** 为 false 时不展示单段字数警告（解析阶段）；仅展示已保存文本 seg.text 的超限，编辑中不提示 */
  showSavedLengthWarn: boolean
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (isEditing) textareaRef.current?.focus() }, [isEditing])

  const handleSave = () => {
    if (editText === seg.text || isSaving) return
    onSavingChange(true)
    setTimeout(() => {
      onEditSave()
      onSavingChange(false)
    }, 600)
  }

  const displayText = seg.text.slice(0, revealedChars)
  const isCursor = revealedChars < seg.text.length
  /** 仅已写入 seg.text 的超限在保存并退出编辑后展示；编辑框内打字数超限不提示 */
  const segmentLengthExceeded = showSavedLengthWarn && !isEditing && seg.text.length > maxSegmentChars

  const segShellClass = [isActive && 'hero-ed-seg-active', isEditing && 'hero-ed-seg-editing'].filter(Boolean).join(' ')

  return (
    <div
      className={segShellClass}
      style={{
        marginBottom: '6px',
        ...(!isEditing && {
          background: isActive ? 'rgba(0,242,255,0.07)' : 'transparent',
          border: isActive ? '1px solid rgba(0,242,255,0.2)' : '1px solid transparent',
        }),
        borderRadius: '16px',
        padding: (isEditing || isActive) ? '10px 12px' : '8px 0',
        transition: 'all 0.2s',
        opacity: disabled && revealedChars === 0 ? 0.2 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div className="hero-ed-spk" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-strong)' }}>
          <div style={{ width: '27px', height: '27px', borderRadius: '50%', background: 'linear-gradient(135deg,#00f2ff,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#030a1a' }}>
            {seg.speaker.replace('Speaker ', 'S')}
          </div>
          {seg.speaker}
        </div>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="hero-ed-range" style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{seg.range}</span>
        </span>
      </div>

      {!isEditing ? (
        <>
          <div
            onClick={disabled ? undefined : onEditStart}
            tabIndex={disabled ? -1 : 0}
            className="hero-ed-text-display"
            style={{ fontSize: '14px', lineHeight: 1.55, color: '#ebebeb', padding: '6px 8px', borderRadius: '8px', cursor: disabled ? 'default' : 'text', transition: 'background 0.15s', minHeight: '28px' }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            {displayText}
            {isCursor && <span style={{ display: 'inline-block', width: '2px', height: '1em', background: '#00f2ff', marginLeft: '1px', verticalAlign: 'middle', animation: 'blink 0.7s step-end infinite' }} />}
          </div>
          {segmentLengthExceeded && (
            <div className="hero-ed-seg-length-warn" style={{ marginTop: '6px', padding: '8px 10px', borderRadius: '8px', fontSize: '12px', lineHeight: 1.45, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.35)', color: 'rgba(251,191,36,0.95)' }}>
              该片段字数超出 {maxSegmentChars}，请分段或精简。
            </div>
          )}
        </>
      ) : (
        <div>
          <textarea ref={textareaRef} value={editText} onChange={e => onEditChange(e.target.value)} rows={4}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (editText !== seg.text && !isSaving) handleSave()
              }
              if (e.key === 'Escape') onEditCancel()
            }}
            className="hero-ed-text-field"
            style={{ width: '100%', padding: '10px 12px', fontSize: '14px', lineHeight: 1.55, background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: '10px', color: 'var(--text-primary)', resize: 'none', outline: 'none', boxSizing: 'border-box', minHeight: '4.5em' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              disabled={editText === seg.text || isSaving}
              onClick={handleSave}
              className="hero-ed-text-btn"
              style={{ height: '28px', padding: '0 14px', borderRadius: '999px', background: 'rgba(24,144,255,0.2)', border: '1px solid rgba(24,144,255,0.5)', color: '#7fd6ff', fontSize: '12px', cursor: editText === seg.text || isSaving ? 'not-allowed' : 'pointer', opacity: editText === seg.text ? 0.45 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {isSaving && <span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1.5px solid rgba(127,214,255,0.35)', borderTopColor: '#7fd6ff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />}
              {isSaving ? '保存中' : '保存'}
            </button>
            <button type="button" onClick={onEditCancel} className="hero-ed-text-btn" style={{ height: '28px', padding: '0 14px', borderRadius: '999px', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-secondary2)', fontSize: '12px', cursor: 'pointer' }}>取消</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── VideoCard ──
function VideoCard({ card, onPlay, onZtk }: { card: typeof CARDS[0]; onPlay: () => void; onZtk: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '352/206', borderRadius: '18px', border: `1px solid ${hovered ? 'rgba(0,242,234,0.14)' : 'transparent'}`, cursor: 'pointer', overflow: 'hidden', transform: hovered ? 'translateY(-6px) scale(1.012)' : 'none', boxShadow: hovered ? '0 20px 50px rgba(0,0,0,.6)' : '0 4px 16px rgba(0,0,0,0.3)', transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <img src={card.img} alt={card.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 5, display: 'flex', gap: '4px' }}>
        {[card.lang, card.cat].map(tag => (
          <span key={tag} style={{ background: tag === card.lang ? 'rgba(80,16,160,0.5)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.96)', fontSize: '11px', padding: '4px 8px', borderRadius: '20px', backdropFilter: 'blur(8px)', letterSpacing: '.3px' }}>{tag}</span>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.65) 100%)', opacity: hovered ? 1 : 0.85, transition: 'opacity 0.25s' }} />
      {/* Play button – center */}
      <div onClick={onPlay} style={{ position: 'absolute', inset: '0 0 52px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, opacity: hovered ? 1 : 0, transition: 'opacity 0.25s' }}>
        <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', borderRadius: '50%', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.25s' }}>
          <svg width="15" height="17" viewBox="0 0 15 17" fill="none"><path d="M1 1L14 8.5L1 16V1Z" fill="white" stroke="white" strokeWidth="1.4" strokeLinejoin="round" /></svg>
        </div>
      </div>
      {/* Footer */}
      <div style={{ position: 'absolute', left: '12px', right: '12px', bottom: '12px', zIndex: 4 }}>
        <div style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.2s', marginBottom: '6px' }}>
          <ZtkButton onClick={onZtk} small />
        </div>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, lineHeight: 1.4, color: 'rgba(255,255,255,0.96)', textShadow: '0 0 1px rgba(0,0,0,0.9),0 1px 3px rgba(0,0,0,0.75)' }}>{card.title}</p>
      </div>
    </div>
  )
}

// ── ExpireInfoIcon ──
function ExpireInfoIcon({ isDraft }: { isDraft: boolean }) {
  const [show, setShow] = useState(false)
  const tip = isDraft ? '草稿过期后不支持继续编辑' : '合成视频过期后不支持下载和预览'
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span
        onClick={e => { e.stopPropagation(); setShow(v => !v) }}
        style={{ width: '13px', height: '13px', borderRadius: '50%', border: '1px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', cursor: 'pointer', flexShrink: 0, opacity: 0.7 }}
      >i</span>
      {show && (
        <>
          <span style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShow(false)} />
          <span style={{ position: 'absolute', bottom: '18px', right: 0, zIndex: 1000, background: '#1e2a3a', border: '1px solid rgba(127,214,255,0.25)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: 'rgba(203,213,225,0.9)', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', lineHeight: 1.5 }}>
            {tip}
          </span>
        </>
      )}
    </span>
  )
}

// ── MineCard ──
function MineCard({ task, fmtTime, onDelete, onResume }: { task: LipSyncTask; fmtTime: (n: number) => string; onDelete: (id: string) => void; onResume: (t: LipSyncTask) => void }) {
  const isDraft = task.status === 'draft'
  const isBgParsing = task.status === 'bg-parsing'

  const chipStyle = (status: LipSyncTask['status']): React.CSSProperties => {
    if (status === 'processing' || status === 'bg-parsing') return { border: '1px solid rgba(127,214,255,0.6)', background: 'rgba(24,144,255,0.16)', color: '#7fd6ff' }
    if (status === 'success') return { border: '1px solid rgba(72,199,142,0.8)', background: 'rgba(72,199,142,0.14)', color: '#6be6a5' }
    if (status === 'failed') return { border: '1px solid rgba(255,99,132,0.8)', background: 'rgba(255,76,76,0.14)', color: '#ff8080' }
    return { border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary2)' }
  }

  const chipLabel = task.status === 'processing' ? `合成中 预计${Math.max(1, Math.round((100 - task.progress) / 5))}分钟`
    : task.status === 'bg-parsing' ? `解析中 ${Math.round(task.progress)}%`
    : task.status === 'success' ? '已完成'
    : task.status === 'failed' ? '合成失败'
    : '草稿'

  return (
    <article
      className={`mine-card${isDraft ? ' mine-card-draft' : ''}`}
      style={{ display: 'flex', alignItems: 'stretch', gap: '18px', minHeight: '116px', background: isDraft ? 'rgba(23,29,38,0.7)' : '#171d26', borderRadius: '20px', padding: '14px 22px', border: `1px ${isDraft ? 'dashed' : 'solid'} ${isDraft ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(127,214,255,0.35)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)'; e.currentTarget.style.background = isDraft ? 'rgba(28,37,49,0.8)' : '#1c2531' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isDraft ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = isDraft ? 'rgba(23,29,38,0.7)' : '#171d26' }}
    >
      {/* Thumb */}
      <div style={{ width: '212px', minWidth: '212px', height: '120px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-dropdown)', position: 'relative' }}>
        <img src="/vcard-1.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDraft || isBgParsing ? 0.4 : 0.8 }} />
        {isBgParsing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2px solid #00f2ff', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '10px', color: 'rgba(0,242,255,0.8)' }}>解析中</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 className="mine-title" style={{ margin: 0, fontSize: '17px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.name} 的合成
          {isDraft && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>保存草稿等待合成</span>}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ display: 'inline-flex', padding: '0 10px', height: '24px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, alignItems: 'center', ...chipStyle(task.status) }}>{chipLabel}</span>
          <span style={{ display: 'inline-flex', padding: '0 10px', height: '24px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, alignItems: 'center', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--text-bright)', background: 'rgba(0,0,0,0.15)' }}>{task.targetLanguage}</span>
          {task.status === 'success' && task.duration !== '–' && <span style={{ display: 'inline-flex', padding: '0 10px', height: '24px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, alignItems: 'center', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--text-bright)', background: 'rgba(0,0,0,0.15)' }}>{task.duration}</span>}
        </div>

        {/* Progress bar */}
        {(task.status === 'processing' || task.status === 'bg-parsing') && (
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${task.progress}%`, background: 'linear-gradient(90deg,#00f2ff,#3b82f6)', borderRadius: '2px', transition: 'width 0.8s ease' }} />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
          {(isDraft || task.status === 'bg-parsing' && task.progress >= 100) && (
            <button className="task-btn" onClick={() => onResume(task)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              继续编辑
            </button>
          )}
          {task.status === 'success' && (
            <>
              <button className="task-btn-dl" title="下载">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
              <button className="task-btn" onClick={() => onResume(task)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                再做一条
              </button>
            </>
          )}
          {task.status === 'failed' && (
            <button className="task-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
              重试
            </button>
          )}
          <button className="task-btn" onClick={() => onDelete(task.id)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            删除
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mine-meta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '72px', paddingLeft: '12px', fontSize: '13px', color: 'var(--text-dim)', gap: '8px' }}>
        <span className="mine-meta-time">{fmtTime(task.createdAt)}</span>
        {(() => {
          const expireDays = isDraft ? 15 : 30
          const expireTs = task.createdAt + expireDays * 24 * 60 * 60 * 1000
          const expireDate = new Date(expireTs)
          const yyyy = expireDate.getFullYear()
          const mm = String(expireDate.getMonth() + 1).padStart(2, '0')
          const dd = String(expireDate.getDate()).padStart(2, '0')
          const hh = String(expireDate.getHours()).padStart(2, '0')
          const mi = String(expireDate.getMinutes()).padStart(2, '0')
          return (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              {yyyy}-{mm}-{dd} {hh}:{mi} 过期
              <ExpireInfoIcon isDraft={isDraft} />
            </span>
          )
        })()}
      </div>
    </article>
  )
}

// ── CompareModal ──
function CompareModal({ card, onClose, onZtk }: { card: typeof CARDS[0]; onClose: () => void; onZtk: () => void }) {
  const [leftPlaying, setLeftPlaying] = useState(true)
  const [rightPlaying, setRightPlaying] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,10,20,0.82)', backdropFilter: 'blur(20px)' }} onClick={onClose}>
      <div className="ztk-modal" style={{ position: 'relative', width: 'min(1200px,92vw)', borderRadius: '16px', background: '#111827', padding: '28px', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '-16px', right: '-16px', width: '36px', height: '36px', borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#111', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10 }}>×</button>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* Left: original */}
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary2)', marginBottom: '10px', fontWeight: 500 }}>原视频</p>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-deep)', aspectRatio: '16/9' }}>
              <img src={card.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Play/pause overlay */}
              <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                <button onClick={() => setLeftPlaying(v => !v)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.96)' }}>
                  {leftPlaying ? (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><rect x="0" y="0" width="3.5" height="12" /><rect x="6.5" y="0" width="3.5" height="12" /></svg>
                  ) : (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M1 1L9 6L1 11V1Z" /></svg>
                  )}
                </button>
              </div>
              {/* Progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.15)' }}>
                <div style={{ height: '100%', width: leftPlaying ? '42%' : '42%', background: '#fff', borderRadius: '2px' }} />
              </div>
            </div>
          </div>

          {/* Right: synthesized */}
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary2)', marginBottom: '10px', fontWeight: 500 }}>合成后</p>
            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-deep)', aspectRatio: '16/9' }}>
              <img src={card.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'hue-rotate(12deg) saturate(1.1)' }} />
              <div style={{ position: 'absolute', bottom: '12px', right: '12px' }}>
                <button onClick={() => setRightPlaying(v => !v)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.96)' }}>
                  {rightPlaying ? (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><rect x="0" y="0" width="3.5" height="12" /><rect x="6.5" y="0" width="3.5" height="12" /></svg>
                  ) : (
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="white"><path d="M1 1L9 6L1 11V1Z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="ztk-modal-title-text" style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{card.title}</p>
          <button
            onClick={onZtk}
            style={{ height: '44px', padding: '0 28px', borderRadius: '999px', background: 'linear-gradient(135deg,#00e5ff,#3b82ff)', color: '#ffffff', fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}
          >做同款</button>
        </div>
      </div>
    </div>
  )
}

// ── ZtkModal ──
function ZtkModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,8,18,0.86)', backdropFilter: 'blur(18px)', zIndex: 100 }} onClick={onClose}>
      <div style={{ position: 'relative', width: '480px', maxWidth: 'calc(100% - 64px)', borderRadius: '18px', padding: '24px', background: 'radial-gradient(circle at top left,rgba(0,242,234,0.15) 0%,rgba(0,50,80,0.8) 50%,rgba(3,10,26,0.95) 100%)', border: '1px solid rgba(0,242,234,0.38)', boxShadow: '0 24px 80px rgba(0,0,0,0.72)', color: 'var(--text-primary)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '17px', fontWeight: 600 }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '999px', background: 'radial-gradient(circle at 30% 0%,#00f2ea,#00b3ff)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✦</span>
            做同款 · 一键复用示例视频
          </div>
          <button onClick={onClose} style={{ width: '24px', height: '24px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.28)', background: 'rgba(8,10,18,0.86)', color: 'var(--text-strong)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px' }}>×</button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-strong)', lineHeight: 1.7, marginBottom: '16px' }}>已为你预设好模板、台词和配音参数。登录后即可将当前示例复制到「我的作品」，并替换为你自己的素材一键生成。</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 12px', marginBottom: '18px' }}>
          {['保留原示例分镜与节奏', '自动继承语言 / 字幕样式', '支持替换人物 / 台词内容', '生成前可二次编辑预览'].map(item => (
            <div key={item} style={{ padding: '7px 10px', borderRadius: '999px', border: '1px solid rgba(0,242,234,0.24)', background: 'radial-gradient(circle at top,rgba(0,242,234,0.1),transparent)', fontSize: '12px', color: 'rgba(230,247,255,0.88)', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#00f2ea', boxShadow: '0 0 0 4px rgba(0,242,234,0.18)', flexShrink: 0 }} />
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(0,242,234,0.5)', fontSize: '11px', color: 'rgba(0,242,234,0.96)', background: 'rgba(0,242,234,0.08)' }}>提示</span>
            登录后可在「我的作品」中再次编辑。
          </div>
          <button style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', padding: '0 18px 0 32px', height: '38px', borderRadius: '999px', border: '1px solid rgba(0,242,234,0.9)', background: 'linear-gradient(135deg,#00f2ea,#00b3ff)', color: '#020611', fontSize: '14px', fontWeight: 600, cursor: 'pointer', position: 'relative', whiteSpace: 'nowrap', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>✦</span>
            去登录并做同款
          </button>
        </div>
      </div>
    </div>
  )
}
