// UI Module: Handles all DOM manipulation and UI updates.

// --- DOM Element References ---
const scriptListContainer = document.getElementById('script-list-container');
const scriptContentWrapper = document.getElementById('script-content-wrapper');
const welcomeMessage = document.getElementById('welcome-message');
const scriptTitle = document.getElementById('script-title');
const progressBarVideo = document.getElementById('progress-bar-video');
const progressTextVideo = document.getElementById('progress-text-video');
const progressBarAudio = document.getElementById('progress-bar-audio');
const progressTextAudio = document.getElementById('progress-text-audio');
const scriptTablesContainer = document.getElementById('script-tables-container');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editOriginalScriptId = document.getElementById('edit-original-script-id');
const editTitle = document.getElementById('edit-title');
const editAuthor = document.getElementById('edit-author');
const editStatus = document.getElementById('edit-status');
const editIdType = document.getElementById('edit-id-type');
const editIdNumber = document.getElementById('edit-id-number');
const editIdVersion = document.getElementById('edit-id-version');
const infoDuration = document.getElementById('info-duration');
const infoExportDate = document.getElementById('info-export-date');


// --- Public Functions ---

export function showWelcomeMessage() {
    scriptContentWrapper.classList.add('hidden');
    welcomeMessage.classList.remove('hidden');
}

export function showScriptContent() {
    welcomeMessage.classList.add('hidden');
    scriptContentWrapper.classList.remove('hidden');
}

/**
 * Renders the list of scripts in the sidebar.
 * @param {object} scripts - The database of all scripts.
 * @param {string} activeScriptId - The ID of the currently active script.
 * @param {function} calculateScriptProgress - Function to calculate progress for a script.
 */
export function renderScriptList(scripts, activeScriptId, calculateScriptProgress) {
    scriptListContainer.innerHTML = ''; // Clear existing list
    if (Object.keys(scripts).length === 0) {
        scriptListContainer.innerHTML = '<li class="text-center text-gray-500 p-4">尚未导入任何脚本</li>';
        return;
    }

    for (const scriptId in scripts) {
        const script = scripts[scriptId];
        const li = document.createElement('li');
        li.className = `script-item flex justify-between items-center ${scriptId === activeScriptId ? 'active' : ''}`;
        
        // Main clickable area for script selection
        const mainArea = document.createElement('div');
        mainArea.className = 'flex-1 overflow-hidden cursor-pointer p-2';
        mainArea.dataset.scriptId = scriptId; // For selection
        
        const title = document.createElement('h3');
        title.className = 'font-bold truncate';
        title.textContent = script.title;
        
        const idPara = document.createElement('p');
        idPara.className = 'script-id truncate';
        idPara.textContent = script.id;

        mainArea.appendChild(title);
        mainArea.appendChild(idPara);

        // Add progress bar if the calculation function is provided
        if (calculateScriptProgress) {
            const { videoPercentage, audioPercentage } = calculateScriptProgress(script);
            const avgProgress = (videoPercentage + audioPercentage) / 2;

            const progressWrapper = document.createElement('div');
            progressWrapper.className = 'sidebar-progress-bar-wrapper';
            
            const progressBar = document.createElement('div');
            
            let progressColorClass = '';
            if (avgProgress <= 30) {
                progressColorClass = 'progress-tier-1';
            } else if (avgProgress <= 60) {
                progressColorClass = 'progress-tier-2';
            } else if (avgProgress < 100) {
                progressColorClass = 'progress-tier-3';
            } else { // 100%
                progressColorClass = 'progress-tier-4';
            }

            progressBar.className = `sidebar-progress-bar ${progressColorClass}`;
            progressBar.style.width = `${avgProgress}%`;
            
            progressWrapper.appendChild(progressBar);
            mainArea.appendChild(progressWrapper);
        }

        const editButton = document.createElement('button');
        editButton.className = 'edit-script-button flex-shrink-0 ml-2 p-2 text-gray-400 hover:text-blue-600 rounded-full';
        editButton.dataset.editScriptId = scriptId; // For editing
        editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;

        li.appendChild(mainArea);
        li.appendChild(editButton);
        scriptListContainer.appendChild(li);
    }
}

/**
 * Shows and populates the edit modal with script data.
 * @param {object} script - The script object to edit.
 */
export function showEditModal(script) {
    // --- Populate Editable Fields ---
    editOriginalScriptId.value = script.id;
    editTitle.value = script.title || '';
    editAuthor.value = script.metadata.author || '';
    editStatus.value = script.metadata.status || 'Draft';

    // --- Parse and Populate Script ID ---
    const idParts = script.id.split('-');
    let type = 'free', number = '1', version = '1'; // Defaults

    // Handle new format: free-lesson-2-v1
    if (idParts.length === 4 && idParts[1] === 'lesson') {
        type = idParts[0];
        number = idParts[2];
        version = idParts[3].replace('v', '');
    } 
    // Handle old format: free-2-v1
    else if (idParts.length === 3) {
        type = idParts[0];
        number = idParts[1];
        version = idParts[2].replace('v', '');
    } else if (idParts.length === 2) {
        type = idParts[0];
        number = idParts[1];
    } else if (idParts.length === 1 && idParts[0] !== '') {
        const isNumeric = /^\d+$/.test(idParts[0]);
        if (isNumeric) number = idParts[0];
        else type = idParts[0];
    }
    
    editIdType.value = type;
    editIdNumber.value = number;
    editIdVersion.value = version;

    // --- Populate Read-only Info ---
    infoDuration.textContent = _calculateEstimatedDuration(script);
    if (script.metadata.exportDate) {
        try {
            infoExportDate.textContent = new Date(script.metadata.exportDate).toLocaleString();
        } catch (e) {
            infoExportDate.textContent = script.metadata.exportDate;
        }
    } else {
        infoExportDate.textContent = 'N/A';
    }

    // --- Show Modal ---
    editModal.classList.remove('hidden');
    // Reset panel position in case it was dragged
    const modalPanel = document.getElementById('edit-modal-panel');
    modalPanel.style.top = '';
    modalPanel.style.left = '';
    modalPanel.style.position = 'relative';
}


/**
 * Hides the edit modal and resets the form.
 */
export function hideEditModal() {
    editModal.classList.add('hidden');
    if(editForm) {
        editForm.reset();
    }
}


/**
 * Renders the content of a single script in the main view.
 * @param {object} scriptObject - The script object to render.
 */
export function renderScriptContent(scriptObject) {
    scriptTitle.textContent = scriptObject.title;
    scriptTablesContainer.innerHTML = ''; // Clear previous content

    if (!scriptObject.sections || scriptObject.sections.length === 0) {
        scriptTablesContainer.innerHTML = '<p class="text-center text-gray-500 p-8">此脚本没有内容。</p>';
        return;
    }

    scriptObject.sections.forEach(section => {
        const sectionEl = createSectionElement(section);
        scriptTablesContainer.appendChild(sectionEl);
    });

    // After rendering, automatically expand all sections by default.
    const allCards = scriptTablesContainer.querySelectorAll('.card');
    allCards.forEach(card => {
        const content = card.querySelector('.collapsible-content');
        const chevron = card.querySelector('.chevron');
        if (content && chevron) {
            content.style.maxHeight = content.scrollHeight + 'px';
            chevron.classList.add('rotate-180');
        }
    });

    // Placeholder for progress calculation
    updateProgress(0, 0); 
}


/**
 * Updates the progress bars and text.
 * @param {number} videoPercentage - The percentage for the video progress.
 * @param {number} audioPercentage - The percentage for the audio progress.
 */
export function updateProgress(videoPercentage, audioPercentage) {
    progressBarVideo.style.width = videoPercentage + '%';
    progressTextVideo.textContent = videoPercentage + '%';
    progressBarAudio.style.width = audioPercentage + '%';
    progressTextAudio.textContent = audioPercentage + '%';
}

/**
 * Updates the visual style of group titles (h2, h3) based on task completion.
 * If all tasks in a group are checked, the title gets a 'group-completed' class.
 */
export function updateGroupCompletionStyles() {
    const groupContainers = scriptTablesContainer.querySelectorAll('[data-group-container]');
    groupContainers.forEach(container => {
        const title = container.querySelector('.group-title');
        const checkboxes = container.querySelectorAll('.task-checkbox');
        
        if (title && checkboxes.length > 0) {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            if (allChecked) {
                title.classList.add('group-completed');
            } else {
                title.classList.remove('group-completed');
            }
        }
    });
}

/**
 * Makes a cell editable by replacing its content with a textarea.
 * @param {HTMLElement} cell - The table cell element to make editable.
 * @param {function(string): void} onSave - Callback function to execute when saving.
 */
export function makeCellEditable(cell, onSave) {
    if (cell.querySelector('textarea')) return; // Already in edit mode

    const originalHTML = cell.innerHTML;
    const markdownContent = htmlToMarkdown(originalHTML);
    
    cell.innerHTML = '';

    const textarea = document.createElement('textarea');
    textarea.value = markdownContent.trim();
    cell.appendChild(textarea);
    textarea.focus();
    textarea.style.height = textarea.scrollHeight + 'px';

    const saveEdit = () => {
        const newHtml = markdownToHtml(textarea.value);
        // Apply formatting after saving
        cell.innerHTML = formatCellContent(newHtml);
        onSave(newHtml);
    };

    const cancelEdit = () => {
        cell.innerHTML = originalHTML;
    };

    textarea.addEventListener('blur', saveEdit);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textarea.blur();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    });
}


// --- Helper Functions for Rendering ---

function _calculateEstimatedDuration(script) {
    let maxSeconds = 0;
    const allTasks = (script.sections || []).flatMap(s => (s.tasks || []).concat((s.chapters || []).flatMap(c => c.tasks || [])));

    allTasks.forEach(task => {
        const ts = task.timestamp.trim();
        if (!ts) return;

        const parts = ts.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 2) { // M:SS
            seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) { // H:MM:SS
            seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        if (seconds > maxSeconds) {
            maxSeconds = seconds;
        }
    });

    if (maxSeconds === 0) return 'N/A';

    const minutes = Math.floor(maxSeconds / 60);
    const seconds = maxSeconds % 60;
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

function createSectionElement(section) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.groupContainer = '';

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header flex justify-between items-center';
    
    const groupTitle = document.createElement('div');
    groupTitle.className = 'group-title';
    groupTitle.innerHTML = `<h2>${section.title} <span class="checkmark">✓</span></h2>`;
    
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'w-6 h-6 text-gray-400 transform transition-transform chevron');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />`;

    cardHeader.appendChild(groupTitle);
    cardHeader.appendChild(chevron);

    const content = document.createElement('div');
    content.className = 'collapsible-content';

    if (section.tasks && section.tasks.length > 0) {
        content.appendChild(createTableElement(section.tasks));
    }

    if (section.chapters && section.chapters.length > 0) {
        section.chapters.forEach(chapter => {
            const chapterDiv = document.createElement('div');
            chapterDiv.className = 'px-6 pb-6 border-b border-gray-200';
            chapterDiv.dataset.groupContainer = '';
    chapterDiv.innerHTML = `<h3 class="text-xl font-semibold mt-6 mb-4 group-title"><span>${chapter.title}</span><span class="checkmark">✓</span></h3>`;
            chapterDiv.appendChild(createTableElement(chapter.tasks));
            content.appendChild(chapterDiv);
        });
    }
    
    card.appendChild(cardHeader);
    card.appendChild(content);
    return card;
}

function createTableElement(tasks) {
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'overflow-x-auto border rounded-lg';
    const table = document.createElement('table');
    table.innerHTML = `
        <thead class="text-sm text-gray-700 uppercase">
            <tr>
                <th class="w-1/12 text-center">录视频</th>
                <th class="w-1/12 text-center">配音</th>
                <th class="w-1/12">时间轴</th>
                <th class="w-3/12">画面内容</th>
                <th class="w-3/12">旁白/对话</th>
                <th class="w-4/12">备注</th>
            </tr>
        </thead>
    `;
    const tbody = document.createElement('tbody');
    tbody.className = 'text-gray-700';

    tasks.forEach(task => {
        tbody.appendChild(createTaskRowElement(task));
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    return tableWrapper;
}

function createTaskRowElement(task) {
    const tr = document.createElement('tr');
    tr.className = 'task-row';
    tr.dataset.taskId = task.id;

    // Create cells using DOM methods for security and clarity
    const videoCell = document.createElement('td');
    videoCell.className = 'text-center';
    videoCell.innerHTML = `<input type="checkbox" class="task-checkbox" data-task-type="video" ${task.video ? 'checked' : ''}>`;

    const audioCell = document.createElement('td');
    audioCell.className = 'text-center';
    audioCell.innerHTML = `<input type="checkbox" class="task-checkbox" data-task-type="audio" ${task.audio ? 'checked' : ''}>`;

    const timestampCell = document.createElement('td');
    timestampCell.className = 'editable';
    timestampCell.textContent = task.timestamp;
    timestampCell.dataset.property = 'timestamp';

    const contentCell = document.createElement('td');
    contentCell.className = 'editable';
    contentCell.innerHTML = markdownToHtml(task.content); // Convert MD to HTML on render
    contentCell.dataset.property = 'content';

    const dialogueCell = document.createElement('td');
    dialogueCell.className = 'editable';
    dialogueCell.innerHTML = markdownToHtml(task.dialogue); // Convert MD to HTML on render
    dialogueCell.dataset.property = 'dialogue';

    const notesCell = document.createElement('td');
    notesCell.className = 'editable';
    notesCell.innerHTML = markdownToHtml(task.notes); // Convert MD to HTML on render
    notesCell.dataset.property = 'notes';

    tr.appendChild(videoCell);
    tr.appendChild(audioCell);
    tr.appendChild(timestampCell);
    tr.appendChild(contentCell);
    tr.appendChild(dialogueCell);
    tr.appendChild(notesCell);
    
    return tr;
}

// --- Private Helper Functions ---

// Helper to convert basic HTML back to Markdown for editing
function htmlToMarkdown(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // First, revert special spans back to their text content
    tempDiv.querySelectorAll('.tag, .tts-phrase').forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent));
    });
    // Basic conversion, can be expanded
    tempDiv.querySelectorAll('strong, b').forEach(el => el.replaceWith(`**${el.innerHTML}**`));
    tempDiv.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
    return tempDiv.textContent;
}

// Helper to convert Markdown to HTML
function markdownToHtml(markdown) {
    const sanitizer = document.createElement('div');
    sanitizer.textContent = markdown;
    let sanitizedText = sanitizer.innerHTML;
    // Basic Markdown conversion
    let html = sanitizedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
    
    // Apply special formatting like tags and speech phrases
    return formatCellContent(html);
}

/**
 * Applies special formatting to the cell's HTML content.
 * 1. Highlights keyword tags like [画面].
 * 2. Wraps English phrases for text-to-speech functionality.
 * @param {string} html - The HTML string to format.
 * @returns {string} The formatted HTML string.
 */
function formatCellContent(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Highlight keyword tags
    const tagClasses = {
        '画面': 'tag-huamian', '操作': 'tag-caozuo', '讲解': 'tag-jiangjie', '讲解与操作': 'tag-jiangjie',
        '视觉引导': 'tag-shijue', '快节奏混剪': 'tag-huamian', '画面淡入': 'tag-huamian',
        '加速快进': 'tag-caozuo', '加速播放': 'tag-shijue'
    };
    tempDiv.innerHTML = tempDiv.innerHTML.replace(/\[(.*?)\]/g, (match, tagContent) => {
        const key = tagContent.trim();
        const tagClass = tagClasses[key] || 'tag-default';
        return `<span class="tag ${tagClass}">${match}</span>`;
    });

    // 2. Add speech phrases for English words
    const englishPhraseRegex = /\b([A-Za-z0-9_.-]{2,}(?:\s+[A-Za-z0-9_.-]{2,})*)\b/g;
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
    const nodesToProcess = [];
    let currentNode;
    while (currentNode = walker.nextNode()) {
        // Process only text nodes that are not already inside a tts-phrase span
        if (!currentNode.parentElement.closest('.tts-phrase, .tag')) {
            nodesToProcess.push(currentNode);
        }
    }

    nodesToProcess.forEach(node => {
        const text = node.textContent;
        if (!englishPhraseRegex.test(text) || /^\d+$/.test(text.trim())) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        text.replace(englishPhraseRegex, (match, phrase, offset) => {
            if (offset > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
            }
            if (/^\d+$/.test(phrase.trim())) {
                fragment.appendChild(document.createTextNode(match));
            } else {
                const phraseSpan = document.createElement('span');
                phraseSpan.className = 'tts-phrase';
                phraseSpan.textContent = phrase;
                fragment.appendChild(phraseSpan);
            }
            lastIndex = offset + match.length;
        });

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }
        node.parentNode.replaceChild(fragment, node);
    });

    return tempDiv.innerHTML;
}

// Text-to-speech function
export function speakWord(word, event) {
    event.stopPropagation();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(word.trim());
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    } else {
        alert('抱歉，您的浏览器不支持语音朗读功能。');
    }
}