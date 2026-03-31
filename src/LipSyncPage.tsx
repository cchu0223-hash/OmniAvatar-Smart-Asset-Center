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
        {/* Hero 区 - 双列布局 */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 gap-8 items-start">
            {/* 左侧：品牌视频 */}
            <BrandVideo />

            {/* 右侧：上传功能模块 */}
            <UploadModule stage={stage} setStage={setStage} />
          </div>
        </div>

        {/* Tab 区 - 始终显示 */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <TabSection />
        </div>
      </main>
    </div>
  )
}

// 品牌视频组件
function BrandVideo() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-3">AI 智能对口型</h1>
        <p className="text-lg text-slate-400">多语种视频配音，让你的内容走向全球</p>
      </div>

      {/* 品牌视频 */}
      <div className="w-full aspect-video bg-[#141414] rounded-2xl overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/brand-video.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  )
}

// 上传功能模块 - 根据状态切换
function UploadModule({ stage, setStage }: {
  stage: LipSyncStage
  setStage: (stage: LipSyncStage) => void
}) {
  return (
    <div className="bg-[#141414] rounded-2xl p-8 min-h-[500px]">
      {stage === 'idle' && <UploadIdle onUpload={() => setStage('uploading')} />}
      {stage === 'uploading' && <UploadingProgress />}
      {stage === 'parsing' && <ParsingProgress />}
      {stage === 'editing' && <EditingModule />}
      {stage === 'generating' && <GeneratingModule onReset={() => setStage('idle')} />}
    </div>
  )
}

// 上传空态
function UploadIdle({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="w-full border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-[#0066FF] transition-colors cursor-pointer">
        <div className="text-6xl mb-4">📁</div>
        <p className="text-lg mb-2">拖拽视频文件到此处</p>
        <p className="text-sm text-slate-400 mb-4">或</p>
        <button
          onClick={onUpload}
          className="px-6 py-3 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-xl font-medium hover:opacity-90"
        >
          点击上传视频
        </button>
      </div>
      <p className="text-sm text-slate-400">支持 MP4、MOV 格式，≤5分钟，≤500MB</p>
    </div>
  )
}

// 上传进度
function UploadingProgress() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="text-lg font-medium">上传中...</div>
      <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#60A5FA] w-2/3 transition-all" />
      </div>
      <p className="text-sm text-slate-400">66%</p>
    </div>
  )
}

// 解析进度
function ParsingProgress() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="w-20 h-20 rounded-full border-4 border-[#0066FF] border-t-transparent animate-spin" />
      <div className="text-lg font-medium">视频解析中...</div>
      <p className="text-sm text-slate-400">正在识别语音和台词</p>
    </div>
  )
}

// 台词编辑模块
function EditingModule() {
  return (
    <div className="h-full flex flex-col space-y-4">
      <h3 className="text-xl font-bold">编辑台词</h3>

      {/* 语言选择 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">目标语言:</span>
        <select className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
          <option>英语 (EN)</option>
          <option>日语 (JA)</option>
          <option>韩语 (KO)</option>
        </select>
      </div>

      {/* 台词列表 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 bg-white/5 rounded-lg">
            <div className="text-xs text-slate-400 mb-2">讲话人 {i} · 00:00:0{i} - 00:00:0{i+2}</div>
            <textarea
              className="w-full bg-transparent border border-white/10 rounded p-2 text-sm resize-none"
              rows={2}
              defaultValue="这是一段示例台词..."
            />
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="text-sm text-slate-400">预计消耗: 50 算力</div>
        <button className="w-full py-3 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-xl font-medium">
          生成视频
        </button>
      </div>
    </div>
  )
}

// 生成提交模块
function GeneratingModule({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-xl font-medium">✓ 任务已提交</div>
      <p className="text-slate-400">可在「我的」Tab 查看进度</p>
      <button
        onClick={onReset}
        className="px-6 py-3 bg-[#0066FF] rounded-xl font-medium hover:opacity-90"
      >
        新建任务
      </button>
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
