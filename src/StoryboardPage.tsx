// 分镜脚本工作台页面

import { useEffect, useRef, useState, type ChangeEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTour } from './useTour'

type Model = 'Seedance 2.0 Fast' | 'Veo' | 'Kling 3.0'
type AspectRatio = '16:9' | '4:3' | '3:4' | '9:16'

function StoryboardPage() {
  const navigate = useNavigate()
  const [showNextStepModal, setShowNextStepModal] = useState(false)
  const [referenceImage, setReferenceImage] = useState<{ file: File; url: string } | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model>('Seedance 2.0 Fast')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9')
  const [duration, setDuration] = useState(5)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false)
  const [showDurationSelector, setShowDurationSelector] = useState(false)
  const [historyImages] = useState([
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw'
  ])

  const videoPromptRef = useRef<HTMLTextAreaElement>(null)
  const visualPromptRef = useRef<HTMLTextAreaElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const aspectRatioDropdownRef = useRef<HTMLDivElement>(null)
  const durationSelectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (referenceImage?.url) URL.revokeObjectURL(referenceImage.url)
    }
  }, [referenceImage?.url])

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(event.target as Node)) {
        setShowAspectRatioDropdown(false)
      }
      if (durationSelectorRef.current && !durationSelectorRef.current.contains(event.target as Node)) {
        setShowDurationSelector(false)
      }
    }

    if (showModelDropdown || showAspectRatioDropdown || showDurationSelector) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModelDropdown, showAspectRatioDropdown, showDurationSelector])

  const handleReferenceImageChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setReferenceImage((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return { file, url: URL.createObjectURL(file) }
    })

    // allow picking the same file again
    e.target.value = ''
  }

  const [draftSaved, setDraftSaved] = useState(false)

  const saveDraft = () => {
    const draft = {
      savedAt: Date.now(),
      videoPrompt: videoPromptRef.current?.value ?? '',
      visualPrompt: visualPromptRef.current?.value ?? '',
      referenceImageName: referenceImage?.file?.name ?? null
    }
    localStorage.setItem('storyboard:draft', JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2500)
  }

  const handleSaveAndBack = () => {
    saveDraft()
    navigate('/')
  }

  // ── Tour configuration for /storyboard ──
  useTour(
    'storyboard',
    [
      {
        element: '#tour-scene-list',
        popover: {
          title: '分镜列表',
          description: '在当前模块点选相应分镜进行细节修改。',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '#tour-scene-config',
        popover: {
          title: '分镜画面配置',
          description: '支持对分镜画面进行重新生成并查看生成历史。',
          side: 'left',
          align: 'start',
        },
      },
      {
        element: '#tour-scene-prompt',
        popover: {
          title: '分镜素材与提示词',
          description: '支持上传附件，修改提示词对分镜视频呈现效果进行编辑。',
          side: 'top',
          align: 'start',
        },
      },
    ],
    {
      delay: 1000,
      // Step 0: clicking any scene item advances the tour
      stepHooks: {
        0: {
          onActive: (driverObj) => {
            const sceneList = document.getElementById('tour-scene-list')
            const handler = () => {
              driverObj.moveNext()
              sceneList?.removeEventListener('click', handler)
            }
            sceneList?.addEventListener('click', handler)
            return () => sceneList?.removeEventListener('click', handler)
          },
        },
      },
    },
  )

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#0a0a0c] to-[#111115]">
      {/* 网格背景 */}
      <div className="absolute w-full h-full bg-grid opacity-50"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-6 py-3 h-16 flex-shrink-0">
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black bg-gradient-to-br from-[#00f2ea] to-[#7d00ff] shadow-[0_0_10px_rgba(0,242,234,0.4)]">
              <span className="material-symbols-outlined text-xl font-bold">movie_edit</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              讯飞智作/分镜脚本创作
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveDraft}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 border ${
                draftSaved
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  : 'text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
              }`}
              aria-live="polite"
            >
              {draftSaved ? (
                <>
                  <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                  已保存
                </>
              ) : '保存草稿'}
            </button>
            <button
              onClick={handleSaveAndBack}
              className="px-4 py-2 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-white/10 hover:border-[#00f2ea]/50"
            >
              保存并返回
            </button>
            <button
              onClick={() => setShowNextStepModal(true)}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-[#00f2ea] to-[#7d00ff] text-black rounded-md shadow-[0_0_10px_rgba(0,242,234,0.4)] hover:brightness-110 transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">play_circle</span>
              生成视频
            </button>
            <div className="ml-4 h-8 w-8 rounded-full bg-slate-800 overflow-hidden border border-white/20 ring-1 ring-black">
              <img alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2U9MK9erwVfZa23HK-ysrpAKtDc4pfvDUVcPBRIYINFECFX4FGR6xYQX63GXfWyg_4czgJn6bl1foWrZnaEePTOhNlCL1Bu6Brh1tlFpbmAk4f6WxpNeRm0Vb47siUDmWn_xMwr4Nu7TzgN70eABzuA-l-0ZDJa_TxZB0sxDyg2zv5Q6HORVvuuqPF8yU8idodH7K1Dp1ghE-oR1w5ndiQtiWbEecfMzhG3d7ofK0GDBHtUNeyPlUbaIBgqDK30-jruLrygaZEaa3" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
        {/* Left Sidebar - Scene List */}
        <aside id="tour-scene-list" className="w-24 md:w-32 flex-shrink-0 border-r border-white/5 glass-panel flex flex-col z-30 bg-black/40">
          <div className="p-3 border-b border-white/5 text-center">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">分镜列表</span>
          </div>
          <div className="overflow-y-auto no-scrollbar p-2 space-y-3 flex-1">
            {/* Scene 01 - Active */}
            <div className="group cursor-pointer relative">
              <div className="rounded-lg border-2 border-[#00f2ea] bg-black overflow-hidden aspect-square relative transition-all duration-300 shadow-[0_0_15px_rgba(0,242,234,0.15)]">
                <img alt="Scene 01" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-center">
                  <span className="text-[10px] font-mono text-[#00f2ea] font-bold">01</span>
                </div>
              </div>
              <div className="w-1 h-1 rounded-full bg-[#00f2ea] absolute -left-2 top-1/2 -translate-y-1/2"></div>
            </div>

            {/* Empty Scene Slots */}
            {[2, 3].map((num) => (
              <div key={num} className="group cursor-pointer relative">
                <div className="rounded-lg border-2 border-white/5 hover:border-white/20 bg-white/5 overflow-hidden aspect-square relative transition-all duration-300">
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <span className="material-symbols-outlined">image</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 p-1 text-center">
                    <span className="text-[10px] font-mono text-white/40">{String(num).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button */}
            <button className="w-full aspect-square rounded-lg border border-dashed border-white/10 flex items-center justify-center hover:border-[#00f2ea]/50 hover:bg-white/5 transition-all group">
              <span className="material-symbols-outlined text-white/20 group-hover:text-[#00f2ea]">add</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-black/20 relative">
          <div className="flex-1 p-6 flex flex-col justify-center items-center min-h-0 relative overflow-hidden">
            <div className="w-full max-w-4xl flex flex-col gap-2 h-full">
              {/* Preview Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00f2ea] animate-pulse shadow-[0_0_8px_rgba(0,242,234,0.6)]"></span>
                  <span className="text-xs font-bold text-white tracking-wider">分镜画面预览</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-white/40">1920x1080</span>
                  <span className="text-[10px] font-mono text-[#00f2ea]">00:00:05</span>
                </div>
              </div>

              {/* Video Preview */}
              <div className="flex-1 rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl relative group">
                <img alt="Preview" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIbBdybaPfL7TSqNTy_BP0qVrhsazO28Y7G_uO43knHoBL1Up6CZKJ_DWV6wCa4W8hcT9axDtrWgxmtdY00prx9HehkRiOwraNwm76KBu8iOql35NCWl4wcdsUJ7KaSHiLEps0RTA-i-a4vBpxuB95bjfetTwdc_6zIjeZRMuBrM_DttMyaAJzXfaODE0VCydNJxnsuS2DS1fPkUZgYaie5VL23DxNI7X2Dg_ZWF12uxcdMkEBn0-cRMzB6X4B33Di_0e-J5z6kROw" />
              </div>
            </div>
          </div>

          {/* Bottom Input Area */}
          <div className="flex-shrink-0 glass-panel border-t border-white/10 p-6 z-20">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Video Config Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00f2ea] text-sm">settings</span>
                  <span className="text-xs font-bold text-white/80 tracking-wider uppercase">视频配置</span>
                </div>
                <span className="text-[10px] text-white/30 italic">当前视频配置需点击生成视频后生效</span>
              </div>

              <div id="tour-scene-prompt" className="flex gap-4">
                {/* Upload Box */}
                <div className="upload-box w-32 h-32 flex-shrink-0 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-2 group relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="上传参考图片"
                    onChange={handleReferenceImageChange}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00f2ea]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {referenceImage ? (
                    <>
                      <img
                        alt="参考图片预览"
                        src={referenceImage.url}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-1 left-1 right-1 px-1.5 py-1 rounded bg-black/60 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[10px] text-white/80 truncate">{referenceImage.file.name}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-white/30 text-3xl group-hover:text-[#00f2ea] transition-colors">add_photo_alternate</span>
                      <span className="text-xs text-white/40 text-center font-medium group-hover:text-[#00f2ea] transition-colors">
                        附件 / 参考<br/><span className="text-[10px] opacity-50">Upload Ref</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Prompt Textarea */}
                <div className="flex-1 relative group/textarea">
                  <div className="absolute top-2 left-3 z-10 pointer-events-none">
                    <label className="text-[10px] font-bold text-[#00f2ea] tracking-widest uppercase">分镜视频提示词</label>
                  </div>
                  <textarea
                    ref={videoPromptRef}
                    className="w-full h-32 pt-8 p-3 text-sm glass-input rounded-lg outline-none resize-none leading-relaxed text-white/90 font-light focus:ring-1 focus:ring-[#00f2ea]/50"
                    placeholder="描述镜头的运动方式、参考风格或特定要求..."
                  >@图片01 参考@图片01中的讯飞智作logo，参考@视频01 视频中的文本呈现的动态效果。让音视频创作更简单，AI赋能。</textarea>
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button className="p-1.5 rounded-md hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Optimize">
                      <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Model Selector */}
                  <div ref={modelDropdownRef} className="relative">
                    <button
                      onClick={() => {
                        setShowModelDropdown(!showModelDropdown)
                        setShowAspectRatioDropdown(false)
                      }}
                      className="flex items-center gap-2 bg-white/5 rounded-full py-1.5 px-3 border border-white/10 hover:border-[#00f2ea]/50 transition-all cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-[#00f2ea]/80 text-sm group-hover:text-[#00f2ea]">neurology</span>
                      <span className="text-xs text-white font-medium">{selectedModel}</span>
                      <span className="material-symbols-outlined text-white/40 text-xs group-hover:text-[#00f2ea]">expand_more</span>
                    </button>

                    {/* Model Dropdown */}
                    {showModelDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-[#1A1B23] border border-white/10 shadow-2xl overflow-hidden z-[9999]">
                        {(['Seedance 2.0 Fast', 'Veo', 'Kling 3.0'] as Model[]).map((model) => (
                          <button
                            key={model}
                            onClick={() => {
                              setSelectedModel(model)
                              setShowModelDropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                              selectedModel === model
                                ? 'bg-[#00f2ea]/10 text-[#00f2ea] font-medium'
                                : 'text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{selectedModel === model ? 'check_circle' : 'circle'}</span>
                            <span>{model}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div ref={aspectRatioDropdownRef} className="relative">
                    <button
                      onClick={() => {
                        setShowAspectRatioDropdown(!showAspectRatioDropdown)
                        setShowModelDropdown(false)
                      }}
                      className="flex items-center gap-2 bg-white/5 rounded-full py-1.5 px-3 border border-white/10 hover:border-[#00f2ea]/50 transition-all cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-[#00f2ea]/80 text-sm group-hover:text-[#00f2ea]">aspect_ratio</span>
                      <span className="text-xs text-white font-medium">{selectedAspectRatio} 比例</span>
                      <span className="material-symbols-outlined text-white/40 text-xs group-hover:text-[#00f2ea]">expand_more</span>
                    </button>

                    {/* Aspect Ratio Dropdown */}
                    {showAspectRatioDropdown && (
                      <div className="absolute bottom-full left-0 mb-2 w-40 rounded-xl bg-[#1A1B23] border border-white/10 shadow-2xl overflow-hidden z-[9999]">
                        {(['16:9', '4:3', '3:4', '9:16'] as AspectRatio[]).map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => {
                              setSelectedAspectRatio(ratio)
                              setShowAspectRatioDropdown(false)
                            }}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                              selectedAspectRatio === ratio
                                ? 'bg-[#00f2ea]/10 text-[#00f2ea] font-medium'
                                : 'text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="material-symbols-outlined text-sm">{selectedAspectRatio === ratio ? 'check_circle' : 'circle'}</span>
                            <span>{ratio}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Duration Selector */}
                  <div ref={durationSelectorRef} className="relative">
                    <button
                      onClick={() => {
                        setShowDurationSelector(!showDurationSelector)
                        setShowModelDropdown(false)
                        setShowAspectRatioDropdown(false)
                      }}
                      className="flex items-center gap-2 bg-white/5 rounded-full py-1.5 px-3 border border-white/10 hover:border-[#00f2ea]/50 transition-all cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-[#00f2ea]/80 text-sm group-hover:text-[#00f2ea]">timer</span>
                      <span className="text-xs text-white font-medium">{duration}s</span>
                      <span className="material-symbols-outlined text-white/40 text-xs group-hover:text-[#00f2ea]">expand_more</span>
                    </button>

                    {/* Duration Slider Panel */}
                    {showDurationSelector && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-[#1A1B23] border border-white/10 shadow-2xl overflow-hidden z-[9999] p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-slate-400 font-medium">视频时长</span>
                          <span className="text-sm text-[#00f2ea] font-bold">{duration}s</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="15"
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-4
                            [&::-webkit-slider-thumb]:h-4
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-[#00f2ea]
                            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(0,242,234,0.5)]
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:hover:scale-110
                            [&::-webkit-slider-thumb]:transition-transform
                            [&::-moz-range-thumb]:w-4
                            [&::-moz-range-thumb]:h-4
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-[#00f2ea]
                            [&::-moz-range-thumb]:border-0
                            [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(0,242,234,0.5)]
                            [&::-moz-range-thumb]:cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #00f2ea 0%, #00f2ea ${((duration - 4) / 11) * 100}%, rgba(255,255,255,0.1) ${((duration - 4) / 11) * 100}%, rgba(255,255,255,0.1) 100%)`
                          }}
                        />
                        <div className="flex justify-between mt-2">
                          <span className="text-[10px] text-slate-500">4s</span>
                          <span className="text-[10px] text-slate-500">15s</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Scene Config */}
        <aside id="tour-scene-config" className="w-80 flex-shrink-0 border-l border-white/5 glass-panel flex flex-col z-30">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/80">分镜画面配置</h2>
            <span className="px-2 py-0.5 rounded bg-[#00f2ea]/10 text-[#00f2ea] text-[10px] font-bold border border-[#00f2ea]/20">分镜 01</span>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto no-scrollbar flex-1">
            {/* Visual Description */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-start">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  画面描述
                </label>
              </div>
              <div className="relative group/vis-prompt">
                <textarea
                  ref={visualPromptRef}
                  className="w-full min-h-[160px] p-4 text-sm glass-input rounded-lg outline-none resize-none leading-relaxed text-white font-light border-white/10 focus:border-[#00f2ea]/50 transition-colors"
                  spellCheck="false"
                >电影感大特写，一位未来派风格的宇航员注视着星云，头盔面罩反射着深蓝与紫色的光芒，极高画质，虚幻引擎5渲染。</textarea>
                <div className="absolute bottom-2 right-2 left-2 flex justify-between items-center opacity-0 group-hover/vis-prompt:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors" title="Enhance">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-white/20">68/500</span>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="flex items-center gap-3 pt-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#00f2ea]/20 to-[#7d00ff]/20 border border-[#00f2ea]/30 hover:border-[#00f2ea]/60 text-white text-xs font-medium transition-all hover:shadow-[0_0_15px_rgba(0,242,234,0.2)] group">
                  <span className="material-symbols-outlined text-sm text-[#00f2ea] group-hover:scale-110 transition-transform">autorenew</span>
                  <span>重新生成分镜</span>
                </button>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="material-symbols-outlined text-sm text-accent-purple animate-pulse" style={{ fontVariationSettings: '"FILL" 1' }}>stars</span>
                  <span className="text-xs text-white font-bold">20</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5"></div>

            {/* History Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">history</span>
                历史生成
              </label>
              <div className="grid grid-cols-2 gap-2">
                {historyImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-[#00f2ea]/50 transition-all aspect-square bg-black"
                  >
                    <img
                      src={img}
                      alt={`历史图片 ${idx + 1}`}
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = img
                          link.download = `storyboard_${idx + 1}.jpg`
                          link.click()
                        }}
                        className="p-2 rounded-full bg-[#00f2ea]/20 hover:bg-[#00f2ea]/40 border border-[#00f2ea] transition-all"
                      >
                        <span className="material-symbols-outlined text-[#00f2ea] text-xl">download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 下一步操作弹窗 */}
      {showNextStepModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowNextStepModal(false) }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="next-step-title"
        >
          <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-[#13141a] border border-white/10 shadow-2xl overflow-hidden">
            {/* 顶部光效 */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f2ea]/60 to-transparent"></div>

            {/* 标题区 */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f2ea]/20 to-[#7d00ff]/20 border border-[#00f2ea]/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#00f2ea] text-base" aria-hidden="true">check_circle</span>
                </div>
                <h2 id="next-step-title" className="text-base font-bold text-white">分镜脚本已就绪，请选择下一步操作</h2>
              </div>
            </div>

            {/* 选项区 */}
            <div className="px-8 pb-6 space-y-3">
              {/* 选项1：进入专业剪辑 */}
              <div className="rounded-xl border border-[#00f2ea]/30 bg-[#00f2ea]/5 p-4 flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-[#00f2ea]/10 border border-[#00f2ea]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[#00f2ea] text-lg" aria-hidden="true">movie_edit</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">进入专业剪辑</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00f2ea]/20 text-[#00f2ea] border border-[#00f2ea]/30">推荐</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">支持逐个分镜优化生成视频效果，自由度更高，成片效果更有保障</p>
                </div>
              </div>

              {/* 选项2：直接生成视频 */}
              <div className="rounded-xl border bg-white/[0.03] p-4 flex gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-slate-400 text-lg" aria-hidden="true">queue_play_next</span>
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-white/80 block mb-1">直接生成视频</span>
                  <p className="text-xs text-slate-500 leading-relaxed">后台自动排队合成全部片段。耗时较长，您可在"个人中心 - 我的作品"查看进度</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-amber-400" style={{ fontVariationSettings: '"FILL" 1' }} aria-hidden="true">stars</span>
                    <span className="text-xs font-bold text-amber-400">消耗 600 算力</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 按钮组 */}
            <div className="px-8 pb-8 flex gap-3">
              <button
                onClick={() => navigate('/professional-edit')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00f2ea] to-[#7d00ff] text-black text-sm font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,242,234,0.25)] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">movie_edit</span>
                前往专业剪辑
              </button>
              <button
                onClick={() => setShowNextStepModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/15 text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-white/25 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">queue_play_next</span>
                确认直接生成
              </button>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowNextStepModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              aria-label="关闭弹窗"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryboardPage
