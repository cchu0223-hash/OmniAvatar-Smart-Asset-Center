---
id: prd-5.7.5
title: "OmniAvatar AI素材生成中心 — AI对口型功能集成 v5.7.5"
status: planning
owner: ""
created: 2026-04-01
updated: 2026-04-02
linked-designs: []
linked-epics: []
version: "5.7.5"
supersedes: "prd-5.7.2"
---

# PRD: OmniAvatar AI素材生成中心 — AI对口型功能集成 v5.7.5

## 背景与目标

基于 V5.7.2 版本，本次迭代在对口型核心流程已验证可行的基础上，重点提升用户体验细节、完善任务管理，并落地剪辑页对口型功能的完整引导体系。**目标语言仍为 8 种**（ZH / EN / JA / RU / KO / AR / ES / YUE）；**不包含**法语、德语对口型能力，文档与实现均勿自行扩展。

**v5.7.5 目标**：
- 在专业剪辑页面内嵌完整的对口型工作流
- 目标语言与 V5.7.2 一致：**8 种**（ZH / EN / JA / RU / KO / AR / ES / YUE）
- 新增对口型落地页，展示对口型任务历史和管理
- 专业剪辑页与对口型落地页任务双向同步
- 保持与现有 AI 素材生成功能的设计一致性

**核心价值**：
- 用户无需离开剪辑环境即可完成对口型生成
- 统一的任务管理体验（AI 素材 + 对口型）
- 降低多语种视频制作门槛
- 无论是在专业剪辑页右键一键直达，还是在对口型落地页（/lipsync）独立上传处理，均可快速完成多语种对口型生成，助力短剧出海、品牌全球化、跨境教育等场景的视频本地化需求。

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

> **剪辑页生成完成提示**：以**对口型面板状态**与 **V1 轨道片段替换/进度条**为准；**不提供**全局 Toast。用户若已切换到其他面板，需自行打开对口型面板或查看轨道上的结果。

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
- **主标题（`TypewriterTitle`）**：两段式打字机。先打出 **「讯飞智作」**（竖向渐变：白 → 浅灰）；再打出 **「，AI对口型一步到位」**（横向渐变：青 `#00f2ff` → 蓝 → 紫）。**整行单行展示**（`white-space: nowrap`，字号 `clamp(20px, 2.4vw, 34px)`），避免主标题折行。
- **副标题（`.lipsync-subtitle`）**：「多语种真实对口型视频，让您的视频全球发声。」
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
- 目标语言选择：下拉选择，支持 **8 种**语言（ZH / EN / JA / RU / KO / AR / ES / YUE）
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
  - **落地页生成完成无 Toast**：任务处理完成后，列表中任务状态自动更新为「成功」，**不弹出全局 Toast 通知**，用户需主动切换至「我的」Tab 查看结果

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
  - 视频时长（**前端展示**：仅任务状态为 **合成成功**（`success`）时展示时长 Chip，如 `1m14s`；处理中 / 草稿 / 失败 / 后台解析等 **不展示**时长标签）
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
- **任务可见性**：「我的」Tab 展示所有对口型任务，包括落地页自身发起的任务以及专业剪辑页右键触发的任务，来源对用户不可见，统一在列表中呈现
- **本版本不提供**任务关键词搜索与状态筛选 Chip；任务列表为时间序展示

#### Hero 内嵌台词演示区（`EditorPane` / `hero-editor`，`src/LipSyncPage.tsx`）

与 **专业剪辑 ProEditor** 解耦的**营销向演示面板**：用户在上传完成后进入解析 / 台词编辑 / 合成动线，用于体现产品能力（非生产轨道编辑器）。

- **右栏布局（`hero-ed-right`）**  
  - 纵向 **flex**：顶部为「对话解析」标题行（语言选择、解析完成态、撤销 / 重做等）；**中部** `hero-ed-right-scroll` 使用 `flex: 1`、`min-height: 0`、`overflow-y: auto`，**仅台词段落列表在此滚动**；**底部** `hero-ed-footnote` **`flex-shrink: 0`**，固定在右栏**最底**，不随台词列表滚走。栅格列使用 `align-items: stretch` 且子项 `min-height: 0`，保证滚动与等高。

- **预览与时间轴行为**  
  - **高亮语义**：列表项 `hero-ed-seg-active`、时间轴上对应色块、预览区底部当前段提示 — **仅在「正在播放」且播放头落在该段内**时出现；暂停后即使指针仍停在该段，**不**再保持上述高亮。  
  - **时间轴分段时间条（`.hero-ed-strip`）**：解析完成进入 `editing` 后，条内为 **按时长比例 flex 分段**的进度条样式：每个解析段落占一格（段间时间空隙为浅色「间隙」格），当前播放段高亮（`.hero-ed-strip-chunk--active`），顶层叠加 **播放头**，整条可拖拽 / 点击 seek；底层 **不**再使用多格视频缩略图 Mock。**可选正式实现**：若需胶片感，可在具备 `sourceUrl` 后按时间点抽帧替换分段填充样式，规范可参考原 PRD「隐藏 video + canvas 抽帧」方案；失败时保持纯色分段条即可。  
  - **点击台词进入编辑**：调用 `onEditStart` 前 **停止播放**（`setIsPlaying(false)`），不因选中而自动播放。  
  - **对话解析旁说明（`InfoTip`）**：紫色圆形「i」触发器；hover 浮层为 **浅色背景 + 深色正文**（日夜间在 `index.css` 中分主题维护）。  
  - **台词编辑态（`SegmentItem`，落地页）**：进入编辑后展示多行输入与 **「保存」「取消」**；**取消** / `Escape` 丢弃草稿恢复展示态；**Enter**（非 Shift）等价于保存（与保存按钮同规则）。**未改动**（文稿与解析结果一致）时 **保存** 禁用。点击保存后按钮进入 **「保存中」** 态（短时模拟），完成后写回段落。  
  - **落地页与剪辑页差异（修改幅度阈值）**：**仅专业剪辑**左栏 `LipSegmentEditor` 使用 `src/lipsyncEditThreshold.ts`（归一化 Levenshtein **≥ 35%** 时警告且 **不可保存**）。**落地页 `SegmentItem` 不使用**该偏差阈值做实时拦截；以「保存后写入的正式稿」为准。  
  - **单段 / 总字数限制（落地页）**：单段默认 **≤200 字**、全稿总字数上限由产品配置（如 2000）。**总字数超限**：顶栏黄色提示（`warningMessage` 非空）+ **合成视频**禁用。**单段超限**：**不**在顶栏重复「该片段…」文案；仅在 **该片段正文区域下方**（`hero-ed-seg-length-warn`）展示「该片段字数超出 N，请分段或精简。」且须同时满足：**已进入 `editing` 阶段**、**当前不在该段编辑框内**、**已保存后的 `seg.text` 超长** — 即 **编辑中打字超限不展示**，**仅保存落稿后**才可能出现提示；**解析打字机动画阶段**不展示单段字数条。  
  - **合成视频按钮**：在 **总字数或单段规则触发的 `hasExceededLimit`**、**任一段保存中**（`isSaving`）、或 **存在未关闭的段落编辑**（`editingId !== null`）时 **禁用**。  
  - **段末播放控件**：支持 **播放 / 暂停 / 续播**。正在播本段 → 再点则暂停；已暂停且指针在本段范围内 → 再点则续播；否则 **跳到该段起点** 并开始播放；播放本段时图标为**暂停**，否则为**三角播放**（`e.stopPropagation()`，避免误触）。

- **脚注（`hero-ed-footnote`）**  
  - 文案：「如发现解析不准确，您可前往 **「专业剪辑」**（可点击跳转），将原视频导入并插入轨道，手动分段后，逐段右键进行 **AI对口型**，进一步提高准确率。」  
  - 「专业剪辑」为按钮，`navigate('/professional-edit')`。  
  - **时长超限提示条**（若出现）内「专业剪辑」链接 **同样** 跳转 `/professional-edit`。

- **日间模式（本区块）**  
  - 编辑中段落：`.hero-ed-seg-editing`，夜间 `#374559`，日间浅底 + 紫系描边。  
  - 段落播放钮默认：`.hero-ed-seg-play-btn` 紫色底边与图标；播放中 `.hero-ed-seg-play-btn--active` 为青系强调。  
  - 脚注区浅紫底与正文 / 链接色见 `index.css` 中 `[data-theme="light"] .hero-ed-footnote*`。  
  - 主操作「合成视频」：`.hero-ed-btn-primary`，渐变上 **白字**。

- **封面叠字与任务卡（与主题令牌解耦）**  
  - `VideoCard` / `DemoVideoCard` 上标题与角标：**固定浅色字**（如 `rgba(255,255,255,0.96)`），**不**使用随日间变深的 `--text-primary`，以保证叠在封面静帧上可读。  
  - **Hero 右侧 `DemoVideoCard`**：仅示例封面与播放 / 静音等控件，**不提供**底部「**做同款**」按钮（与推荐 Tab `VideoCard` 区分；「做同款」仍出现在推荐卡片悬停区与 `CompareModal`）。  
  - `MineCard` 上紫 / 青渐变与红渐变的 **重新编辑 / 继续编辑 / 重试**：字色 **#fff**，避免浅色主题下渐变条上出现深色字。

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
  - 台词列表（`LipSegmentEditor`，实现：`src/ProfessionalEditPage.tsx`）：
    - 按讲话人 + 时间段分组展示
    - **默认只读展示**；**点击**进入编辑态，展示 `<textarea>` + **「保存」「取消」**（`Escape` 取消；`Enter` 非换行时同保存，规则与保存按钮一致）
    - 与落地页 `SegmentItem` **共用** `src/lipsyncEditThreshold.ts`：**归一化 Levenshtein 偏差比例 ≥ 0.35** 时警告且 **不可保存**；与解析稿无差异时保存禁用
    - （扩展）台词过长等业务警告可保留 `⚠️` + 高亮，与本阈值规则独立
  - 底部固定栏：
    - 预计算力消耗展示
    - 「开始 AI 对口型」按钮（算力不足 → 弹出充值提示）

- **生成中阶段**（`generating`）：
  - 面板：「对口型生成中…」+ 当前进度百分比
  - 「开始对口型」按钮变为禁用态「生成中…」
  - 面板不可操作，但用户可切换到其他面板继续剪辑

- **生成完成**（`done`）：
  - 面板：「生成完成 ✓」提示
  - 提示文案：「您可在 AIGC 工具箱 - AI 对口型页面查看历史合成任务」
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

> **无 Toast**：生成成功后的反馈仅通过对口型面板 `done` 态与轨道片段替换体现，不弹出全局 Toast。

### P1 — 应该实现

- **任务实时进度轮询**：处理中任务通过后端接口定时轮询（间隔 3s），更新进度条百分比；任务状态变为 `success` 或 `failed` 时自动停止轮询
- **登录弹窗**：统一登录/注册入口组件，触发点包括：点击上传、点击做同款、切换至「我的」Tab
- **算力充值弹窗**：算力不足时展示，含充值说明和外链跳转
- **错误态 UI**：上传失败、解析失败、生成失败的完整视觉反馈

### P2 — 可以推迟

- 批量上传：队列式处理多个视频文件
- 字幕导出：下载 SRT / VTT 格式字幕
- 阿拉伯语 RTL 布局完整适配
- 站内任务完成通知（落地页，非剪辑页）
- **剪辑页生成完成 Toast**（若未来需要再做）

---

## 组件清单

### 对口型落地页（`/lipsync`）

| 组件 | 文件位置（建议） | 职责 |
|------|---------------|------|
| `LipSyncHeader` | `src/pages/LipSync/components/` | 导航栏：Logo / 专业剪辑 / 算力 / 头像 / 登录 |
| `LipSyncHero` | `src/pages/LipSync/components/` | Hero 区：品牌视频 + 主副标题 + 上传入口（实现参考：`src/LipSyncPage.tsx` 内联结构） |
| `TypewriterTitle` | `src/LipSyncPage.tsx` | Hero 主标题两段式打字机 |
| `EditorPane` / `hero-editor` | `src/LipSyncPage.tsx` | Hero 内嵌上传后解析 / 台词编辑 / 合成演示区 |
| `lipsyncEditThreshold` | `src/lipsyncEditThreshold.ts` | 台词修改相对原稿偏差阈值（**专业剪辑** `LipSegmentEditor` 使用，默认 ≥35% 禁保存；**落地页 `SegmentItem` 不使用**） |
| `UploadPanel` | `src/pages/LipSync/components/` | 拖拽上传区域 |
| `UploadingPanel` | `src/pages/LipSync/components/` | 上传进度条面板 |
| `ParsingPanel` | `src/pages/LipSync/components/` | 解析圆形进度环面板 |
| `EditingPanel` | `src/pages/LipSync/components/` | 台词编辑区（语言选择 + 台词列表 + 底部操作栏） |
| `GeneratingPanel` | `src/pages/LipSync/components/` | 生成提交成功提示 + 「新建任务」按钮 |
| `SegmentItem` | `src/LipSyncPage.tsx` | 单条台词段落（讲话人 + 时间 + 点击编辑 + 保存/保存中 + 取消；单段字数提醒仅保存后只读态展示） |
| `RecommendTab` | `src/pages/LipSync/components/` | 推荐 Tab：搜索 + 视频卡片网格（列表加载方式按当前接口，不做本分页强约束） |
| `VideoCard` | `src/components/VideoCard/` | 推荐视频卡片（封面 + 标签） |
| `CompareModal` | `src/components/CompareModal/` | 对比播放弹窗（左右双播放器 + 做同款按钮） |
| `MineTab` | `src/pages/LipSync/components/` | 我的 Tab：无限滚动任务列表（无搜索/状态筛选） |
| `TaskCard` | `src/components/TaskCard/` | 单条历史任务卡片（缩略图 + 字段 + 操作按钮 + 进度条） |
| `VideoPreviewModal` | `src/components/VideoPreviewModal/` | 单视频预览弹窗 |

### 专业剪辑页（ProEditor）— 对口型相关

| 组件 | 文件位置（建议） | 职责 |
|------|---------------|------|
| `LipSyncNavItem` | `src/pages/ProEditor/components/` | 左侧导航栏底部 **AI对口型** 图标（`record_voice_over` + AI 徽章），**动态出现** |
| `LipSyncPanel` / `LipSegmentEditor` | `src/ProfessionalEditPage.tsx` | AI对口型操作面板（288px 左侧面板）；台词段落 **点击再编** + 保存/取消 + 与落地页同一阈值模块 |
| `LipSyncIdle` | `src/pages/ProEditor/components/` | 面板空态：「请先选中轨道上的视频片段」 |
| `LipSyncParsing` | `src/pages/ProEditor/components/` | 面板解析态：素材信息 + 圆形进度环 |
| `LipSyncEditing` | `src/pages/ProEditor/components/` | 面板编辑态：语言选择 + 台词列表 + 操作栏 |
| `LipSyncGenerating` | `src/pages/ProEditor/components/` | 面板生成态：进度提示 |
| `LipSyncDone` | `src/pages/ProEditor/components/` | 面板完成态：成功提示 + 关闭按钮 |
| `TrackProgressOverlay` | `src/pages/ProEditor/components/` | V1 轨道片段上的渐变进度条叠加层 |
| `TrackContextMenu` | `src/pages/ProEditor/components/` | 轨道右键上下文菜单（含「AI对口型」选项；实现参考 `ProfessionalEditPage.tsx`） |
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

### 支持语言（8 种，与 V5.7.2 一致）

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

**不在本产品支持范围内**：法语（FR）、德语（DE）—— 文档与需求**勿扩展**至此两种语言。

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
| 接收生成完成 Toast 通知 | **不提供**（凭面板与轨道状态感知完成） |


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
- Hero `TypewriterTitle`（落地页实现）：第一段 ~95ms/ 字，第二段 ~72ms/ 字，完成无删除阶段
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

### 日间模式（`data-theme="light"`）

- **切换**：`useTheme` 写入 `localStorage` 与 `document.documentElement.setAttribute('data-theme', 'light'|'dark')`；样式集中在 `src/index.css` 的 `[data-theme="light"]` 规则。
- **AI 素材首页（`src/App.tsx`，`/`）**  
  - 胶囊参数下拉面板的 DOM 类为 `bg-[#1A1B23]/95`：日间覆写为 **浅色近白浮层**、**深色正文字**、选项 hover 淡紫底；避免与页面浅底冲突。  
  - `btn-primary-gradient`「生成」等：保证 **白字**（避免全局 `[data-theme="light"] .text-white { color: #0f172a }` 误伤主按钮）。
- **对口型落地页**：除上文 Hero / EditorPane / 卡片 / Mine 规则外，`CompareModal` 渐变「做同款」等为 **白字**；须与 `index.css` 中 `.ztk-modal*`、`.lipsync-*` 等 light 覆盖一并维护。

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
- [x] 剪辑页对口型生成完成后是否需要 Toast 通知：**否**，本版本不提供 Toast。
- [x] 法语 / 德语：**不支持**，不纳入本 PRD 语言列表。
- [ ] 阿拉伯语 RTL 布局适配是否纳入 v5.7.5（当前仍列为 P2）
- [ ] 后端 API 接口文档待同步：进度轮询接口 / 做同款台词获取接口
- [ ] 「做同款」台词差距过大的判断阈值（如字符相似度 < 60%）待算法团队定义
- [ ] 推荐 Tab 内容管理后台属于独立系统，不在本 PRD 范围内
- [ ] 算力充值页面 / 套餐方案属于计费系统，本 PRD 仅定义跳转入口
- [ ] 登录 / 注册流程属于账户系统，本 PRD 仅定义触发时机和弹窗入口
- [ ] 剪辑页任务同步的具体 API 设计（共享后端 API）待后端团队确认

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
| V5.7.5 | 2026-04-02 | **范围对齐**：8 种语言、无 FR/DE；「我的」无搜索/筛选；无生成完成 Toast；「我的」含剪辑页发起任务等（见正文）。**文案**：Hero 打字机主标题「讯飞智作」+「，AI对口型一步到位」（单行）；副标题「多语种真实对口型视频，让您的视频全球发声。」；脚注「如发现解析不准确…」及「专业剪辑」链至 `/professional-edit`。**Hero `EditorPane`**：脚注固底、台词区滚动；段播放/暂停/续播；高亮仅播放中；点编辑暂停。**日间**：编辑卡片/段播放钮/脚注浅紫；卡片叠字与 Mine 渐变按钮白字；首页胶囊下拉浅色浮层 + 生成按钮白字。**PRD** 新增「Hero 内嵌台词演示区」「日间模式」小节。 |
| V5.7.5-rev1 | 2026-04-02 | **实现对齐（落地页）**：**时间轴**改为分段时间条（无 Mock 胶片帧）；**`SegmentItem`** 落地页不启用 `lipsyncEditThreshold`；**单段字数**超限提示仅在该段 **保存后、非编辑** 展示，**解析阶段**与**编辑中草稿**不展示；**总字数**仍顶栏提示；**合成视频** 在超限 / 保存中 / 未关闭段落编辑时禁用；**保存** 有「保存中」态；**InfoTip** 紫色 i + 浅色浮层黑字；**`DemoVideoCard`** 移除「做同款」；**`MineCard`** 时长 Chip **仅成功**态展示。详见「Hero 内嵌台词演示区」正文。 |

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
