<<<<<<< HEAD
# 视频脚本管理器

## 1. 概述 (Overview)

本项目是一个用于创建、管理和追踪视频脚本进度的单页应用程序 (Single-Page Application)。它以 Markdown 文件为核心数据源，通过简洁的界面，帮助内容创作者高效地管理多个视频脚本。

**核心功能:**
*   **多脚本管理**: 在一个界面中管理所有脚本，通过右侧导航栏轻松切换。
*   **Markdown 驱动**: 每个脚本都是一个独立的 `.md` 文件，易于在任何文本编辑器中查看和修改。
*   **进度追踪**: (功能开发中) 自动计算和可视化每个脚本的制作和配音进度。
*   **数据持久化**: 所有导入的脚本都保存在浏览器本地，刷新页面不会丢失工作。
*   **导入/导出**: 轻松导入符合规范的 `.md` 脚本文件，并能将当前进度导出保存。

---

## 2. 如何运行 (How to Run)

**重要提示**: 由于浏览器对 JavaScript 模块的 CORS 安全策略限制，您不能再直接通过双击 `index.html` 文件来运行本项目。

您必须通过一个本地 Web 服务器来访问 `index.html`。

**推荐方式: VS Code Live Server**

1.  在 VS Code 编辑器中，安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 插件。
2.  安装后，在 VS Code 的文件浏览器中右键点击 `index.html` 文件。
3.  选择 `Open with Live Server`。
4.  浏览器将自动打开并访问正确的地址 (通常是 `http://127.0.0.1:5500/index.html`)。

**备选方式: Python 本地服务器**

如果您的电脑安装了 Python，也可以使用其内置的 http 服务器：

1.  在项目根目录 (`VFX Tutorial Scripts`) 打开您的命令行工具。
2.  运行命令: `python -m http.server`
3.  在浏览器中手动访问地址: `http://localhost:8000`

---

## 3. 项目结构 (Project Structure)

```
d:\work\VFX Tutorial Scripts\
├── js/                     # 存放所有模块化的 JavaScript 代码
│   ├── main.js             # 程序主入口和协调器
│   ├── ui.js               # 负责所有UI渲染和DOM操作
│   ├── parser.js           # 负责解析和序列化 Markdown 文件
│   ├── storage.js          # 负责与浏览器本地存储交互
│   └── events.js           # 负责绑定和处理所有用户事件
├── index.html              # 应用的唯一主页 (HTML外壳)
├── style.css               # 全局样式表
├── SCRIPT_MARKDOWN_GUIDE.md  # 【重要】视频脚本 .md 文件的格式规范
└── README.md               # 本文档
```

---

## 4. 工作流程 (Workflow)

1.  **创建脚本**: 参考 `SCRIPT_MARKDOWN_GUIDE.md` 的规范，创建一个或多个 `.md` 格式的视频脚本文件。
2.  **启动应用**: 使用上文“如何运行”中的任意一种方法，启动本地服务器并打开应用。
3.  **导入脚本**: 在应用右侧的导航栏中，点击 `[+] 导入新脚本` 按钮，选择您创建的 `.md` 文件。
4.  **管理脚本**: 
    *   在右侧列表中点击不同的脚本标题，可以在它们之间自由切换。
    *   (功能开发中) 在左侧主内容区对脚本内容进行修改和进度勾选。
5.  **导出/删除**: 使用右侧导航栏的 `[↓] 导出当前脚本` 或 `[🗑️] 删除当前脚本` 按钮来管理您的脚本库。
=======
# VFX-Tutorial-Scripts
>>>>>>> 1e0b5507fcfd2c859ee9af2195ab8d361a19e729
