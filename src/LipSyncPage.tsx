import { useState, useEffect } from 'react'

// 状态机类型定义
type LipSyncStage = 'idle' | 'uploading' | 'parsing' | 'editing' | 'generating'

// 任务类型定义
interface LipSyncTask {
  id: string
  name: string
  status: 'processing' | 'success' | 'failed'
  progress: number
  targetLanguage: string
  duration: string
  createdAt: number
  thumbnail?: string
  downloadUrl?: string
}

export default function LipSyncPage() {
  const [stage, setStage] = useState<LipSyncStage>('idle')
  const [showDebug, setShowDebug] = useState(false)
  const [tasks, setTasks] = useState<LipSyncTask[]>([])
  const [activeTab, setActiveTab] = useState<'recommend' | 'mine'>('recommend')

  // 自动状态流转
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (stage === 'uploading') {
      timer = setTimeout(() => setStage('parsing'), 2000)
    } else if (stage === 'parsing') {
      timer = setTimeout(() => setStage('editing'), 3000)
    }

    return () => clearTimeout(timer)
  }, [stage])

  // 进度模拟
  useEffect(() => {
    const timer = setInterval(() => {
      setTasks(prev => prev.map(task => {
        if (task.status === 'processing' && task.progress < 100) {
          const newProgress = Math.min(task.progress + Math.random() * 5, 100)
          return {
            ...task,
            progress: newProgress,
            status: newProgress >= 100 ? 'success' : 'processing'
          }
        }
        return task
      }))
    }, 300)

    return () => clearInterval(timer)
  }, [])

  // 键盘 D 键显示/隐藏调试器
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') setShowDebug(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* 开发用：状态切换器（按 D 键显示/隐藏） */}
      {showDebug && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#141414] border border-white/20 rounded-xl p-4 shadow-2xl">
          <div className="text-xs text-slate-400 mb-2">开发调试 - 状态切换</div>
          <div className="flex gap-2">
            {(['idle', 'uploading', 'parsing', 'editing', 'generating'] as LipSyncStage[]).map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`px-3 py-1 text-xs rounded ${
                  stage === s
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-2 gap-12 items-center">
            {/* 左侧：标题 + 上传/编辑模块 */}
            <LeftSection
              stage={stage}
              setStage={setStage}
              setActiveTab={setActiveTab}
              onCreateTask={(task) => setTasks(prev => [task, ...prev])}
            />

            {/* 右侧：视频展示区 */}
            <RightVideoSection stage={stage} />
          </div>
        </div>

        {/* Tab 区 - 仅 idle 时显示 */}
        {stage === 'idle' && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <TabSection activeTab={activeTab} setActiveTab={setActiveTab} tasks={tasks} setTasks={setTasks} />
          </div>
        )}
      </main>
    </div>
  )
}

// 左侧区域 - 根据状态切换
function LeftSection({ stage, setStage, setActiveTab, onCreateTask }: {
  stage: LipSyncStage
  setStage: (stage: LipSyncStage) => void
  setActiveTab: (tab: 'mine' | 'recommend') => void
  onCreateTask: (task: LipSyncTask) => void
}) {
  if (stage === 'idle') {
    return <LeftIdle onUpload={() => setStage('uploading')} />
  }

  // 上传中、解析中、编辑、生成 - 显示操作模块
  return (
    <div className="space-y-6">
      {stage === 'uploading' && <UploadingProgress />}
      {stage === 'parsing' && <ParsingProgress />}
      {stage === 'editing' && <EditingModule onGenerate={() => {
        // 创建任务
        const newTask: LipSyncTask = {
          id: Date.now().toString(),
          name: '示例视频.mp4',
          status: 'processing',
          progress: 0,
          targetLanguage: '英语 (EN)',
          duration: '02:30',
          createdAt: Date.now()
        }
        onCreateTask(newTask)
        // 立即回到 idle + 切换到「我的」Tab
        setStage('idle')
        setActiveTab('mine')
      }} onBack={() => setStage('idle')} />}
    </div>
  )
}

// 左侧空态 - 标题 + 上传
function LeftIdle({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="space-y-8">
      {/* 标题区 */}
      <div className="space-y-4">
        <h1 className="text-5xl font-bold leading-tight">
          AI 智能对口型
        </h1>
        <p className="text-2xl text-[#0066FF] font-medium">
          多语种视频配音，让你的内容走向全球！
        </p>
        <p className="text-lg text-slate-400 leading-relaxed">
          比传统配音更易用、更安全！从整理信息、写内容、看数据到执行
          行网页任务，用更轻松的方式，帮你完成各种多语种视频制作任务。
        </p>
      </div>

      {/* 上传按钮 */}
      <button
        onClick={onUpload}
        className="px-8 py-4 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-xl text-lg font-medium hover:opacity-90 transition-opacity"
      >
        立即上传视频
      </button>
    </div>
  )
}

// 右侧视频展示区
function RightVideoSection({ stage }: { stage: LipSyncStage }) {
  // idle/uploading/parsing 时显示案例视频
  if (stage === 'idle' || stage === 'uploading' || stage === 'parsing') {
    return (
      <div className="relative">
        <div className="aspect-[4/5] bg-gradient-to-br from-[#141414] to-[#1a1a1a] rounded-3xl overflow-hidden shadow-2xl">
          {/* 案例视频占位 */}
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl">🎬</div>
              <p className="text-slate-400">案例视频展示</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // editing/generating 时显示用户上传的视频
  return (
    <div className="relative">
      <div className="aspect-video bg-[#141414] rounded-2xl overflow-hidden shadow-2xl">
        {/* 用户上传的视频 */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">▶️</div>
            <p className="text-slate-400">您上传的视频</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 上传进度
function UploadingProgress() {
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold">上传中...</h3>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#0066FF] to-[#60A5FA] w-2/3 transition-all duration-300" />
      </div>
      <p className="text-sm text-slate-400">66% · 正在上传视频文件</p>
    </div>
  )
}

// 解析进度
function ParsingProgress() {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">视频解析中...</h3>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#0066FF] border-t-transparent animate-spin" />
        <div className="flex-1">
          <p className="text-slate-400">正在识别语音和台词</p>
          <p className="text-sm text-slate-500 mt-1">预计需要 30 秒</p>
        </div>
      </div>
    </div>
  )
}

// 台词编辑模块
function EditingModule({ onGenerate, onBack }: { onGenerate: () => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">编辑台词</h3>
        <button
          onClick={onBack}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          ← 返回重新上传
        </button>
      </div>

      {/* 语言选择 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400 min-w-[80px]">目标语言:</span>
        <select className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
          <option>英语 (EN)</option>
          <option>日语 (JA)</option>
          <option>韩语 (KO)</option>
          <option>俄语 (RU)</option>
          <option>西班牙语 (ES)</option>
          <option>阿拉伯语 (AR)</option>
          <option>粤语 (YUE)</option>
        </select>
      </div>

      {/* 台词列表 */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">讲话人 {i}</span>
              <span className="text-xs text-slate-500">00:00:0{i} - 00:00:0{i+2}</span>
            </div>
            <textarea
              className="w-full bg-transparent border-0 text-sm resize-none focus:outline-none"
              rows={2}
              defaultValue="这是一段示例台词，可以直接编辑修改..."
            />
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">预计消耗算力</span>
          <span className="text-[#0066FF] font-mono font-medium">50</span>
        </div>
        <button
          onClick={onGenerate}
          className="w-full py-3 bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          生成视频
        </button>
      </div>
    </div>
  )
}

// 生成提交模块
function GeneratingModule({ onReset }: { onReset: () => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4 py-8">
        <div className="text-6xl">✓</div>
        <h3 className="text-2xl font-bold">任务已提交</h3>
        <p className="text-slate-400">视频正在生成中，可在「我的」Tab 查看进度</p>
      </div>
      <button
        onClick={onReset}
        className="w-full py-3 bg-[#0066FF] rounded-xl font-medium hover:opacity-90 transition-opacity"
      >
        新建任务
      </button>
    </div>
  )
}

// Tab 区组件
function TabSection({ activeTab, setActiveTab, tasks, setTasks }: {
  activeTab: 'recommend' | 'mine'
  setActiveTab: (tab: 'recommend' | 'mine') => void
  tasks: LipSyncTask[]
  setTasks: React.Dispatch<React.SetStateAction<LipSyncTask[]>>
}) {
  const processingCount = tasks.filter(t => t.status === 'processing').length

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
          className={`pb-3 text-lg font-medium relative ${
            activeTab === 'mine'
              ? 'text-white border-b-2 border-[#0066FF]'
              : 'text-slate-400'
          }`}
        >
          我的
          {processingCount > 0 && (
            <span className="absolute -top-1 -right-4 w-2 h-2 rounded-full bg-[#22d3ee] animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'recommend' && <RecommendTab />}
      {activeTab === 'mine' && <MineTab tasks={tasks} setTasks={setTasks} />}
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
function MineTab({ tasks, setTasks }: {
  tasks: LipSyncTask[]
  setTasks: React.Dispatch<React.SetStateAction<LipSyncTask[]>>
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🎬</div>
        <p className="text-slate-400 text-lg">还没有对口型任务</p>
        <p className="text-slate-500 text-sm mt-2">在上方上传视频开始创作</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))} />
      ))}
    </div>
  )
}

// 任务卡片
function TaskCard({ task, onDelete }: { task: LipSyncTask; onDelete: (id: string) => void }) {
  const statusConfig = {
    processing: { label: '处理中', color: 'bg-yellow-500/20 text-yellow-400' },
    success: { label: '成功', color: 'bg-green-500/20 text-green-400' },
    failed: { label: '失败', color: 'bg-red-500/20 text-red-400' }
  }

  const { label, color } = statusConfig[task.status]
  const time = new Date(task.createdAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="flex items-center gap-4 p-4 bg-[#141414] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      {/* 缩略图 */}
      <div className="w-28 h-16 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative">
        <span className="text-2xl">🎬</span>
        {/* 处理中：叠加进度 */}
        {task.status === 'processing' && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#0066FF" strokeWidth="3"
                strokeDasharray={`${task.progress * 0.88} 88`} strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.3s ease' }} />
            </svg>
            <span className="absolute text-xs font-mono text-white">{Math.round(task.progress)}%</span>
          </div>
        )}
      </div>

      {/* 信息区 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium truncate">{task.name}</span>
          <span className={`px-2 py-0.5 text-xs rounded-full ${color}`}>{label}</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#0066FF]/20 text-[#60A5FA]">{task.targetLanguage}</span>
        </div>
        <div className="text-xs text-slate-500">
          {task.duration} · {time}
        </div>

        {/* 处理中：进度条 */}
        {task.status === 'processing' && (
          <div className="mt-2 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0066FF] to-[#60A5FA] rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.status === 'success' && (
          <>
            <button className="px-3 py-1.5 text-xs bg-[#0066FF] rounded-lg hover:opacity-90">下载</button>
            <button className="px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/10">重新编辑</button>
          </>
        )}
        {task.status === 'failed' && (
          <button className="px-3 py-1.5 text-xs bg-white/5 rounded-lg hover:bg-white/10">重新编辑</button>
        )}
        {task.status !== 'processing' && (
          <button
            onClick={() => onDelete(task.id)}
            className="px-3 py-1.5 text-xs text-red-400 bg-white/5 rounded-lg hover:bg-red-500/10"
          >
            删除
          </button>
        )}
      </div>
    </div>
  )
}
