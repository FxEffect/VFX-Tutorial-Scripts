# 视频脚本工具 (script.js) - 程序说明文档

### 1. 概述

`script.js` 是一个为视频脚本规划页面 `(视频脚本：10分钟打造炫酷火焰命中特效v2.html)` 提供完全交互能力的客户端脚本。它将一个静态的 HTML 页面转变为一个功能丰富的 Web 应用，主要实现了以下核心功能：

*   **进度跟踪**: 自动计算并显示“录视频”和“配音”的完成度。
*   **数据持久化**: 所有任务进度和编辑的文本内容都会自动保存在浏览器的 `localStorage` 中，刷新页面不会丢失工作。
*   **双击编辑**: 用户可以直接在网页上双击表格单元格来编辑脚本内容。
*   **动态格式化**: 自动高亮特定关键词（如 `[操作]`）并为英文短语添加点击朗读功能。
*   **导入/导出**: 支持将整个脚本（包括内容和进度）导出为人类可读的 Markdown 文件，并能从该文件完美恢复页面状态。

### 2. 核心架构与设计

脚本的执行起点是 `DOMContentLoaded` 事件，确保在操作 DOM 之前，所有 HTML 元素都已加载完毕。

**初始化流程 (`DOMContentLoaded`):**

1.  `assignEditableIds()`: **(关键步骤)** 遍历所有可编辑单元格 (`.editable`)，并根据其在文档中的位置（表格索引、行索引、列索引）生成一个唯一的 `data-editable-id` 属性。这个 ID 是数据持久化和导入/导出功能的基石。
2.  `loadEditableContent()`: 从 `localStorage` 读取已保存的单元格内容，并恢复到页面上。
3.  `loadProgress()`: 从 `localStorage` 读取所有复选框的勾选状态，并恢复到页面上。
4.  `applyAllFormatting()`: 对所有可编辑单元格执行一次动态格式化，渲染出高亮标签和朗读短语。
5.  **设置初始状态**: 默认展开所有可折叠内容，并为所有交互元素绑定事件监听器。

### 3. 功能模块详解

#### 3.1 数据持久化 (LocalStorage)

*   **`storageKeyProgress` (`fireEffectChecklistProgressV3`)**: 用于存储所有任务复选框 (`.task-checkbox`) 的勾选状态。数据被保存为一个布尔值数组。
*   **`storageKeyContent` (`fireEffectEditableContentV3`)**: 用于存储所有被编辑过的单元格内容。数据被保存为一个对象，`key` 是单元格的 `data-editable-id`，`value` 是单元格的 `innerHTML`。
*   **`saveProgress()` / `loadProgress()`**: 负责复选框进度的存取。
*   **`saveEditableContent()` / `loadEditableContent()`**: 负责单元格内容的存取。
*   **`resetProgress()`**: 清除上述两个 `localStorage` 条目并刷新页面，恢复到初始状态。

#### 3.2 进度跟踪与 UI 更新

*   **`updateProgress()`**: 计算两类复选框（`video` 和 `audio`）的勾选比例，并更新顶部的进度条和百分比文本。
*   **`updateGroupTitleState()`**: 检查一个章节/分组内的所有任务是否都已完成。如果完成，则在该分组的标题旁显示一个 "✓" 符号。
*   **`updateAllGroupTitleStates()`**: 遍历并更新所有分组的完成状态。

#### 3.3 双击编辑 (`makeCellEditable`)

当用户双击一个 `.editable` 单元格时：
1.  使用 `htmlToMarkdown()` 函数将单元格的 HTML 内容（如 `<strong>`）转换为 Markdown 文本（如 `**`），提供更友好的编辑体验。
2.  创建一个 `<textarea>` 元素，并用 Markdown 文本填充它。
3.  监听 `blur` (失去焦点) 和 `Enter` 键以保存编辑。保存时，使用 `markdownToHtml()` 将文本转回 HTML。
4.  监听 `Escape` 键以取消编辑。
5.  编辑保存后，会调用 `saveEditableContent()` 将新内容持久化。

#### 3.4 导入/导出功能

这是本工具最核心的功能之一，实现了工作的可移植性。

*   **导出 (`exportToMarkdown`)**:
    1.  **构建 YAML Front Matter**: 在文件头部生成包含版本、导出日期和当前进度的元数据。
    2.  **遍历 DOM**: 依次遍历页面中的章节标题 (`h2`, `h3`) 和表格 (`table`)。
    3.  **生成 Markdown 表格**:
        *   对于每一行 (`.task-row`)，提取其“录视频”和“配音”的勾选状态。
        *   提取第一个可编辑单元格的 `data-editable-id`。
        *   将这些元数据组合成一个**HTML 注释**：`<!-- id:editable-X-Y-Z video:checked audio:unchecked -->`。
        *   将该注释和所有单元格的内容拼接成一个 Markdown 表格行。
    4.  **触发下载**: 将所有拼接好的字符串组合成一个 `.md` 文件，并让浏览器下载它。

*   **导入 (`handleMarkdownImport` -> `parseAndApplyMarkdown`)**:
    1.  **读取文件**: 使用 `FileReader` 读取用户选择的 `.md` 文件内容。
    2.  **解析内容**:
        *   逐行读取文件。
        *   使用正则表达式 `metadataRegex` 匹配并提取每一行中的 HTML 注释，从而获得 `id` 和 `checked` 状态。
    3.  **更新页面**:
        *   根据提取到的 `id`，精确定位到页面上对应的单元格及其所在行。
        *   更新该行复选框的勾选状态。
        *   解析 Markdown 表格行的其余部分，并将内容更新回对应的单元格。
    4.  **刷新状态**: 导入完成后，统一调用 `save...` 和 `update...` 系列函数，将新状态保存到 `localStorage` 并刷新整个页面的 UI。

### 4. 如何修改与扩展

*   **添加/删除任务行**:
    *   **非常简单**。您只需要在 HTML 的 `<tbody>` 中直接添加或删除 `<tr>` 元素即可。只要新行遵循现有的 `class` 结构（如 `.task-row`, `.editable`, `.task-checkbox`），脚本会在页面加载时自动识别并使其具备所有交互功能。**无需修改任何 JavaScript 代码**。

*   **添加新的章节/分组**:
    *   同样，只需在 HTML 中复制现有的卡片 (`<div class="card" data-group-container>...</div>`) 或章节结构，然后修改标题和表格内容即可。脚本会自动处理新的分组。

*   **修改高亮标签 (`highlightTags`)**:
    *   要添加新的高亮标签（例如 `[新标签]`），只需修改 `highlightTags` 函数中的 `tagClasses` 对象，并添加对应的 CSS 样式到 `style.css` 文件。
    *   例如，添加 `'新标签': 'tag-new'`，然后在 `style.css` 中定义 `.tag-new` 的样式。

*   **调整导入/导出逻辑**:
    *   如果未来需要增删元数据（例如添加“审阅状态”），需要同步修改 `exportToMarkdown` 和 `parseAndApplyMarkdown` 两个函数。
    *   在 `exportToMarkdown` 中添加新的元数据到 HTML 注释里。
    *   在 `parseAndApplyMarkdown` 中更新正则表达式 `metadataRegex` 以提取新的元数据，并编写相应的页面更新逻辑。
