// Shared in-memory smart materials store — synced between App.tsx and ProfessionalEditPage

export type SharedSmartMaterial = {
  id: string
  type: 'image' | 'video'
  url: string
  prompt: string
  ratio?: string
  model?: string
  duration?: number
  source?: 'studio' | 'editor'
}

type Listener = (materials: SharedSmartMaterial[]) => void

let _materials: SharedSmartMaterial[] = [
  { id: 'sm1', type: 'image', url: 'https://picsum.photos/seed/sm1/400/400', prompt: '赛博朋克城市街景', source: 'studio' },
  { id: 'sm2', type: 'image', url: 'https://picsum.photos/seed/sm2/400/300', prompt: '水墨山水画风格', source: 'studio' },
  { id: 'sm3', type: 'video', url: '', prompt: '产品展示动画', ratio: '16:9 宽屏', model: 'KELING 3.0', duration: 8, source: 'studio' },
  { id: 'sm4', type: 'image', url: 'https://picsum.photos/seed/sm4/400/400', prompt: '极简商务海报', source: 'editor' },
  { id: 'sm5', type: 'video', url: '', prompt: '品牌宣传片片段', ratio: '9:16 竖屏', model: 'KELING 2.1', duration: 12, source: 'studio' },
  { id: 'sm6', type: 'image', url: 'https://picsum.photos/seed/sm6/400/300', prompt: '自然风景航拍', source: 'editor' },
  { id: 'sm7', type: 'video', url: '', prompt: '科技感UI动效展示', ratio: '16:9 宽屏', model: 'KELING 3.0', duration: 6, source: 'studio' },
  { id: 'sm8', type: 'video', url: '', prompt: '美食特写慢镜头', ratio: '4:3', model: 'KELING 1.6', duration: 10, source: 'studio' },
]

const _listeners: Set<Listener> = new Set()

const _notify = () => {
  const copy = [..._materials]
  _listeners.forEach(l => l(copy))
}

export const getMaterials = (): SharedSmartMaterial[] => [..._materials]

export const addMaterial = (m: Omit<SharedSmartMaterial, 'id'>): SharedSmartMaterial => {
  const newM: SharedSmartMaterial = { ...m, id: `sm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }
  _materials = [newM, ..._materials]
  _notify()
  return newM
}

export const deleteMaterial = (id: string): void => {
  _materials = _materials.filter(m => m.id !== id)
  _notify()
}

export const subscribe = (listener: Listener): (() => void) => {
  _listeners.add(listener)
  return () => _listeners.delete(listener)
}
