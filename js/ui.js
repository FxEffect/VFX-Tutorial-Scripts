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
 */
export function renderScriptList(scripts, activeScriptId) {
    scriptListContainer.innerHTML = ''; // Clear existing list
    if (Object.keys(scripts).length === 0) {
        scriptListContainer.innerHTML = '<li class="text-center text-gray-500 p-4">尚未导入任何脚本</li>';
        return;
    }

    for (const scriptId in scripts) {
        const script = scripts[scriptId];
        const li = document.createElement('li');
        li.className = `script-item ${scriptId === activeScriptId ? 'active' : ''}`;
        li.dataset.scriptId = scriptId;
        
        const title = document.createElement('h3');
        title.className = 'font-bold';
        title.textContent = script.title;
        
        const idPara = document.createElement('p');
        idPara.className = 'script-id';
        idPara.textContent = script.id;

        li.appendChild(title);
        li.appendChild(idPara);
        scriptListContainer.appendChild(li);
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

    // After rendering, automatically expand the first section for better UX
    const firstCard = scriptTablesContainer.querySelector('.card');
    if (firstCard) {
        const content = firstCard.querySelector('.collapsible-content');
        const chevron = firstCard.querySelector('.chevron');
        if (content && chevron) {
            content.style.maxHeight = content.scrollHeight + 'px';
            chevron.classList.add('rotate-180');
        }
    }

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
                <th class="w-4/12">画面内容</th>
                <th class="w-4/12">旁白/对话</th>
                <th class="w-2/12">备注</th>
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