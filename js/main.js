// Main Module: Orchestrates the application

import * as storage from './storage.js';
import * as parser from './parser.js';
import * as ui from './ui.js'; // Imports render functions, etc.
import { initializeEventListeners } from './events.js';

// --- State ---
let allScripts = {};
let activeScriptId = null;

// --- Core Functions ---

/**
 * Calculates and updates the progress for the active script, then saves all data.
 */
function updateAndSaveProgress() {
    if (!activeScriptId) return;

    const script = allScripts[activeScriptId];
    if (!script || !script.sections) {
        ui.updateProgress(0, 0);
        return;
    }

    const allTasks = script.sections.flatMap(s => (s.tasks || []).concat((s.chapters || []).flatMap(c => c.tasks || [])));
    
    if (allTasks.length === 0) {
        ui.updateProgress(0, 0);
        return;
    }

    const completedVideoTasks = allTasks.filter(t => t.video).length;
    const videoPercentage = Math.round((completedVideoTasks / allTasks.length) * 100);

    const completedAudioTasks = allTasks.filter(t => t.audio).length;
    const audioPercentage = Math.round((completedAudioTasks / allTasks.length) * 100);

    ui.updateProgress(videoPercentage, audioPercentage);
    ui.updateGroupCompletionStyles(); // Update title styles (green text, checkmark)
    storage.saveAllScripts(allScripts);
}

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
    ui.updateGroupCompletionStyles(); // Initial check for title styles
    updateAndSaveProgress(); // Update progress bar for the newly loaded script
}

// --- Event Handlers ---

const app = {
    handleScriptSelect(scriptId) {
        if (scriptId !== activeScriptId) {
            loadScript(scriptId);
        }
    },

    handleCheckboxChange(checkbox) {
        if (!activeScriptId) return;

        const taskId = checkbox.closest('.task-row').dataset.taskId;
        const taskType = checkbox.dataset.taskType; // 'video' or 'audio'
        const isChecked = checkbox.checked;

        const script = allScripts[activeScriptId];
        let taskFound = false;

        for (const section of script.sections) {
            if (taskFound) break;
            let tasks = section.tasks || [];
            let task = tasks.find(t => t.id === taskId);
            if (task) {
                task[taskType] = isChecked;
                taskFound = true;
                break;
            }

            if (section.chapters) {
                for (const chapter of section.chapters) {
                    let chapterTasks = chapter.tasks || [];
                    let task = chapterTasks.find(t => t.id === taskId);
                    if (task) {
                        task[taskType] = isChecked;
                        taskFound = true;
                        break;
                    }
                }
            }
        }
        
        if(taskFound) {
            updateAndSaveProgress();
        }
    },

    handleGroupCheckAll(groupTitleElement) {
        if (!activeScriptId) return;

        // Find the container of the tasks for this group
        const taskContainer = groupTitleElement.closest('[data-group-container]');
        if (!taskContainer) return;

        const checkboxes = taskContainer.querySelectorAll('.task-checkbox');
        if (checkboxes.length === 0) return;

        // Determine the new state: if all are checked, uncheck them. Otherwise, check them all.
        const allCurrentlyChecked = Array.from(checkboxes).every(cb => cb.checked);
        const shouldBeChecked = !allCurrentlyChecked;

        const script = allScripts[activeScriptId];

        // Find all tasks within this container and update their state
        const taskRows = taskContainer.querySelectorAll('.task-row');
        taskRows.forEach(row => {
            const taskId = row.dataset.taskId;
            const task = findTaskById(script, taskId);
            if (task) {
                task.video = shouldBeChecked;
                task.audio = shouldBeChecked;
            }
            row.querySelectorAll('.task-checkbox').forEach(cb => cb.checked = shouldBeChecked);
        });

        // Update progress and save
        updateAndSaveProgress();
    },

    handleCollapseToggle(cardElement) {
        const content = cardElement.querySelector('.collapsible-content');
        const chevron = cardElement.querySelector('.chevron');

        if (content && chevron) {
            chevron.classList.toggle('rotate-180');
            // Check if content is currently open (has a maxHeight)
            if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                content.style.maxHeight = null; // Collapse it
            } else {
                content.style.maxHeight = content.scrollHeight + 'px'; // Expand it
            }
        }
    },

    handleSpeakWord(word, event) {
        ui.speakWord(word, event);
    },

    handleCellDblClick(cell) {
        if (!activeScriptId) return;

        const row = cell.closest('.task-row');
        const taskId = row.dataset.taskId;
        const propertyToEdit = cell.dataset.property;

        if (!propertyToEdit) return;

        const script = allScripts[activeScriptId];
        let taskToEdit = null;

        // Find the task to edit
        for (const section of script.sections) {
            let task = (section.tasks || []).find(t => t.id === taskId) || 
                       (section.chapters || []).flatMap(c => c.tasks || []).find(t => t.id === taskId);
            if (task) {
                taskToEdit = task;
                break;
            }
        }

        if (taskToEdit) {
            ui.makeCellEditable(cell, (newHtml) => {
                taskToEdit[propertyToEdit] = newHtml;
                storage.saveAllScripts(allScripts);
            });
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
        const scriptObject = allScripts[activeScriptId];

        // Calculate current progress to include in the export
        const allTasks = scriptObject.sections.flatMap(s => (s.tasks || []).concat((s.chapters || []).flatMap(c => c.tasks || [])));
        const totalTasks = allTasks.length;
        const videoPercentage = totalTasks > 0 ? Math.round((allTasks.filter(t => t.video).length / totalTasks) * 100) : 0;
        const audioPercentage = totalTasks > 0 ? Math.round((allTasks.filter(t => t.audio).length / totalTasks) * 100) : 0;

        const markdownString = parser.serializeToMarkdown(scriptObject, {
            videoPercentage, audioPercentage
        });
        
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
    },

    handleEditScript(scriptId) {
        const script = allScripts[scriptId];
        if (script) {
            ui.showEditModal(script);
        }
    },

    handleCancelEdit() {
        ui.hideEditModal();
    },

    handleUpdateScriptProperties() {
        const originalId = document.getElementById('edit-original-script-id').value;
        const newTitle = document.getElementById('edit-title').value.trim();
        const newAuthor = document.getElementById('edit-author').value.trim();
        const newStatus = document.getElementById('edit-status').value;

        const type = document.getElementById('edit-id-type').value;
        const number = document.getElementById('edit-id-number').value;
        const version = document.getElementById('edit-id-version').value;

        if (!newTitle || !number || !version) {
            alert('标题、编号和版本号不能为空。');
            return;
        }

        const newId = `${type}-${number}-v${version}`;

        if (newId !== originalId && allScripts[newId]) {
            alert(`错误：脚本ID "${newId}" 已存在。请选择一个唯一的ID。`);
            return;
        }

        const scriptData = allScripts[originalId];
        
        // Update main properties and metadata
        scriptData.title = newTitle;
        scriptData.metadata.title = newTitle;
        scriptData.metadata.author = newAuthor;
        scriptData.metadata.status = newStatus;

        if (newId !== originalId) {
            scriptData.id = newId;
            scriptData.metadata.scriptId = newId;
            
            // The key of the script in the main object needs to change
            delete Object.assign(allScripts, {[newId]: allScripts[originalId] })[originalId];

            // If the active script was the one being edited, update the active ID
            if (activeScriptId === originalId) {
                activeScriptId = newId;
                window.location.hash = newId;
            }
        }

        storage.saveAllScripts(allScripts);
        ui.hideEditModal();
        ui.renderScriptList(allScripts, activeScriptId);

        // If the active script was edited, reload its content to show the new title
        if (activeScriptId === newId) {
            ui.renderScriptContent(scriptData);
        }
    }
};

// --- Helper Functions ---

/**
 * Finds a task by its ID within a script object.
 * @param {object} script - The script object.
 * @param {string} taskId - The ID of the task to find.
 * @returns {object|null} The found task object or null.
 */
function findTaskById(script, taskId) {
    for (const section of script.sections) {
        let task = (section.tasks || []).find(t => t.id === taskId);
        if (task) return task;

        if (section.chapters) {
            for (const chapter of section.chapters) {
                task = (chapter.tasks || []).find(t => t.id === taskId);
                if (task) return task;
            }
        }
    }
    return null;
}

// --- Initialization ---

function init() {
    allScripts = storage.loadAllScripts();

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
