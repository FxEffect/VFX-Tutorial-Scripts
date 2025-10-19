// Events Module: Handles all event listeners.

// Import handlers from other modules might be needed if we don't pass them all in.
// For now, let's assume they are passed in an 'app' object.

export function initializeEventListeners(app) {
    
    // Sidebar script list clicks
    const scriptListContainer = document.getElementById('script-list-container');
    scriptListContainer.addEventListener('click', (event) => {
        const selectArea = event.target.closest('[data-script-id]');
        const editButton = event.target.closest('.edit-script-button');

        if (editButton) {
            event.stopPropagation();
            app.handleEditScript(editButton.dataset.editScriptId);
            return;
        }
        if (selectArea) {
            app.handleScriptSelect(selectArea.dataset.scriptId);
        }
    });

    // Modal Buttons and Overlay
    const editModal = document.getElementById('edit-modal');
    const editSaveButton = document.getElementById('edit-save-button');
    const editCancelButton = document.getElementById('edit-cancel-button');

    editSaveButton.addEventListener('click', () => {
        app.handleUpdateScriptProperties();
    });

    editCancelButton.addEventListener('click', () => {
        app.handleCancelEdit();
    });

    // Close modal if background is clicked
    editModal.addEventListener('click', (event) => {
        if (event.target === editModal) {
            app.handleCancelEdit();
        }
    });


    // Action Buttons
    const importButton = document.getElementById('import-button');
    const importFileInput = document.getElementById('import-file-input');
    const exportButton = document.getElementById('export-button');
    const deleteButton = document.getElementById('delete-button');
    const resetAllButton = document.getElementById('reset-all-button');

    importButton.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            app.handleFileImport(file);
        }
        event.target.value = ''; // Allow re-importing the same file
    });

    exportButton.addEventListener('click', () => {
        app.handleExport();
    });

    deleteButton.addEventListener('click', () => {
        app.handleDelete();
    });

    resetAllButton.addEventListener('click', () => {
        app.handleResetAll();
    });

    // Add other event listeners using delegation as needed, for example:
    const scriptTablesContainer = document.getElementById('script-tables-container');
    
    // Listener for checkbox changes (e.g., ticking a task)
    scriptTablesContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('task-checkbox')) {
            app.handleCheckboxChange(event.target);
        }
    });

    // Listener for double-clicking on editable cells
    scriptTablesContainer.addEventListener('dblclick', (event) => {
        const cell = event.target.closest('td.editable');
        if (cell) {
            app.handleCellDblClick(cell);
        }
    });

    // Listener for clicking on text-to-speech phrases
    scriptTablesContainer.addEventListener('click', (event) => {
        const phraseSpan = event.target.closest('.tts-phrase');
        if (phraseSpan) {
            app.handleSpeakWord(phraseSpan.textContent, event);
        }
    });

    // Listener for collapsing/expanding script sections
    scriptTablesContainer.addEventListener('click', (event) => {
        const groupTitle = event.target.closest('.group-title');
        const header = event.target.closest('.card-header');

        // If the title text itself (or the checkmark) is clicked, handle "check all"
        if (groupTitle) {
            event.stopPropagation(); // Prevent the header click from firing
            app.handleGroupCheckAll(groupTitle);
            return; // Stop further processing
        }

        // If the header area (but not the title text) is clicked, handle collapse/expand
        if (header) {
            const card = header.closest('.card');
            const content = card.querySelector('.collapsible-content');
            const chevron = header.querySelector('.chevron');

            if (content && chevron) {
                app.handleCollapseToggle(card);
            }
        }
    });

    makeModalDraggable();
}

function makeModalDraggable() {
    const modalPanel = document.getElementById('edit-modal-panel');
    const modalHeader = document.getElementById('modal-header');
    let isDragging = false;
    let offsetX, offsetY;

    modalHeader.addEventListener('mousedown', (e) => {
        isDragging = true;
        // Ensure the panel is positioned absolutely to allow dragging
        modalPanel.style.position = 'absolute';

        // Calculate offset from the top-left corner of the panel
        offsetX = e.clientX - modalPanel.getBoundingClientRect().left;
        offsetY = e.clientY - modalPanel.getBoundingClientRect().top;

        modalHeader.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Calculate new position
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;

        modalPanel.style.left = `${newX}px`;
        modalPanel.style.top = `${newY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            modalHeader.style.cursor = 'move';
        }
    });
}
