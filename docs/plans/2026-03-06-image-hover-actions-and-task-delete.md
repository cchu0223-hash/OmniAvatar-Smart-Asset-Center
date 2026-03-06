# Image Hover Actions & Task Delete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add per-image hover actions (bookmark/download) and lightbox on main page, remove task-level bookmark, add task delete, and add delete button to professional edit smart materials.

**Architecture:** All changes are pure UI/state updates within existing React components. No new files needed. `App.tsx` gets hover state per image cell, lightbox extended to accept a plain URL, and task delete handler. `ProfessionalEditPage.tsx` converts the `SMART_MATERIALS` constant to local state and adds delete button in hover overlay.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Material Symbols icons

---

### Task 1: Per-image hover actions + lightbox in App.tsx image task card

**Files:**
- Modify: `src/App.tsx`

**Context:**
Image task cards render 4 thumbnails in a `grid grid-cols-4 gap-2` at lines ~826-832. Currently thumbnails have no interaction. We need:
1. A new state `hoveredImageKey: string | null` to track which cell is hovered (key = `${taskId}-${index}`)
2. Each image cell gets `onMouseEnter`/`onMouseLeave` to set/clear that state
3. On hover, show top-right bookmark button and bottom-right download button
4. Clicking the image itself opens lightbox (extend lightbox to accept raw `{url, prompt}` or reuse `HistoryItem`)

**Step 1: Add `hoveredImageKey` state**

In the state block (around line 63), add:
```tsx
const [hoveredImageKey, setHoveredImageKey] = useState<string | null>(null)
```

**Step 2: Add a lightbox state that accepts a plain image URL**

The existing `lightboxItem` is typed as `HistoryItem | null`. Add a second simpler lightbox state for direct image URLs:
```tsx
const [imagePreview, setImagePreview] = useState<{ url: string; prompt: string } | null>(null)
```

**Step 3: Replace the image grid in the completed image task card**

Find the block starting at line ~826:
```tsx
<div className="grid grid-cols-4 gap-2">
  {task.thumbnails.map((thumb, i) => (
    <div key={i} className="rounded-lg overflow-hidden border border-white/5 group/img">
      <img src={thumb} alt={`${task.prompt} #${i + 1}`} className="w-full aspect-square object-cover transition-transform duration-300 group-hover/img:scale-105" loading="lazy" />
    </div>
  ))}
</div>
```

Replace with:
```tsx
<div className="grid grid-cols-4 gap-2">
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
                onClick={(e) => { e.stopPropagation() }}
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
```

**Step 4: Add the imagePreview lightbox**

After the existing `{lightboxItem && (...)}` block (around line 1070), add:
```tsx
{/* Single-image preview lightbox */}
{imagePreview && (
  <div
    className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
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
```

**Step 5: Verify visually** — Generate an image task, wait for completion, hover each thumbnail. Bookmark appears top-right, download bottom-right. Click thumbnail — preview lightbox opens. Click outside or X to close.

---

### Task 2: Remove task-level "收藏为我的素材" button from both card types

**Files:**
- Modify: `src/App.tsx`

**Context:** There are two "收藏为我的素材" buttons:
1. Image task card actions (~line 877-883)
2. Video task card actions (~line 955-961)

**Step 1: Delete image card bookmark button**

Find and delete this block in the image task card actions:
```tsx
<button
  onClick={(e) => e.stopPropagation()}
  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-accent-purple/10 hover:text-accent-purple transition-all"
>
  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>bookmark_add</span>
  收藏为我的素材
</button>
```

**Step 2: Delete video card bookmark button**

Find and delete the equivalent block in the video task card actions:
```tsx
<button
  onClick={(e) => e.stopPropagation()}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-accent-purple/10 hover:text-accent-purple transition-all"
>
  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>bookmark_add</span>
  收藏为我的素材
</button>
```

**Step 3: Verify** — Task cards no longer show the task-level bookmark button.

---

### Task 3: Add delete button to image and video task cards

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add `handleDeleteTask` function**

After `handleGenerate` (around line 296), add:
```tsx
const handleDeleteTask = (taskId: string) => {
  setTaskQueue(prev => prev.filter(t => t.id !== taskId))
  if (selectedWorkId === taskId) setSelectedWorkId(null)
}
```

**Step 2: Add delete button to image task card actions**

In the image task card actions row (after the "再次生成" button), add:
```tsx
<button
  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }}
  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-[10px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ml-auto"
>
  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>delete</span>
  删除
</button>
```

**Step 3: Add delete button to video task card actions**

In the video task card actions row (after "再次生成"), add:
```tsx
<button
  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id) }}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-[11px] text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ml-auto"
>
  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
  删除
</button>
```

**Step 4: Add delete button to failed task card**

In the failed task card (around line 970-982), add a delete button:
```tsx
<button
  onClick={() => handleDeleteTask(task.id)}
  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all"
  aria-label="删除"
>
  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
</button>
```
Add this button inside the flex container next to the `<span className="text-[10px] text-slate-600">` timestamp.

**Step 5: Verify** — Click delete on an image task, video task, and failed task. Each disappears from the list.

---

### Task 4: Add delete to smart materials in ProfessionalEditPage.tsx

**Files:**
- Modify: `src/ProfessionalEditPage.tsx`

**Context:** `SMART_MATERIALS` is currently a module-level constant (line 41). To support deletion, convert it to component state.

**Step 1: Convert `SMART_MATERIALS` to state**

Inside `ProfessionalEditPage` function (after line 94), add:
```tsx
const [smartMaterials, setSmartMaterials] = useState<SmartMaterial[]>(SMART_MATERIALS)
```

Keep the `SMART_MATERIALS` const as the initial value. Add a delete handler:
```tsx
const handleDeleteSmartMaterial = (id: number) => {
  setSmartMaterials(prev => prev.filter(m => m.id !== id))
}
```

**Step 2: Update image smart materials grid (ImageGeneratePanel)**

Find the image grid at ~line 492:
```tsx
{SMART_MATERIALS.filter(m => m.type === 'image').map((item) => (
```
Change to:
```tsx
{smartMaterials.filter(m => m.type === 'image').map((item) => (
```

In the same image card, add a delete button to the bottom-right hover actions alongside the existing use+download buttons:
```tsx
<div className="absolute bottom-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  <button onClick={(e) => { e.stopPropagation(); showToast('已添加到轨道') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="使用">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>add_circle</span>
  </button>
  <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="下载">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>download</span>
  </button>
  <button onClick={(e) => { e.stopPropagation(); handleDeleteSmartMaterial(item.id) }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="删除">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>delete</span>
  </button>
</div>
```

**Step 3: Update video smart materials grid (VideoGeneratePanel)**

Find the video grid at ~line 657:
```tsx
{SMART_MATERIALS.filter(m => m.type === 'video').map((item) => (
```
Change to:
```tsx
{smartMaterials.filter(m => m.type === 'video').map((item) => (
```

Add delete button to the bottom-right hover actions:
```tsx
<div className="absolute bottom-0 right-0 p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
  <button onClick={(e) => { e.stopPropagation(); showToast('已添加到轨道') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="使用">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>add_circle</span>
  </button>
  <button onClick={(e) => { e.stopPropagation(); showToast('已开始下载') }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="下载">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>download</span>
  </button>
  <button onClick={(e) => { e.stopPropagation(); handleDeleteSmartMaterial(item.id) }} className="w-6 h-6 flex items-center justify-center" style={{ borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} aria-label="删除">
    <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>delete</span>
  </button>
</div>
```

**Note:** The `ImageGeneratePanel` and `VideoGeneratePanel` are defined as inner functions inside `ProfessionalEditPage`. They already close over component state so they'll have access to `smartMaterials`, `setSmartMaterials`, and `handleDeleteSmartMaterial` without prop passing.

**Step 4: Verify** — On /professional-edit, hover an image smart material: see delete (trash), use (add_circle), download buttons. Click delete — item disappears. Same for video materials.

---

### Task 5: Commit

```bash
git add src/App.tsx src/ProfessionalEditPage.tsx
git commit -m "feat: per-image hover actions, lightbox, task delete, smart material delete"
```
