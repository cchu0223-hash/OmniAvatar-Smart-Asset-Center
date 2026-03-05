# V2 Homepage Redesign Design

## Overview

Redesign the homepage (`/`, App.tsx) to:
1. Remove long video and digital human modules
2. Rename short video to "视频生成", add "图片生成" module
3. Implement capsule-style bottom control bar with popup menus
4. Add waterfall history grid above input area
5. Add skeleton loading and empty state

## Page Layout (top to bottom)

```
┌─────────────────────────────────────────┐
│  Header (logo + credits + avatar)       │  ← Keep as-is
├─────────────────────────────────────────┤
│  Hero text (gradient title + subtitle)  │  ← Keep as-is
├─────────────────────────────────────────┤
│                                         │
│  Waterfall History Grid                 │  ← NEW
│  (mixed image+video cards, infinite     │
│   scroll, skeleton loading, empty state)│
│                                         │
├─────────────────────────────────────────┤
│  Input Panel (textarea + ref upload)    │  ← Keep as-is
├─────────────────────────────────────────┤
│  Capsule Control Bar                    │  ← REDESIGN
│  [图片生成][视频生成] | params... [生成] │
├─────────────────────────────────────────┤
│  Footer (3 nav links)                   │  ← Keep as-is
└─────────────────────────────────────────┘
```

## 1. Capsule Control Bar

### Layout
- Single horizontal bar with glass-panel styling
- **Left zone**: Two capsule buttons for category switching
  - `图片生成` (image icon)
  - `视频生成` (video icon)
  - Active state: filled gradient background, inactive: transparent with border
- **Divider**: Subtle vertical line (white/10% opacity)
- **Right zone**: Dynamic parameter capsules based on selected category
- **Right end**: Generate button with gradient

### Parameter capsules by category

**图片生成 (Image Generation):**
- 比例: 1:1, 3:4, 4:3, 16:9, 9:16
- 模型: Flux Pro, DALL-E 3, Midjourney V6 (placeholder)
- 分辨率: 720p, 1080p, 2K
- Credits: 50

**视频生成 (Video Generation):**
- 比例: 3:4, 4:3, 16:9, 9:16
- 模型: Seedance 2.0, Vidu 2.0, Veo 3.0 (keep from V1)
- 时长: 4-15s slider
- 分辨率: 480p, 720p, 1080p, 2K
- Credits: 100

### Popup Menu Interaction
- Click a parameter capsule → glass-effect menu animates upward from capsule
- Menu has `backdrop-blur-xl` + dark semi-transparent bg
- Selected option shows checkmark
- Click outside or select option → menu closes with fade-down animation
- Duration slider uses inline popup with slider control

## 2. Waterfall History Grid

### Layout
- Positioned between hero text and input panel
- CSS columns-based masonry (2-4 columns responsive)
- Cards have varying heights based on aspect ratio of content

### Card Design
- Glass panel with rounded corners (12px)
- Thumbnail image/video preview
- Overlay badge: "图片" or "视频" type indicator
- Bottom info: prompt text (truncated), timestamp
- Hover: slight scale + glow border effect

### Loading States
- **Skeleton screen**: Animated shimmer cards matching masonry layout
- **Infinite scroll**: Load 12 items initially, 8 more on scroll
- **Empty state**: Centered SVG illustration + "暂未找到相关内容" text

### Mock Data
- 12+ items mixing image and video types
- Various aspect ratios for natural masonry effect
- Placeholder thumbnails (gradient backgrounds or picsum photos)

## 3. Deletions

Remove from App.tsx:
- `videoMode` state and mode switching logic for 3 modes
- Long video model options (Gemini Pro, DeepSeek R1, 星火Spark)
- Digital human model options (智作2.0)
- Long video duration range (20-120s)
- Digital human specific UI (disabled reference, higher credits)
- "生成分镜" button text conditional

## 4. State Changes

```typescript
// New state
type GenerationCategory = 'image' | 'video'
const [category, setCategory] = useState<GenerationCategory>('image')
const [activePopup, setActivePopup] = useState<string | null>(null)
const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
const [isLoadingHistory, setIsLoadingHistory] = useState(true)
const [hasMoreHistory, setHasMoreHistory] = useState(true)

// Remove state
// videoMode, related model/duration conditionals
```

## 5. Animation Specs

- **Category switch**: 200ms ease-out, params fade-swap with 150ms crossfade
- **Popup menu**: 200ms ease-out slide-up + fade-in, reverse on close
- **Skeleton shimmer**: Existing shimmer keyframe from index.html
- **Card hover**: 150ms scale(1.02) + border glow
- **Infinite scroll**: New cards fade-in staggered 50ms each

## 6. Files Modified

- `src/App.tsx` — All changes concentrated here
- `index.html` — Add skeleton shimmer styles if not already present
