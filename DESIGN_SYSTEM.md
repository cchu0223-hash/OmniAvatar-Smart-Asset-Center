# 讯飞智作 - 设计系统文档

> **版本**: 1.0.0
> **最后更新**: 2026-02-28
> **维护者**: Design Team

---

## 📋 目录

1. [设计原则](#设计原则)
2. [颜色系统](#颜色系统)
3. [字体系统](#字体系统)
4. [间距系统](#间距系统)
5. [组件规范](#组件规范)
6. [动画规范](#动画规范)
7. [响应式断点](#响应式断点)
8. [图标系统](#图标系统)

---

## 🎨 设计原则

### 核心理念
- **专业科技感**: 深色背景 + 霓虹光效 + 玻璃态材质
- **直观易用**: 清晰的视觉层级，流畅的交互反馈
- **品质感**: 精致的细节处理，专业的动画效果
- **一致性**: 统一的视觉语言和交互模式

### 设计关键词
`AI驱动` `专业工具` `科技美学` `沉浸式体验`

---

## 🎨 颜色系统

### 主色调 (Primary Colors)

#### 主页配色方案
```css
/* 强调色 - 青色 */
--accent-cyan: #00f0ff;
--accent-cyan-rgb: 0, 240, 255;

/* 强调色 - 紫色 */
--accent-purple: #7000ff;
--accent-purple-rgb: 112, 0, 255;

/* 背景色 */
--background-dark: #0B0C10;
--surface-dark: #13141C;
--surface-lighter: #1F212D;
```

#### 分镜页配色方案
```css
/* 强调色 - 青色（稍暖） */
--primary-cyan: #00f2ea;
--primary-cyan-rgb: 0, 242, 234;

/* 强调色 - 紫色（稍亮） */
--secondary-purple: #7d00ff;
--secondary-purple-rgb: 125, 0, 255;

/* 背景色（更深） */
--background-deep: #050505;
--surface-glass: #121212;
```

### 中性色 (Neutral Colors)

```css
/* 文字颜色 */
--text-primary: #ffffff;
--text-primary-rgb: 255, 255, 255;

--text-secondary: rgba(255, 255, 255, 0.90);
--text-tertiary: rgba(255, 255, 255, 0.70);
--text-disabled: rgba(255, 255, 255, 0.40);
--text-placeholder: rgba(255, 255, 255, 0.30);

/* 边框颜色 */
--border-subtle: rgba(255, 255, 255, 0.05);
--border-light: rgba(255, 255, 255, 0.10);
--border-medium: rgba(255, 255, 255, 0.15);
--border-strong: rgba(255, 255, 255, 0.20);
```

### 语义色 (Semantic Colors)

```css
/* 成功 */
--color-success: #00f2ea;
--color-success-bg: rgba(0, 242, 234, 0.10);

/* 警告 */
--color-warning: #fbbf24;
--color-warning-bg: rgba(251, 191, 36, 0.10);

/* 错误 */
--color-error: #ef4444;
--color-error-bg: rgba(239, 68, 68, 0.10);

/* 信息 */
--color-info: #7000ff;
--color-info-bg: rgba(112, 0, 255, 0.10);
```

### 渐变 (Gradients)

```css
/* 主要渐变 - 青紫渐变 */
--gradient-primary: linear-gradient(135deg, #00f0ff 0%, #7000ff 100%);
--gradient-primary-hover: linear-gradient(135deg, #00f0ff 0%, #7000ff 100%);

/* 背景渐变 */
--gradient-background: linear-gradient(to bottom right, #0a0a0c, #111115);

/* 玻璃态渐变 */
--gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);

/* 霓虹边框渐变 */
--gradient-neon-border: linear-gradient(90deg, #00f0ff, #7000ff);
```

### 颜色使用规范

| 场景 | 颜色 | 示例 |
|-----|-----|-----|
| 主要操作按钮 | gradient-primary | 生成视频、生成分镜 |
| 次要操作按钮 | white/5 + border-light | 保存草稿、取消 |
| 激活状态 | accent-cyan / primary-cyan | 选中的场景、tab |
| 悬停状态 | accent-cyan/50 | 按钮hover |
| 禁用状态 | text-disabled | 不可用选项 |
| 背景遮罩 | rgba(11,12,16,0.95) | 加载动效、模态框 |

---

## 📝 字体系统

### 字体族 (Font Family)

```css
/* 主字体 - Inter */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* 等宽字体 - 用于时间、数字 */
font-family: 'Inter', 'SF Mono', 'Monaco', 'Courier New', monospace;
```

### 引入方式

```html
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
```

### 字体大小 (Font Size)

| 名称 | 大小 | 行高 | 用途 |
|-----|-----|-----|-----|
| display-xl | 48px / 3rem | 1.2 | 大标题 |
| display-lg | 40px / 2.5rem | 1.2 | 页面标题 |
| heading-1 | 32px / 2rem | 1.3 | 一级标题 |
| heading-2 | 24px / 1.5rem | 1.4 | 二级标题 |
| heading-3 | 20px / 1.25rem | 1.4 | 三级标题 |
| heading-4 | 18px / 1.125rem | 1.4 | 四级标题 |
| body-lg | 16px / 1rem | 1.6 | 大正文 |
| body | 14px / 0.875rem | 1.6 | 正文 |
| body-sm | 12px / 0.75rem | 1.5 | 小正文 |
| caption | 11px / 0.6875rem | 1.4 | 辅助文字 |
| overline | 10px / 0.625rem | 1.4 | 标签、角标 |

### 字重 (Font Weight)

```css
--font-light: 300;      /* 轻量，用于大段文字 */
--font-regular: 400;    /* 常规 */
--font-medium: 500;     /* 中等，用于强调 */
--font-semibold: 600;   /* 半粗，用于小标题 */
--font-bold: 700;       /* 粗体，用于标题 */
```

### 字体使用规范

```css
/* 页面主标题 */
.page-title {
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

/* 卡片标题 */
.card-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* 正文 */
.body-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
}

/* 按钮文字 */
.button-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* 标签/小标题 */
.label-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

---

## 📏 间距系统

### 基础间距单位

采用 **8px 基础网格系统**：

```css
/* Spacing Scale - 8px 基础 */
--space-0: 0px;
--space-1: 4px;    /* 0.25rem */
--space-2: 8px;    /* 0.5rem */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem */
--space-8: 32px;   /* 2rem */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem */
--space-16: 64px;  /* 4rem */
--space-20: 80px;  /* 5rem */
--space-24: 96px;  /* 6rem */
--space-32: 128px; /* 8rem */
```

### Tailwind 对应表

| CSS Variable | Tailwind Class | 像素值 |
|-------------|----------------|--------|
| space-1 | p-1, m-1, gap-1 | 4px |
| space-2 | p-2, m-2, gap-2 | 8px |
| space-3 | p-3, m-3, gap-3 | 12px |
| space-4 | p-4, m-4, gap-4 | 16px |
| space-6 | p-6, m-6, gap-6 | 24px |
| space-8 | p-8, m-8, gap-8 | 32px |

### 组件内边距规范

```css
/* 按钮 */
--button-padding-sm: 8px 12px;     /* py-2 px-3 */
--button-padding-md: 10px 16px;    /* py-2.5 px-4 */
--button-padding-lg: 12px 24px;    /* py-3 px-6 */

/* 输入框 */
--input-padding: 12px 16px;        /* py-3 px-4 */

/* 卡片 */
--card-padding: 24px;              /* p-6 */
--card-padding-lg: 32px;           /* p-8 */

/* 容器 */
--container-padding: 24px;         /* px-6 */
--container-padding-lg: 80px;      /* lg:px-20 */
```

### 间距使用规范

| 场景 | 间距 | Tailwind |
|-----|-----|----------|
| 图标与文字 | 8px | gap-2 |
| 按钮内元素 | 8px | gap-2 |
| 表单字段之间 | 16px | space-y-4 |
| 卡片之间 | 16px | gap-4 |
| 区块之间 | 24px | gap-6 |
| 页面section | 48px | gap-12 |
| 页面顶部/底部 | 96px | py-24 |

---

## 🧩 组件规范

### 1. 按钮 (Button)

#### 主要按钮 (Primary Button)
```css
.btn-primary-gradient {
  background: linear-gradient(135deg, #00f0ff 0%, #7000ff 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(112, 0, 255, 0.4);
  transition: all 0.3s ease;
}

.btn-primary-gradient:hover {
  box-shadow: 0 0 30px rgba(0, 240, 255, 0.6);
  transform: translateY(-1px);
  filter: brightness(1.1);
}

.btn-primary-gradient:active {
  transform: scale(0.95);
}
```

#### 次要按钮 (Secondary Button)
```css
.btn-neon-border {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.90);
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-neon-border:hover {
  border-color: rgba(0, 240, 255, 0.5);
  box-shadow: 0 0 15px rgba(0, 240, 255, 0.15);
  background: rgba(0, 240, 255, 0.05);
  color: #00f0ff;
}
```

#### 文本按钮 (Text Button)
```css
.btn-text {
  background: transparent;
  color: rgba(255, 255, 255, 0.70);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-text:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}
```

---

### 2. 输入框 (Input)

#### 玻璃态输入框
```css
.glass-input {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.glass-input:focus {
  border-color: #00f2ea;
  box-shadow: 0 0 0 1px rgba(0, 242, 234, 0.2);
  background: rgba(0, 0, 0, 0.6);
  outline: none;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
```

#### 发光边框输入框
```css
.input-glow-border {
  position: relative;
  background: rgba(31, 33, 45, 0.6);
  border-radius: 16px;
  z-index: 1;
}

.input-glow-border::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  padding: 1px;
  background: linear-gradient(45deg, rgba(0, 240, 255, 0.3), rgba(112, 0, 255, 0.3), transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

---

### 3. 玻璃态面板 (Glass Panel)

#### 高级玻璃态
```css
.glass-panel-premium {
  background: rgba(19, 20, 28, 0.4);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow:
    0 0 0 1px rgba(0, 240, 255, 0.1),
    0 20px 50px -10px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
}

.glass-panel-premium::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(125deg, rgba(0, 240, 255, 0.03) 0%, rgba(112, 0, 255, 0.03) 100%);
  pointer-events: none;
  z-index: 0;
}

.glass-panel-premium::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.5), transparent);
  z-index: 1;
}
```

#### 标准玻璃态
```css
.glass-panel {
  background: rgba(18, 18, 18, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

---

### 4. 下拉菜单 (Dropdown)

```css
.dropdown-container {
  position: relative;
  z-index: 100;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  min-width: 180px;
  border-radius: 12px;
  background: #1A1B23;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 9999;
}

.dropdown-item {
  padding: 12px 16px;
  font-size: 14px;
  color: white;
  transition: background 0.2s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.dropdown-item.active {
  background: rgba(0, 242, 234, 0.1);
  color: #00f2ea;
  font-weight: 600;
}
```

---

### 5. 滑块 (Slider)

```css
.custom-slider {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  appearance: none;
  cursor: pointer;
}

.custom-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #00f2ea;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 242, 234, 0.6);
  transition: transform 0.2s ease;
}

.custom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
```

---

### 6. 上传框 (Upload Box)

```css
.upload-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

.upload-box:hover {
  border-color: #00f2ea;
  background: rgba(0, 242, 234, 0.05);
}
```

---

## 🎬 动画规范

### 过渡时长 (Transition Duration)

```css
--duration-instant: 100ms;   /* 即时反馈 */
--duration-fast: 150ms;      /* 快速交互 */
--duration-normal: 200ms;    /* 标准过渡 */
--duration-slow: 300ms;      /* 慢速展示 */
--duration-slower: 500ms;    /* 页面过渡 */
```

### 缓动函数 (Easing)

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 常用动画

#### 呼吸脉冲
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### 浮动
```css
@keyframes float {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, -20px) rotate(5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
}

.shape-blob {
  animation: float 10s ease-in-out infinite;
}
```

#### 闪烁
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 3s infinite;
}
```

#### 弹跳
```css
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
```

### 动画使用规范

| 交互类型 | 时长 | 缓动 |
|---------|-----|------|
| 按钮点击 | 100ms | ease-out |
| 悬停效果 | 200ms | ease-out |
| 下拉展开 | 150ms | ease-out |
| 页面过渡 | 300ms | ease-in-out |
| 模态框 | 200ms | ease-out |
| 加载动效 | 2000ms | ease-in-out |

---

## 📱 响应式断点

```css
/* Mobile First 策略 */
--breakpoint-sm: 640px;   /* 手机横屏 */
--breakpoint-md: 768px;   /* 平板竖屏 */
--breakpoint-lg: 1024px;  /* 平板横屏/小笔记本 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大屏 */
```

### Tailwind 断点对应

```css
/* Tailwind 响应式前缀 */
sm:   /* @media (min-width: 640px) */
md:   /* @media (min-width: 768px) */
lg:   /* @media (min-width: 1024px) */
xl:   /* @media (min-width: 1280px) */
2xl:  /* @media (min-width: 1536px) */
```

### 响应式设计建议

```css
/* 容器宽度 */
.container {
  max-width: 100%;
  padding: 0 24px;
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
    padding: 0 40px;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1200px;
    padding: 0 80px;
  }
}
```

---

## 🎯 图标系统

### Material Symbols Outlined

**引入方式：**
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

### 图标大小规范

| 用途 | 大小 | Class |
|-----|-----|-------|
| 小图标 | 16px | text-sm |
| 标准图标 | 20px | text-base |
| 大图标 | 24px | text-xl |
| 特大图标 | 32px | text-3xl |

### 图标使用示例

```html
<!-- 填充图标 -->
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">
  star
</span>

<!-- 轮廓图标 -->
<span class="material-symbols-outlined">
  settings
</span>
```

### 常用图标列表

```
movie_filter      - Logo
videocam          - 视频
person            - 数字人
movie             - 短视频
bolt              - 算力
stars             - 积分
add_photo_alternate - 上传图片
lightbulb         - 示例
auto_fix_high     - 优化
neurology         - AI模型
aspect_ratio      - 比例
timer             - 时长
play_circle       - 播放
school            - 学习
workspace_premium - 会员
collections       - 作品
```

---

## 📐 圆角系统

```css
--radius-sm: 8px;      /* 0.5rem - 小元素 */
--radius-md: 12px;     /* 0.75rem - 按钮、输入框 */
--radius-lg: 16px;     /* 1rem - 卡片 */
--radius-xl: 24px;     /* 1.5rem - 大卡片 */
--radius-2xl: 32px;    /* 2rem - 容器 */
--radius-full: 9999px; /* 圆形/胶囊 */
```

### Tailwind 对应

```css
rounded-lg   = 16px
rounded-xl   = 24px
rounded-2xl  = 32px
rounded-full = 9999px
```

---

## 🎭 阴影系统

```css
/* 微小阴影 - 悬浮元素 */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* 标准阴影 - 卡片 */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* 大阴影 - 模态框 */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);

/* 超大阴影 - 抽屉 */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4);

/* 霓虹阴影 */
--shadow-neon: 0 0 10px rgba(0, 242, 234, 0.4),
               0 0 20px rgba(125, 0, 255, 0.3);

/* 锐利阴影 - 专业工具 */
--shadow-sharp: 0 4px 6px -1px rgba(0, 0, 0, 0.5),
                0 2px 4px -1px rgba(0, 0, 0, 0.3);
```

---

## ✅ 可访问性 (Accessibility)

### 对比度要求

- **正文文字**: 最小对比度 4.5:1
- **大号文字**: 最小对比度 3:1
- **图标**: 最小对比度 3:1

### 焦点状态

```css
.focusable:focus {
  outline: 2px solid #00f2ea;
  outline-offset: 2px;
}

.focusable:focus-visible {
  outline: 2px solid #00f2ea;
  outline-offset: 2px;
}
```

### ARIA 标签规范

```html
<!-- 按钮 -->
<button aria-label="生成视频">
  <span class="material-symbols-outlined">play_circle</span>
</button>

<!-- 输入框 -->
<input aria-label="上传参考图片" type="file" />

<!-- 下拉菜单 -->
<div role="menu" aria-label="模型选择器">
  <button role="menuitem">Seedance 2.0 Fast</button>
</div>
```

---

## 📚 设计资源

### 设计工具
- **Figma**: 原型设计
- **Adobe XD**: 交互设计
- **Sketch**: UI设计

### 辅助工具
- **Coolors**: 配色方案
- **Google Fonts**: 字体选择
- **Material Icons**: 图标库

### 参考资源
- [Material Design 3](https://m3.material.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Refactoring UI](https://www.refactoringui.com/)

---

## 🔄 版本历史

| 版本 | 日期 | 变更内容 |
|-----|-----|---------|
| 1.0.0 | 2026-02-28 | 初始版本，定义核心设计系统 |

---

## 📝 贡献指南

如需更新设计系统，请遵循以下流程：

1. 在团队会议中提出变更建议
2. 获得设计团队批准
3. 更新本文档
4. 更新组件库实现
5. 通知开发团队

---

**维护团队**: Design Team @ 讯飞智作
**联系方式**: design@xunfei.com
**最后审核**: 2026-02-28
