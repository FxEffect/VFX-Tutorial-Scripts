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
    // For now, we just put the raw content. Later, this will build the tables.
    // This is a placeholder for a much more complex function.
    scriptTablesContainer.innerHTML = '<p class="text-gray-500">脚本内容渲染功能待实现...</p>';
    
    // We also need to update progress bars based on the scriptObject's state
    // For now, let's just reset them.
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

// I will move other UI functions like makeCellEditable, highlightTags etc. here later.
// For now, this is a good starting structure.