# 幻境 · AI 角色扮演

<p align="center">
  <img src="public/favicon.svg" alt="幻境 Logo" width="80" height="80">
</p>

<p align="center">
  <strong>沉浸式 AI 角色扮演聊天应用</strong>
</p>

<p align="center">
  <a href="#功能">功能</a> · <a href="#使用说明">使用说明</a> · <a href="#技术栈">技术栈</a> · <a href="#角色列表">角色列表</a> · <a href="#开发">开发</a>
</p>

---

## 截图

> 📸 截图占位 — 可替换为实际截图

| 浅色主题 | 深色主题 |
|---------|---------|
| ![Light](https://via.placeholder.com/400x250?text=浅色主题截图) | ![Dark](https://via.placeholder.com/400x250?text=深色主题截图) |

## 功能

- 🎭 **角色系统** — 5 个内置角色（林晚星、江寻、艾莉丝、露娜、铁拳），支持自定义创建/编辑角色
- 📖 **世界书** — 关键词触发的世界知识注入，支持常驻注入模式
- 🧠 **分层记忆** — 全局核心记忆 + 临时笔记，角色独立记忆，AI 自动提取记忆
- 📊 **状态面板** — 世界状态、角色属性、物品栏、自定义状态，AI 自动更新
- 📝 **对话摘要** — 超长对话自动总结，支持手动触发总结
- 🔌 **多 API 支持** — DeepSeek / OpenAI / Claude / 通义千问 / 豆包 / Ollama / 自定义
- 💾 **API 配置方案** — 保存多套 API 配置，一键切换
- 🎨 **4 种主题** — 浅色 / 深色 / 琥珀 / 绯红
- 📱 **移动端适配** — 响应式布局 + 底部导航栏
- 📤 **数据导出/导入** — 完整数据备份与恢复
- ⌨️ **快捷键** — Ctrl+N 新建 / Ctrl+K 选角色 / Ctrl+/ 侧边栏 / Esc 关闭弹窗
- 🎤 **语音输入** — Web Speech API 语音识别（支持时自动显示）
- 📦 **PWA 支持** — Service Worker 离线缓存，可安装为桌面应用
- 💽 **IndexedDB 存储** — 突破 localStorage 5MB 限制，自动迁移旧数据

## 使用说明

### 在线访问

部署到 GitHub Pages 后直接访问即可。

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 首次使用

1. 点击左上角「☰」→「设置」
2. 选择模型厂商（推荐 DeepSeek，免费 500 万 Token）
3. 填入 API Key
4. 点击「选择角色」开始对话

## 技术栈

| 技术 | 说明 |
|------|------|
| Vanilla JS (ES Module) | 无框架，原生 JavaScript 模块化 |
| Vite 6 | 构建工具，开发热更新 |
| IndexedDB | 大容量本地存储（替代 localStorage） |
| Service Worker | PWA 离线缓存 |
| Marked.js (CDN) | Markdown 渲染 |
| highlight.js (CDN) | 代码高亮 |
| KaTeX (CDN) | 数学公式渲染 |
| DOMPurify (CDN) | XSS 防护 |
| Font Awesome (CDN) | 图标库 |
| GitHub Actions | 自动部署到 Pages |

## 角色列表

| 角色 | 头像 | 类型 | 描述 |
|------|------|------|------|
| 林晚星 | 🌸 | 校园日常 | 温柔软萌的青梅竹马少女 |
| 江寻·故事模式 | 🏀 | 校园日常 | 第一人称男性向多角色故事 |
| 艾莉丝 | ⚔️ | 奇幻冒险 | 傲娇少女剑士，被冤枉的逃亡骑士 |
| 露娜 | 🌙 | 奇幻神秘 | 温柔神秘的月之女祭司 |
| 铁拳 | 👊 | 奇幻冒险 | 豪爽直率的矮人战士 |

所有角色均支持完整的系统提示词、状态面板、开场白配置，并可自定义编辑。

## 项目结构

```
roleplay-ai-refactored/
├── public/          # 静态资源
├── src/
│   ├── main.js      # 入口
│   ├── style.css    # 全局样式
│   └── modules/     # 功能模块
│       ├── state.js       # 状态管理
│       ├── storage.js     # IndexedDB 存储层
│       ├── persistence.js # 持久化（调用 storage.js）
│       ├── theme.js       # 主题切换
│       ├── toast.js       # 提示消息
│       ├── conversations.js # 对话管理
│       ├── characters.js  # 角色管理 + 默认角色
│       ├── worldbook.js   # 世界书
│       ├── status.js      # 状态面板
│       ├── prompt.js      # 系统提示词构建
│       ├── summary.js     # 对话摘要
│       ├── chat.js        # 聊天核心
│       ├── markdown.js    # Markdown/KaTeX 渲染
│       ├── memory.js      # 记忆面板
│       ├── providers.js   # API 厂商配置
│       ├── profiles.js    # API 配置方案
│       ├── export.js      # 导出/导入
│       ├── modals.js      # 弹窗辅助
│       ├── render.js      # 消息渲染
│       └── init.js        # 初始化 + 事件绑定
└── .github/workflows/ # CI/CD
```

## 从 v1 迁移

v2 自动从 localStorage 迁移数据到 IndexedDB，无需手动操作。首次打开时旧数据会自动迁移并删除 localStorage 中的副本。

## License

MIT License
