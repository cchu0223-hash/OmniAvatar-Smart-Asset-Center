import { useState } from 'react'

// 状态机类型定义
type LipSyncStage = 'idle' | 'uploading' | 'parsing' | 'editing' | 'generating'

export default function LipSyncPage() {
  const [stage, setStage] = useState<LipSyncStage>('idle')

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header 导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#141414] border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <a href="/" className="text-xl font-bold">OmniAvatar</a>
            <a href="/" className="text-sm text-slate-400 hover:text-white">AI素材生成</a>
            <span className="text-sm text-[#0066FF] font-medium">对口型</span>
            <a href="/professional-edit" className="text-sm text-slate-400 hover:text-white">专业剪辑</a>
          </div>

          {/* 右侧 */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full bg-white/5 text-sm">
              <span className="text-slate-400">算力:</span>
              <span className="ml-2 text-white font-mono">48,510</span>
            </div>
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600" />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pt-16">
        {/* 工作区 - 根据 stage 切换 */}
        <div className="max-w-5xl mx-auto px-6 py-12">
          {stage === 'idle' && <HeroSection onUpload={() => setStage('uploading')} />}
          {stage === 'uploading' && <UploadingPanel />}
          {stage === 'parsing' && <ParsingPanel />}
          {stage === 'editing' && <EditingPanel />}
          {stage === 'generating' && <GeneratingPanel />}
        </div>

        {/* Tab 区 - idle 时显示 */}
        {stage === 'idle' && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <TabSection />
          </div>
        )}
      </main>
    </div>
  )
}

// Hero 区组件
function HeroSection({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="text-center space-y-8">
      <h1 className="text-5xl font-bold">AI 智能对口型</h1>
      <p className="text-xl text-slate-400">多语种视频配音，让你的内容走向全球</p>

      {/* 品牌视频占位 */}
      <div className="w-full max-w-3xl mx-auto aspect-video bg-[#141414] rounded-2xl" />

      {/* 上传入口 */}
      <button
        onClick={onUpload}
        className="px-8 py-4 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-xl text-lg font-medium hover:opacity-90"
      >
        上传视频开始
      </button>
    </div>
  )
}

// 上传进度面板
function UploadingPanel() {
  return (
    <div className="text-center space-y-4">
      <div className="text-lg">上传中...</div>
      <div className="w-full max-w-md mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#60A5FA] w-1/2" />
      </div>
    </div>
  )
}

// 解析进度面板
function ParsingPanel() {
  return (
    <div className="text-center space-y-4">
      <div className="w-24 h-24 mx-auto rounded-full border-4 border-[#0066FF] border-t-transparent animate-spin" />
      <div className="text-lg">视频解析中...</div>
    </div>
  )
}

// 台词编辑面板
function EditingPanel() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">编辑台词</h2>
      <div className="p-6 bg-[#141414] rounded-xl">
        <p className="text-slate-400">台词编辑区域</p>
      </div>
    </div>
  )
}

// 生成提交面板
function GeneratingPanel() {
  return (
    <div className="text-center space-y-4">
      <div className="text-lg">任务已提交</div>
      <p className="text-slate-400">可在「我的」Tab 查看进度</p>
      <button className="px-6 py-3 bg-[#0066FF] rounded-xl">新建任务</button>
    </div>
  )
}

// Tab 区组件
function TabSection() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'mine'>('recommend')

  return (
    <div className="space-y-6">
      {/* Tab 切换 */}
      <div className="flex items-center gap-8 border-b border-white/8">
        <button
          onClick={() => setActiveTab('recommend')}
          className={`pb-3 text-lg font-medium ${
            activeTab === 'recommend'
              ? 'text-white border-b-2 border-[#0066FF]'
              : 'text-slate-400'
          }`}
        >
          推荐
        </button>
        <button
          onClick={() => setActiveTab('mine')}
          className={`pb-3 text-lg font-medium ${
            activeTab === 'mine'
              ? 'text-white border-b-2 border-[#0066FF]'
              : 'text-slate-400'
          }`}
        >
          我的
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'recommend' && <RecommendTab />}
      {activeTab === 'mine' && <MineTab />}
    </div>
  )
}

// 推荐 Tab
function RecommendTab() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="aspect-video bg-[#141414] rounded-xl" />
      ))}
    </div>
  )
}

// 我的 Tab
function MineTab() {
  return (
    <div className="space-y-4">
      <p className="text-center text-slate-400 py-12">还没有作品</p>
    </div>
  )
}
