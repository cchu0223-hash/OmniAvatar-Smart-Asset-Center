# V2 Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the homepage to replace the 3-mode video system with a 2-category (image/video) capsule bar, add waterfall history grid above input, and implement popup menus with glass effects.

**Architecture:** All changes in App.tsx (monolithic component pattern from V1). Replace `VideoMode` type system with `GenerationCategory`. Add waterfall grid with mock data, skeleton loading, infinite scroll, and empty state above the input panel. Redesign bottom control bar as left-right capsule layout with upward-popping menus.

**Tech Stack:** React 19, TypeScript, Tailwind CSS (CDN), Material Symbols icons

---

### Task 1: Clean up old mode system and add new types/state

**Files:**
- Modify: `src/App.tsx:1-60`

**Step 1: Replace types and state declarations**

Replace lines 6-8 with:
```typescript
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
}
```

**Step 2: Replace state declarations (lines 19-32)**

Replace with:
```typescript
const [category, setCategory] = useState<GenerationCategory>('image')
const [activePopup, setActivePopup] = useState<string | null>(null)
const [selectedModel, setSelectedModel] = useState<string>('Flux Pro')
const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1')
const [selectedResolution, setSelectedResolution] = useState<Resolution>('1080p')
const [duration, setDuration] = useState(10)
const [isGenerating, setIsGenerating] = useState(false)
const [progress, setProgress] = useState(0)
const [statusIndex, setStatusIndex] = useState(0)
const [inputValue, setInputValue] = useState('')
const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
const [isLoadingHistory, setIsLoadingHistory] = useState(true)
const [hasMoreHistory, setHasMoreHistory] = useState(true)
```

**Step 3: Replace refs (lines 34-38)**

Replace with single ref for popup click-outside:
```typescript
const controlBarRef = useRef<HTMLDivElement>(null)
```

**Step 4: Replace model/duration configs (lines 41-52)**

```typescript
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
```

**Step 5: Replace mode-switch useEffect (lines 54-59)**

```typescript
useEffect(() => {
  const config = categoryConfig[category]
  setSelectedModel(config.models[0])
  setSelectedAspectRatio(config.aspectRatios[0])
  setSelectedResolution(config.resolutions[0])
  if (category === 'video') {
    setDuration(categoryConfig.video.durationRange.default)
  }
}, [category])
```

**Step 6: Replace click-outside handler (lines 61-88)**

```typescript
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
```

**Step 7: Delete old modeConfig object (lines 143-188)**

Remove entirely. Replace `currentConfig` references with `categoryConfig[category]`.

**Step 8: Run dev server to verify no crashes**

Run: `cd /Users/cc/Desktop/ImmersiveWizard && npm run dev`
Expected: App compiles without errors (UI will be broken at this point, that's OK)

**Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: replace 3-mode video system with 2-category (image/video) type system"
```

---

### Task 2: Add mock history data and waterfall grid loading logic

**Files:**
- Modify: `src/App.tsx` (add after state declarations, before return)

**Step 1: Add mock history data generator**

Add after the `exampleTexts` array:
```typescript
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
```

**Step 2: Add history loading effect**

```typescript
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
```

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add mock history data and loading logic for waterfall grid"
```

---

### Task 3: Build waterfall history grid UI

**Files:**
- Modify: `src/App.tsx` (in the return JSX, between Title Section and Input Panel)
- Modify: `index.html` (add skeleton animation styles)

**Step 1: Add skeleton styles to index.html**

Add before the closing `</style>` tag:
```css
/* Skeleton loading animation */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.skeleton-card {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

/* Waterfall grid */
.waterfall-grid {
  columns: 4;
  column-gap: 1rem;
}
@media (max-width: 1024px) { .waterfall-grid { columns: 3; } }
@media (max-width: 768px) { .waterfall-grid { columns: 2; } }

.waterfall-grid > * {
  break-inside: avoid;
  margin-bottom: 1rem;
}

/* Card hover effect */
.history-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.history-card:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(0, 240, 255, 0.15);
}
```

**Step 2: Add waterfall grid JSX between Title Section and Input Panel**

Insert after the `</div>` closing the Title Section (line ~231) and before `{/* Input Panel */}`:

```tsx
{/* Waterfall History Grid */}
<div className="mb-12 w-full">
  {/* Empty state */}
  {!isLoadingHistory && historyItems.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-40">
        <rect x="10" y="25" width="40" height="50" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)" />
        <rect x="60" y="15" width="50" height="40" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)" />
        <rect x="65" y="65" width="40" height="35" rx="8" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="rgba(255,255,255,0.02)" />
        <circle cx="30" cy="45" r="8" stroke="rgba(0,240,255,0.3)" strokeWidth="1.5" fill="none" />
        <path d="M22 60l8-10 10 6 12-8 8 12" stroke="rgba(112,0,255,0.3)" strokeWidth="1.5" fill="none" />
      </svg>
      <p className="text-slate-500 text-sm font-light">暂未找到相关内容</p>
      <p className="text-slate-600 text-xs mt-1">开始创作，作品将在这里展示</p>
    </div>
  ) : (
    <>
      {/* Grid */}
      <div className="waterfall-grid">
        {historyItems.map((item) => (
          <div key={item.id} className="history-card rounded-xl overflow-hidden border border-white/5 bg-white/[0.02] cursor-pointer group">
            {/* Thumbnail */}
            <div className="relative overflow-hidden">
              <img
                src={item.thumbnail}
                alt={item.prompt}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              {/* Type badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md border border-white/10"
                style={{ background: item.type === 'video' ? 'rgba(112,0,255,0.6)' : 'rgba(0,240,255,0.4)' }}>
                <span className="flex items-center gap-1 text-white">
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{item.type === 'video' ? 'videocam' : 'image'}</span>
                  {item.type === 'video' ? '视频' : '图片'}
                </span>
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.prompt}</p>
              <p className="text-[10px] text-slate-600 mt-2">{item.timestamp}</p>
            </div>
          </div>
        ))}

        {/* Skeleton cards while loading */}
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

      {/* Load more trigger */}
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
</div>
```

**Step 3: Run dev server and verify grid renders**

Run: `cd /Users/cc/Desktop/ImmersiveWizard && npm run dev`
Expected: Waterfall grid shows skeleton → 12 cards with images, load more button works

**Step 4: Commit**

```bash
git add src/App.tsx index.html
git commit -m "feat: add waterfall history grid with skeleton loading, empty state, and infinite scroll"
```

---

### Task 4: Redesign control bar as capsule layout with popup menus

**Files:**
- Modify: `src/App.tsx` (replace the entire Control Panel section, lines ~276-518)

**Step 1: Replace the entire Control Panel div**

Replace from `{/* Control Panel */}` to the closing of the generate button section with:

```tsx
{/* Capsule Control Bar */}
<div ref={controlBarRef} className="flex flex-wrap items-center gap-3 pt-2">
  {/* Left Zone: Category Capsules */}
  <div className="flex items-center bg-white/[0.03] rounded-xl border border-white/5 p-1">
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
```

**Step 2: Update textarea placeholder to use new config**

Change `placeholder={currentConfig.placeholder}` to `placeholder={categoryConfig[category].placeholder}`

**Step 3: Add popup animation keyframe to index.html**

Add to the `@media (prefers-reduced-motion: no-preference)` block:
```css
@keyframes popup-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Step 4: Run dev server and verify**

Run: `cd /Users/cc/Desktop/ImmersiveWizard && npm run dev`
Expected:
- Two capsule buttons (图片生成/视频生成) on the left with active state
- Parameter capsules on the right change when switching categories
- Clicking a capsule opens upward popup menu with glass blur
- Duration slider only visible in video mode
- Clicking outside closes popups

**Step 5: Commit**

```bash
git add src/App.tsx index.html
git commit -m "feat: redesign control bar as capsule layout with upward popup menus"
```

---

### Task 5: Final cleanup and polish

**Files:**
- Modify: `src/App.tsx`

**Step 1: Remove all unused old state/refs/functions**

Search for and remove any remaining references to:
- `videoMode`, `setVideoMode`
- `showModeDropdown`, `setShowModeDropdown`
- `showModelDropdown`, `showAspectRatioDropdown`, `showResolutionDropdown`, `showDurationSelector`
- `dropdownRef`, `modelDropdownRef`, `aspectRatioDropdownRef`, `resolutionDropdownRef`, `durationSelectorRef`
- `closeAllDropdowns`
- `modeConfig`, `currentConfig`, `currentModelOptions`, `currentDurationConfig`

**Step 2: Update the hero title text**

Change `高质量视频创作` to `高质量 AI 创作` to reflect both image and video support.
Change subtitle to `从图片生成到视频创作，AI 驱动的一站式内容生产平台`.

**Step 3: Run dev server for final verification**

Run: `cd /Users/cc/Desktop/ImmersiveWizard && npm run dev`
Expected: Full page renders correctly with:
- Hero text updated
- Waterfall grid with skeleton → cards → load more
- Capsule control bar with category switching
- Popup menus with glass effect
- Generate button with correct credits
- No console errors

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "chore: cleanup old mode system remnants and update hero text for V2"
```
