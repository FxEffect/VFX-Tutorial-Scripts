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
        cell.innerHTML = newHtml;
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
            chapterDiv.innerHTML = `<h3 class="text-xl font-semibold mt-6 mb-4 flex items-center group-title"><span>${chapter.title}</span><span class="checkmark">✓</span></h3>`;
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

    const contentCell = document.createElement('td');
    contentCell.className = 'editable';
    contentCell.innerHTML = task.content; // Use innerHTML to render bold/strong tags

    const dialogueCell = document.createElement('td');
    dialogueCell.className = 'editable';
    dialogueCell.innerHTML = task.dialogue;

    const notesCell = document.createElement('td');
    notesCell.className = 'editable';
    notesCell.innerHTML = task.notes;

    tr.appendChild(videoCell);
    tr.appendChild(audioCell);
    tr.appendChild(timestampCell);
    tr.appendChild(contentCell);
    tr.appendChild(dialogueCell);
    tr.appendChild(notesCell);
    
    return tr;
}

// --- Private Helper Functions ---

function htmlToMarkdown(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Basic conversion, can be expanded
    tempDiv.querySelectorAll('strong, b').forEach(el => el.replaceWith(`**${el.innerHTML}**`));
    tempDiv.querySelectorAll('br').forEach(el => el.replaceWith('\n'));
    return tempDiv.textContent;
}

function markdownToHtml(markdown) {
    const sanitizer = document.createElement('div');
    sanitizer.textContent = markdown;
    let sanitizedText = sanitizer.innerHTML;
    // Basic conversion, can be expanded
    return sanitizedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
}