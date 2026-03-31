---
id: prd-5.7.2
title: "OmniAvatar AI素材生成中心 — AI对口型功能集成 v5.7.2"
status: planning
owner: ""
created: 2026-03-31
updated: 2026-03-31
linked-designs: []
linked-epics: []
version: "5.7.2"
supersedes: "prd-2.3"
---

# PRD: OmniAvatar AI素材生成中心 — AI对口型功能集成 v5.7.2

## 背景与目标

基于 V2.3 版本的 AI 素材生成中心，本次迭代将讯飞智作的 AI 对口型能力集成到专业剪辑页面中，实现视频素材的多语种对口型生成功能。

**v5.7.2 目标**：
- 在专业剪辑页面内嵌完整的对口型工作流
- 支持 8 种目标语言的对口型生成（ZH / EN / JA / RU / KO / AR / ES / YUE）
- 新增对口型落地页，展示对口型任务历史和管理
- 专业剪辑页与对口型落地页任务双向同步
- 保持与现有 AI 素材生成功能的设计一致性

**核心价值**：
- 用户无需离开剪辑环境即可完成对口型生成
- 统一的任务管理体验（AI 素材 + 对口型）
- 降低多语种视频制作门槛

---

## 用户场景

### 场景 1：剪辑中快速生成对口型视频

**用户**：短剧出海团队剪辑师
**目标**：将剪辑好的中文短剧片段生成英语对口型版本
**流程**：
1. 在专业剪辑页完成视频粗剪，V1 轨道上有一段 2 分钟的短剧片段
2. 右键 V1 轨道上的视频片段，选择「视频对口型」
3. 左侧面板自动切换至对口型面板，左侧导航栏底部动态出现「对口型」图标
4. 系统直接使用轨道上的视频进行解析（无需重新上传）
5. 解析完成后，面板展示台词编辑区，选择目标语言为英语，微调翻译台词
6. 点击「开始对口型」，V1 轨道上叠加渐变进度条显示生成进度
7. 生成完成后，对口型视频原地替换 V1 轨道片段，预览区自动播放新视频
8. 该任务同时出现在对口型落地页「我的」Tab 任务列表中

### 场景 2：落地页批量处理多语种视频

**用户**：跨境电商运营
**目标**：将产品宣传视频适配英语、日语、韩语三个市场
**流程**：
1. 访问对口型落地页（`/lipsync`），Hero 区展示功能介绍视频
2. 上传中文宣传视频（≤5 分钟），系统自动识别源语言
3. 解析完成，台词面板按讲话人展示带时间轴的台词段落
4. 选择目标语言（英语），确认翻译无误，点击生成
5. 重复步骤 3-4，分别生成日语和韩语版本（3 个独立任务）
6. 在「我的」Tab 查看三个任务进度条，等待完成后批量下载

### 场景 3：推荐案例快速体验

**用户**：首次访问的新用户
**目标**：了解对口型效果并快速体验
**流程**：
1. 进入对口型落地页，Hero 区品牌视频自动播放，了解产品能力
2. 向下滚动，进入推荐 Tab，搜索「短剧」查看对口型案例
3. 点击视频卡片，弹窗左右对比播放原视频与对口型结果
4. 点击「做同款」，系统提示登录
5. 登录后直接进入台词编辑态（源视频为示例视频，台词预填）
6. 选择目标语言，按需修改台词，点击生成
7. 切换至「我的」Tab，查看处理进度

### 场景 4：首次使用引导（剪辑页）

**用户**：首次在剪辑页使用对口型功能的用户
**流程**：
1. 用户将视频素材拖入 V1 轨道
2. 视频片段插入成功后，片段右上角自动弹出引导气泡：「💡 试试 AI 对口型，右键即可开始」
3. 气泡 3 秒后自动消失，或用户点击「知道了」关闭
4. 用户右键视频片段，看到「视频对口型」选项
5. 点击后进入对口型流程（与场景 1 相同）
6. 引导气泡仅在用户首次插入视频时展示一次（通过 LocalStorage 标记 `hasSeenLipSyncGuide`）

---

## 页面状态机

### 对口型落地页（`/lipsync`）状态机

落地页由 `LipSyncStage` 状态机驱动，分为工作区状态和 Tab 区可见性两个维度：

```
idle → uploading → parsing → editing → generating → idle
               ↗（做同款 / 重新编辑）
```

| Stage | 工作区（上半部分） | Tab 区（下半部分） |
|-------|-----------------|-----------------|
| `idle` | Hero 区（品牌视频 + 主标题 + 副标题 + 上传入口） | 可见（推荐 / 我的） |
| `uploading` | 上传进度条面板 | **收起隐藏** |
| `parsing` | 解析进度环面板 | **收起隐藏** |
| `editing` | 台词编辑区（语言选择 + 讲话人列表 + 算力预览 + 操作按钮） | **收起隐藏** |
| `generating` | 生成提交成功提示（「任务已提交，可在『我的』查看进度」）+ 「新建任务」按钮 | **收起隐藏** |

> `generating` 是过渡态：用户点击「生成视频」后立即切换至此，后端异步处理视频生成任务。用户点击「新建任务」或 Logo，工作区清空回到 `idle`，Tab 区重新显示；此时「我的」Tab 中将出现该处理中任务。**页面刷新时状态机重置为 `idle`**。

**特殊入口**：
- **做同款**（来自推荐 Tab，已登录）→ 直接进入 `editing`，源视频 = 示例视频，台词预填（源语言台词），目标语言初始值 = `RecommendVideo.targetLanguage`
- **做同款**（来自推荐 Tab，未登录）→ 触发登录弹窗，登录成功后自动进入 `editing` 态
- **重新编辑**（来自「我的」Tab）→ 直接进入 `editing`，源视频 = `HistoryTask.sourceVideoUrl`，台词加载 `HistoryTask.segments`

### 专业剪辑页（ProEditor）对口型状态机

剪辑页对口型由独立的 `ProEditorLipSyncStage` 状态机驱动，与落地页状态机互不干扰：

```
idle → parsing → editing → generating → done → idle
```

| LipSyncStage | 左侧对口型面板 | V1 轨道 |
|-------------|--------------|---------|
| `idle` | 空态提示「请选中视频片段」或隐藏 | 正常展示 |
| `parsing` | 圆形 SVG 渐变进度环 + 百分比 + 「解析中…」 | 正常展示 |
| `editing` | 台词编辑区（语言选择 + 讲话人列表 + 算力预览 + 「开始对口型」按钮） | 正常展示 |
| `generating` | 「生成中…」提示 + 百分比 | **V1 轨道片段上叠加渐变进度条**（紫 → 青，宽度 = progress%） |
| `done` | 「生成完成」提示 + 「关闭」按钮 | 对口型视频**原地替换** V1 轨道片段 |

**入口**：
- **右键菜单**（右键 V1 轨道视频片段）→ 菜单项「视频对口型」→ 左侧面板切换至对口型面板，直接使用轨道上视频的 `sourceUrl` 进入 `parsing` 态
- **左侧导航栏图标**（底部对口型 icon）→ 切换至对口型面板；若当前无选中视频片段则展示空态「请先选中轨道上的视频片段」；选中后自动进入 `parsing` 态

**任务同步**：
- 生成任务提交后，前端同步写入一条 `HistoryTask` 到落地页任务列表（通过共享 API），同步方向为**双向（剪辑页 ⇄ 落地页）**
- 任务不区分来源标记，落地页展示与落地页自身发起的任务完全一致

---

## 功能需求

### P0 — 必须实现

#### 对口型落地页（`/lipsync`）

**冻结导航栏（Header）**
- Logo（点击回首页 `/`）
- 「专业剪辑」按钮（跳转 `/professional-edit`）
- 算力余额实时展示
- 用户头像（已登录） / 登录按钮（未登录）
- 导航栏始终固定在顶部，不随页面滚动

**Hero 区（idle 态）**
- 主标题：「AI 智能对口型」（打字机动效，`TextType` 组件复用）
- 副标题：「多语种视频配音，让你的内容走向全球」
- 品牌示例视频：自动播放、静音、循环，展示对口型前后对比效果
- 上传入口：拖拽 / 点击上传，触发登录校验（未登录 → 登录弹窗）

**视频上传**
- 支持格式：MP4、MOV
- 时长限制：≤ 5 分钟
- 大小限制：≤ 500MB
- 上传进度：百分比 + 进度条动画
- 失败处理：展示具体错误原因（格式不支持 / 文件过大 / 上传超时）+ 「重新上传」按钮

**语音解析**
- 上传完成后自动触发，展示圆形 SVG 渐变进度环（紫 → 青）+ 百分比
- 失败处理：展示「解析超时」等具体原因 + 「重新上传」按钮
- 源语言自动识别（支持中文、英文）

**台词编辑区（editing 态）**
- 目标语言选择：下拉选择，支持 8 种语言（ZH / EN / JA / RU / KO / AR / ES / YUE）
  - 切换后 1.4s 翻译动画过渡，自动替换台词内容
- 台词列表：
  - 按讲话人（讲话人 1、讲话人 2…，以首次出现顺序命名）+ 时间段分组展示
  - 每条台词支持直接编辑（`<textarea>`）
  - 台词过长警告：当单条台词在其时间段内的语速超过阈值时，展示 `⚠️` 提示及删减建议
  - 做同款后台词与源视频差距过大时，提示「视频生成效果可能欠佳」
- 底部操作栏：
  - 预计算力消耗展示
  - 「返回」按钮：清空当前 editing 态，回到 `idle`
  - 「生成视频」按钮：
    - 算力充足 → 调用生成接口，接口同步返回 `taskId`，前端立即将该任务以乐观 UI 方式插入「我的」Tab 列表（状态为处理中，`progress=0`），随后进入 `generating` 态
    - 算力不足 → 弹出提示弹窗（「算力不足，请充值」+ 充值跳转链接）

**推荐 Tab**
- 搜索框：支持关键词搜索；建议词（短剧 / 个人演讲 / 教育培训 / 广告营销 / 品牌营销）硬编码在前端
- 视频卡片网格：
  - 封面图由运营后台提供
  - 展示视频标题、场景分类标签、目标语言标签
- 点击卡片 → 对比播放弹窗：
  - 左侧：原视频播放器（播放 / 暂停 / 进度条 / 音量 / 全屏）
  - 右侧：对口型后视频播放器（同等控件）
  - 两个播放器独立控制，互不联动
  - 底部「做同款」按钮：
    - 已登录 → 关闭弹窗，进入 `editing` 态（源视频 = 示例视频，台词预填，可编辑）
    - 未登录 → 弹出登录弹窗
- 未登录用户可正常浏览推荐 Tab（仅点击「做同款」时触发登录）

**「我的」Tab**
- 访问权限：未登录时直接触发登录弹窗；登录成功后停留在「我的」Tab
- 任务卡片字段：
  - 视频缩略图（视频首帧自动截取）
  - 任务名称（视频文件名）
  - 当前目标语种
  - 视频时长
  - 创作时间（YYYY-MM-DD HH:mm）
  - 状态标签（成功 / 处理中 / 失败）
- 点击缩略图 → 视频播放弹窗（单视频预览，含播放控件）
- 操作按钮（按状态）：

  | 状态 | 可用操作 |
  |------|---------|
  | 成功 | 下载、重新编辑、专业剪辑（跳转 ProEditor）、删除 |
  | 处理中 | 进度条 + 百分比（后端轮询）；其余按钮禁用；不支持取消 |
  | 失败 | 重新编辑、删除 |

- 列表加载：滚动到底无限加载（`pageSize=20`）
- 搜索框：支持按任务名称关键词搜索，调后端接口传 `keyword` 参数过滤

#### 专业剪辑页（ProEditor）— 对口型功能

**入口**

- **右键菜单入口**（主入口）：
  - 右键 V1 视频轨道上的片段时，上下文菜单新增「视频对口型」选项（强调色展示，与其他选项用分隔线区分）
  - 点击后：
    - 左侧面板自动切换至对口型面板
    - **左侧导航栏底部动态出现「对口型」图标**（`record_voice_over` + AI 渐变徽章），上方有分隔线
    - 直接以轨道视频的 `sourceUrl` 进入 `parsing` 阶段（无需重新上传）

- **左侧导航栏图标**（动态出现）：
  - 图标**不是固定存在**，仅在用户首次右键触发对口型后才出现在导航栏底部
  - 出现后保持可见（即使关闭对口型面板），方便用户再次快速进入
  - 点击图标：左侧面板切换至对口型面板
    - 若当前已选中 V1 轨道上的视频片段 → 直接进入 `parsing` 阶段
    - 若未选中 → 面板展示空态「请先选中轨道上的视频片段」

- **新功能引导气泡**（首次使用引导）：
  - **触发时机**：用户首次在 V1 轨道插入视频片段后（拖入或粘贴）
  - **展示位置**：视频片段右上角，箭头指向片段
  - **气泡内容**：
    - 图标：💡（灯泡 emoji）
    - 文案：「试试 AI 对口型，右键即可开始」
    - 按钮：「知道了」（点击关闭）
  - **消失逻辑**：
    - 3 秒后自动淡出消失
    - 或用户点击「知道了」立即关闭
    - 或用户右键该片段时立即关闭
  - **展示次数**：仅展示一次，通过 `localStorage.getItem('hasSeenLipSyncGuide')` 标记

**对口型面板（左侧 288px）**

面板位于左侧素材面板同一位置，与素材/配音等面板平级切换。面板内按当前阶段切换展示：

- **空态**（`idle`）：
  - 居中提示图标 + 「请先选中轨道上的视频片段」
  - 用户选中 V1 片段后自动进入下一阶段

- **解析阶段**（`parsing`）：
  - 面板顶部：素材信息（视频文件名 + 轨道名 + 时长）
  - 圆形 SVG 渐变进度环（紫 `#7000ff` → 青 `#00f2ea`）+ 中心百分比数字
  - 下方文案「视频解析中…」
  - 失败时展示具体原因 + 「重新解析」按钮

- **台词编辑阶段**（`editing`）：
  - 顶部：解析成功提示 Banner（青色背景 + ✓ 图标）
  - 目标语言下拉选择（8 种语言，切换后 1.4s 翻译动画过渡）
  - 台词列表：
    - 按讲话人 + 时间段分组展示
    - 每条台词可直接编辑（`<textarea>`）
    - 台词过长警告（`⚠️` + 黄色边框高亮）
  - 底部固定栏：
    - 预计算力消耗展示
    - 「开始对口型」按钮（算力不足 → 弹出充值提示）

- **生成中阶段**（`generating`）：
  - 面板：「对口型生成中…」+ 当前进度百分比
  - 「开始对口型」按钮变为禁用态「生成中…」
  - 面板不可操作，但用户可切换到其他面板继续剪辑

- **生成完成**（`done`）：
  - 面板：「生成完成 ✓」提示
  - 「关闭」按钮（点击后面板切回上一个活动面板或素材面板）

**轨道进度展示**

- **生成中**：V1 轨道上被选中的视频片段叠加一层半透明渐变进度条
  - 渐变色：紫 `#7000ff` → 青 `#00f2ea`
  - 进度条宽度 = 片段宽度 × (progress / 100)
  - 进度条上方居中展示「对口型中 XX%」文字标签
  - 进度条动画过渡 `0.35s ease`
- **生成完成**：进度条消失，V1 轨道片段原地替换为对口型视频
  - 片段缩略图更新为新视频首帧
  - 片段 `sourceUrl` 指向生成后的视频 URL
  - 替换为原子操作，不新增轨道、不改变片段在时间轴上的位置和时长

**任务同步**

- 用户在剪辑页点击「开始对口型」后，生成接口同步返回 `taskId`
- 前端将该任务以 `HistoryTask` 格式写入落地页任务列表（通过共享后端 API 调用 `POST /api/lipsync/tasks`）
- 同步方向：**双向（剪辑页 ⇄ 落地页）**，落地页「我的」Tab 中展示该任务
- 任务不区分来源标记，展示形式与落地页自身发起的任务完全一致
- 进度轮询：剪辑页和落地页各自独立轮询同一个 `taskId` 的进度

### P1 — 应该实现

- **任务实时进度轮询**：处理中任务通过后端接口定时轮询（间隔 3s），更新进度条百分比；任务状态变为 `success` 或 `failed` 时自动停止轮询
- **登录弹窗**：统一登录/注册入口组件，触发点包括：点击上传、点击做同款、切换至「我的」Tab
- **算力充值弹窗**：算力不足时展示，含充值说明和外链跳转
- **错误态 UI**：上传失败、解析失败、生成失败的完整视觉反馈

### P2 — 可以推迟

- 批量上传：队列式处理多个视频文件
- 字幕导出：下载 SRT / VTT 格式字幕
- 阿拉伯语 RTL 布局完整适配
- 站内任务完成通知
- 推荐 Tab 分页（当前为全量加载）

---

## 组件清单

### 对口型落地页（`/lipsync`）

| 组件 | 文件位置（建议） | 职责 |
|------|---------------|------|
| `LipSyncHeader` | `src/pages/LipSync/components/` | 导航栏：Logo / 专业剪辑 / 算力 / 头像 / 登录 |
| `LipSyncHero` | `src/pages/LipSync/components/` | Hero 区：品牌视频 + 主副标题 + 上传入口 |
| `UploadPanel` | `src/pages/LipSync/components/` | 拖拽上传区域 |
| `UploadingPanel` | `src/pages/LipSync/components/` | 上传进度条面板 |
| `ParsingPanel` | `src/pages/LipSync/components/` | 解析圆形进度环面板 |
| `EditingPanel` | `src/pages/LipSync/components/` | 台词编辑区（语言选择 + 台词列表 + 底部操作栏） |
| `GeneratingPanel` | `src/pages/LipSync/components/` | 生成提交成功提示 + 「新建任务」按钮 |
| `SegmentItem` | `src/pages/LipSync/components/` | 单条台词段落（讲话人 + 时间 + 可编辑文本 + 警告） |
| `RecommendTab` | `src/pages/LipSync/components/` | 推荐 Tab：搜索 + 视频卡片网格 |
| `VideoCard` | `src/components/VideoCard/` | 推荐视频卡片（封面 + 标签） |
| `CompareModal` | `src/components/CompareModal/` | 对比播放弹窗（左右双播放器 + 做同款按钮） |
| `MineTab` | `src/pages/LipSync/components/` | 我的 Tab：搜索 + 无限滚动任务列表 |
| `TaskCard` | `src/components/TaskCard/` | 单条历史任务卡片（缩略图 + 字段 + 操作按钮 + 进度条） |
| `VideoPreviewModal` | `src/components/VideoPreviewModal/` | 单视频预览弹窗 |

### 专业剪辑页（ProEditor）— 对口型相关

| 组件 | 文件位置（建议） | 职责 |
|------|---------------|------|
| `LipSyncNavItem` | `src/pages/ProEditor/components/` | 左侧导航栏底部对口型图标（`record_voice_over` + AI 徽章），**动态出现** |
| `LipSyncPanel` | `src/pages/ProEditor/components/` | 对口型操作面板（288px 左侧面板，按阶段切换展示） |
| `LipSyncIdle` | `src/pages/ProEditor/components/` | 面板空态：「请先选中轨道上的视频片段」 |
| `LipSyncParsing` | `src/pages/ProEditor/components/` | 面板解析态：素材信息 + 圆形进度环 |
| `LipSyncEditing` | `src/pages/ProEditor/components/` | 面板编辑态：语言选择 + 台词列表 + 操作栏 |
| `LipSyncGenerating` | `src/pages/ProEditor/components/` | 面板生成态：进度提示 |
| `LipSyncDone` | `src/pages/ProEditor/components/` | 面板完成态：成功提示 + 关闭按钮 |
| `TrackProgressOverlay` | `src/pages/ProEditor/components/` | V1 轨道片段上的渐变进度条叠加层 |
| `TrackContextMenu` | `src/pages/ProEditor/components/` | 轨道右键上下文菜单（含「视频对口型」选项） |
| `LipSyncGuideBubble` | `src/pages/ProEditor/components/` | 新功能引导气泡（首次插入视频时展示，3s 自动消失） |

---

## 数据模型

### HistoryTask（对口型任务）

```typescript
interface HistoryTask {
  id: string;
  name: string;           // 视频文件名
  date: number;           // 创建时间，Unix 时间戳（ms）
  from: LanguageCode | 'UNKNOWN'; // 源语言代码（自动识别）
  to: LanguageCode;       // 目标语言代码
  status: 'success' | 'processing' | 'failed';
  progress?: number;      // 处理中时的进度 0-100
  thumbnail?: string;     // 视频首帧截图 URL
  duration?: string;      // 视频时长 "MM:SS"
  sourceVideoUrl: string; // 源视频 URL（重新编辑时加载用）
  downloadUrl?: string;   // 成功后的下载链接
  segments: Segment[];    // 用户最后一次编辑保存的源语言台词
  source?: 'landing' | 'editor'; // 任务来源（可选，用于统计）
}
```

### Segment（台词段落）

```typescript
interface Segment {
  id: string;
  speaker: string;        // 讲话人标签：「讲话人 1」「讲话人 2」...
  timeRange: string;      // 时间段 "HH:MM:SS.mmm - HH:MM:SS.mmm"
  text: string;           // 台词文本（可编辑）
  warning?: 'too-long' | 'quality-risk';
  // too-long：后端解析时标记，台词语速超过阈值
  // quality-risk：前端实时计算，做同款进入 editing 后用户编辑台词时，与原始 text 做字符相似度对比，相似度 < 60% 时标记
}
```

### LipSyncState（落地页状态）

```typescript
type LipSyncStage = 'idle' | 'uploading' | 'parsing' | 'editing' | 'generating';

interface LipSyncState {
  stage: LipSyncStage;
  uploadProgress: number;        // 0-100
  parseProgress: number;         // 0-100
  segments: Segment[];
  targetLanguage: LanguageCode;
  from: LanguageCode | 'UNKNOWN';
  sourceVideoUrl: string | null;
  taskId: string | null;
  error: string | null;
}
```

### ProEditorLipSyncState（专业剪辑页对口型状态）

```typescript
type ProEditorLipSyncStage = 'idle' | 'parsing' | 'editing' | 'generating' | 'done';

interface ProEditorLipSyncState {
  stage: ProEditorLipSyncStage;
  parseProgress: number;         // 0-100
  generateProgress: number;      // 0-100
  selectedClip: TrackClip | null;
  segments: Segment[];
  targetLanguage: LanguageCode;
  from: LanguageCode | 'UNKNOWN';
  taskId: string | null;
  error: string | null;
}
```

### TrackClip（轨道视频片段）

```typescript
interface TrackClip {
  id: string;
  name: string;
  trackId: string;
  sourceUrl: string;
  startTime: number;
  duration: number;
  thumbnail?: string;
}
```

### RecommendVideo（推荐案例）

```typescript
interface RecommendVideo {
  id: string;
  title: string;
  category: '短剧' | '个人演讲' | '教育培训' | '广告营销' | '品牌营销';
  thumbnail: string;
  originalUrl: string;
  syncedUrl: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  segments: Segment[];
  duration: string;
}
```

### 支持语言（8 种）

| 语言 | 代码 | 备注 |
|------|------|------|
| 中文 | ZH | 可作为目标语言（支持中→中） |
| 英语 | EN | |
| 日语 | JA | |
| 俄语 | RU | |
| 韩语 | KO | |
| 阿拉伯语 | AR | RTL 适配为 P2 |
| 西班牙语 | ES | |
| 粤语 | YUE | |

---

## 权限矩阵

### 对口型落地页

| 操作 | 未登录 | 已登录 |
|------|--------|--------|
| 浏览 Hero 区 | ✅ | ✅ |
| 浏览推荐 Tab | ✅ | ✅ |
| 对比播放弹窗 | ✅ | ✅ |
| 点击「做同款」 | 触发登录弹窗 | ✅ |
| 上传视频 | 触发登录弹窗 | ✅ |
| 访问「我的」Tab | 触发登录弹窗 | ✅ |
| 生成视频 | 触发登录弹窗 | 需算力充足 |

### 专业剪辑页

> 专业剪辑页本身需登录才能访问，以下操作均在已登录前提下。

| 操作 | 权限 |
|------|------|
| 右键轨道触发对口型 | ✅ 需选中 V1 视频片段 |
| 点击左侧导航对口型 icon | ✅ 未选中片段时展示空态引导 |
| 开始对口型生成 | 需算力充足 |
| 生成中切换至其他面板继续剪辑 | ✅ |


---

## 设计规范

### 对口型落地页设计规范

沿用 AI 素材生成中心设计系统（PRD2.md V2.3）：

| 用途 | 值 |
|------|-----|
| 主题蓝 | `#0066FF` |
| 选中轮廓蓝 | `#60A5FA` |
| 算力徽章闪电色 | `#22d3ee`（青色） |
| 深色背景 | `#0F0F0F` |
| 面板背景 | `#141414` |
| 分割线 | `rgba(255,255,255,0.08)` |

**动画**：
- TextType 打字机（100ms 打字 / 40ms 删除 / 2500ms 停顿）
- 圆形进度环（0.4s ease）
- 翻译遮罩过渡（1.4s 延迟）
- Tab 切换淡入（0.2s）
- 工作区展开/收起（0.3s ease-in-out）

### 专业剪辑页补充规范

- **剪辑页背景**：`#09090b`（比落地页更深）
- **面板表面色**：`#111113`
- **对口型进度条渐变**：紫 `#7000ff` → 青 `#00f2ea`
- **轨道进度条叠加层**：半透明渐变（opacity 0.7），`transition: width 0.35s ease`
- **轨道进度文字标签**：12px，白色，居中于进度条上方
- **对口型完成状态**：轨道片段边框闪烁一次青色（0.5s）后恢复正常
- **面板切换动画**：`0.2s ease-in-out`
- **对口型导航图标**：`record_voice_over`，附 AI 渐变徽章（cyan → purple，8px），**动态出现**
- **引导气泡**：
  - 背景：`rgba(0, 242, 234, 0.95)`（青色半透明）
  - 文字：14px，`#0B0C10`（深色文字）
  - 圆角：8px
  - 阴影：`0 4px 12px rgba(0, 242, 234, 0.3)`
  - 箭头：8px 三角形，指向视频片段
  - 按钮：「知道了」，白色背景 `rgba(255,255,255,0.2)`
  - 出现动画：`fadeInDown 0.3s ease`
  - 消失动画：`fadeOut 0.3s ease`


---

## 非功能需求

- **性能**：推荐 Tab 视频卡片封面图懒加载；「我的」Tab 无限滚动每次加载 20 条（`pageSize=20`）；进度轮询间隔 ≤ 3s；算力余额在每次生成任务提交后主动刷新一次
- **性能（剪辑页）**：对口型轨道进度条渲染不应阻塞时间轴其他操作；生成中用户可自由切换面板继续剪辑；进度轮询与落地页独立，互不干扰
- **可用性**：处理中禁用主操作按钮；算力不足前置校验；上传/解析失败给出可操作的恢复路径
- **安全**：生成操作后端验证算力余额；文件类型服务端二次校验（不仅信赖 MIME type）
- **兼容性**：优先支持 Chrome / Safari / Edge 最新两个版本

---

## 成功指标

| 指标 | 目标值 | 衡量方式 |
|------|--------|----------|
| 落地页首屏到首次上传转化率 | ≥ 30% | 埋点漏斗（进入页面 → 点击上传） |
| 做同款到生成完成转化率 | ≥ 50% | 埋点漏斗（点做同款 → 生成成功） |
| 「我的」Tab 任务管理满意度 | ≥ 4.0 / 5.0 | 用户调研 |
| 上传成功率 | ≥ 99% | 后端任务日志 |
| 处理中进度轮询延迟 | ≤ 3s | 前端性能监控 |
| 剪辑页对口型使用率 | ≥ 20% | 剪辑页用户中触发对口型功能的占比 |
| 剪辑页对口型完成率 | ≥ 60% | 触发对口型 → 生成成功的转化率 |
| 剪辑页任务同步成功率 | ≥ 99% | 剪辑页任务出现在落地页的比例 |


---

## 开放问题

- [x] 视频文件大小上限：≤ 500MB（已确认）
- [x] 剪辑页对口型面板位置：左侧面板 288px（已确认）
- [x] 生成成功后轨道行为：原地替换 V1 轨道片段（已确认）
- [x] 剪辑页触发对口型时视频来源：直接使用轨道上的视频（已确认）
- [x] 任务同步方向：双向（剪辑页 ⇄ 落地页），不区分来源标记（已确认）
- [x] 轨道进度展示形式：V1 轨道上叠加渐变进度条（已确认）
- [x] 面板阶段切换方式：同一面板位置按阶段切换展示（已确认）
- [ ] 阿拉伯语 RTL 布局适配是否纳入 v5.7.2（当前列为 P2）
- [ ] 后端 API 接口文档待同步：进度轮询接口 / 做同款台词获取接口 / 无限滚动分页接口
- [ ] 「做同款」台词差距过大的判断阈值（如字符相似度 < 60%）待算法团队定义
- [ ] 推荐 Tab 内容管理后台属于独立系统，不在本 PRD 范围内
- [ ] 算力充值页面 / 套餐方案属于计费系统，本 PRD 仅定义跳转入口
- [ ] 登录 / 注册流程属于账户系统，本 PRD 仅定义触发时机和弹窗入口
- [ ] 剪辑页任务同步的具体 API 设计（共享后端 API）待后端团队确认
- [ ] 剪辑页对口型生成完成后是否需要 Toast 通知（当用户已切换到其他面板时）

---

## 导航与页面关系

| 页面 | 路由 | 导航入口 |
|------|------|---------|
| 首页（AI 素材生成中心） | `/` | Header Logo |
| 对口型落地页 | `/lipsync` | 首页 Header「对口型」按钮 |
| 专业剪辑页 | `/professional-edit` | 首页 Header「专业剪辑」/ 对口型落地页 Header「专业剪辑」/ 「我的」Tab「专业剪辑」按钮 |

**Header 导航栏统一结构**：
- Logo（点击回首页 `/`）
- 「AI素材生成」按钮（跳转 `/`）
- 「对口型」按钮（跳转 `/lipsync`）
- 「专业剪辑」按钮（跳转 `/professional-edit`）
- 算力余额
- 用户头像 / 登录按钮


---

## 变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| V5.7.2 | 2026-03-31 | 新增对口型落地页（`/lipsync`）；专业剪辑页集成对口型功能；支持 8 种目标语言；双向任务同步；新增引导气泡；动态对口型导航图标 |

---

## 埋点体系（参考 V5.7.1）

### 对口型落地页埋点

| 事件名 | 触发时机 | 参数 |
|--------|---------|------|
| `lipsync_page_view` | 进入对口型落地页 | `user_id`, `timestamp` |
| `lipsync_upload_click` | 点击上传按钮 | `user_id`, `is_logged_in` |
| `lipsync_upload_success` | 视频上传成功 | `user_id`, `file_size`, `duration` |
| `lipsync_parse_complete` | 解析完成 | `user_id`, `task_id`, `source_language` |
| `lipsync_language_change` | 切换目标语言 | `user_id`, `from_lang`, `to_lang` |
| `lipsync_generate_click` | 点击生成视频 | `user_id`, `task_id`, `target_language`, `credits_cost` |
| `lipsync_generate_success` | 生成成功 | `user_id`, `task_id`, `duration_seconds` |
| `lipsync_recommend_view` | 查看推荐案例 | `user_id`, `video_id` |
| `lipsync_do_same_click` | 点击做同款 | `user_id`, `video_id`, `is_logged_in` |
| `lipsync_task_download` | 下载对口型视频 | `user_id`, `task_id` |

### 专业剪辑页对口型埋点

| 事件名 | 触发时机 | 参数 |
|--------|---------|------|
| `editor_lipsync_menu_click` | 右键菜单点击对口型 | `user_id`, `clip_id` |
| `editor_lipsync_nav_click` | 点击导航栏对口型图标 | `user_id` |
| `editor_lipsync_guide_show` | 引导气泡展示 | `user_id` |
| `editor_lipsync_guide_close` | 引导气泡关闭 | `user_id`, `close_type` (auto/manual/trigger) |
| `editor_lipsync_parse_start` | 开始解析轨道视频 | `user_id`, `clip_id` |
| `editor_lipsync_generate_click` | 点击开始对口型 | `user_id`, `task_id`, `target_language` |
| `editor_lipsync_generate_success` | 对口型生成成功 | `user_id`, `task_id`, `clip_id` |
| `editor_lipsync_replace_complete` | 轨道片段替换完成 | `user_id`, `task_id`, `clip_id` |

### 北极星指标

- **对口型任务完成率**：(成功任务数 / 总任务数) × 100%
- **剪辑页对口型渗透率**：(使用对口型的剪辑用户数 / 总剪辑用户数) × 100%
- **跨页面任务同步成功率**：(同步成功任务数 / 总任务数) × 100%

