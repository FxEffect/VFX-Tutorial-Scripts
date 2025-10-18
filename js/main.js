// Main Module: Orchestrates the application

import * as storage from './storage.js';
import * as parser from './parser.js';
import * as ui from './ui.js';
import { initializeEventListeners } from './events.js';

// --- State ---
let allScripts = {};
let activeScriptId = null;

// --- Mock Data for Development ---
const MOCK_SCRIPTS = {
    "free-lesson-1-v2": {
        id: "free-lesson-1-v2",
        title: "10分钟火焰命中特效v2",
        metadata: { scriptId: "free-lesson-1-v2", title: "10分钟火焰命中特效v2" },
        content: "# 10分钟火焰命中特效v2..."
    },
    "paid-lesson-1-v1": {
        id: "paid-lesson-1-v1",
        title: "UE5高级冰霜特效",
        metadata: { scriptId: "paid-lesson-1-v1", title: "UE5高级冰霜特效" },
        content: "# UE5高级冰霜特效..."
    },
    "paid-lesson-2-v1": {
        id: "paid-lesson-2-v1",
        title: "程序化生成闪电",
        metadata: { scriptId: "paid-lesson-2-v1", title: "程序化生成闪电" },
        content: "# 程序化生成闪电..."
    }
};

// --- Core Functions ---

/**
 * Loads a script into the main view and updates the UI.
 * @param {string} scriptId - The ID of the script to load.
 */
function loadScript(scriptId) {
    if (!allScripts[scriptId]) {
        console.error(`Attempted to load non-existent script: ${scriptId}`);
        ui.showWelcomeMessage();
        return;
    }
    
    activeScriptId = scriptId;
    window.location.hash = scriptId; // Update URL
    
    const scriptObject = allScripts[scriptId];
    
    ui.renderScriptContent(scriptObject);
    ui.renderScriptList(allScripts, activeScriptId); // Re-render list to update active state
    ui.showScriptContent();
}

// --- Event Handlers ---

const app = {
    handleScriptSelect(scriptId) {
        if (scriptId !== activeScriptId) {
            loadScript(scriptId);
        }
    },

    handleFileImport(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const scriptObject = parser.parseMarkdown(content);
                
                if (allScripts[scriptObject.id] && !confirm(`脚本ID "${scriptObject.id}" 已存在。是否要覆盖它？`)) {
                    return; // User cancelled overwrite
                }

                allScripts[scriptObject.id] = scriptObject;
                storage.saveAllScripts(allScripts);
                alert(`脚本 "${scriptObject.title}" 已成功导入！`);
                loadScript(scriptObject.id);

            } catch (error) {
                console.error('Failed to import markdown file:', error);
                alert(`导入失败: ${error.message}`);
            }
        };
        reader.readAsText(file, 'UTF-8');
    },

    handleExport() {
        if (!activeScriptId || !allScripts[activeScriptId]) {
            alert("没有可导出的活动脚本。");
            return;
        }
        // This is a simplified version. The real one will be more complex.
        const scriptObject = allScripts[activeScriptId];
        const markdownString = parser.serializeToMarkdown(scriptObject);
        
        const blob = new Blob([markdownString], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${scriptObject.title.slice(0, 20)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    handleDelete() {
        if (!activeScriptId) {
            alert("没有活动的脚本可供删除。");
            return;
        }
        if (confirm(`您确定要删除脚本 "${allScripts[activeScriptId].title}" 吗？此操作不可撤销。`)) {
            delete allScripts[activeScriptId];
            storage.saveAllScripts(allScripts);
            activeScriptId = null;
            init(); // Re-initialize the app state
        }
    },

    handleResetAll() {
        if (confirm("警告：您确定要删除所有已导入的脚本数据吗？此操作不可撤销！")) {
            storage.deleteAllScripts();
            allScripts = {};
            activeScriptId = null;
            init(); // Re-initialize the app state
        }
    }
};

// --- Initialization ---

function init() {
    let data = storage.loadAllScripts();
    // If storage is empty, load mock data for demonstration
    if (Object.keys(data).length === 0) {
        data = MOCK_SCRIPTS;
    }
    allScripts = data;

    initializeEventListeners(app);

    const scriptIdFromUrl = window.location.hash.substring(1);
    
    if (allScripts[scriptIdFromUrl]) {
        loadScript(scriptIdFromUrl);
    } else {
        const firstScriptId = Object.keys(allScripts)[0];
        if (firstScriptId) {
            loadScript(firstScriptId);
        } else {
            ui.renderScriptList({});
            ui.showWelcomeMessage();
        }
    }
}

// Start the application
init();
