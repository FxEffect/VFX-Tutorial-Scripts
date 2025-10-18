// Events Module: Handles all event listeners.

// Import handlers from other modules might be needed if we don't pass them all in.
// For now, let's assume they are passed in an 'app' object.

export function initializeEventListeners(app) {
    
    // Sidebar script list clicks
    const scriptListContainer = document.getElementById('script-list-container');
    scriptListContainer.addEventListener('click', (event) => {
        const scriptItem = event.target.closest('.script-item');
        if (scriptItem && scriptItem.dataset.scriptId) {
            app.handleScriptSelect(scriptItem.dataset.scriptId);
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
    scriptTablesContainer.addEventListener('change', (event) => {
        if (event.target.classList.contains('task-checkbox')) {
            // app.handleCheckboxChange(event.target);
            console.log('Checkbox changed (logic to be implemented)');
        }
    });
}
