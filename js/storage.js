// Storage Module: Handles all interactions with localStorage.

const STORAGE_KEY = 'vfxScriptsDataStore';

/**
 * Loads the entire script database from localStorage.
 * @returns {object} The database of all scripts.
 */
export function loadAllScripts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
}

/**
 * Saves the entire script database to localStorage.
 * @param {object} allScriptsData - The entire database of scripts to save.
 */
export function saveAllScripts(allScriptsData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allScriptsData));
    } catch (e) {
        console.error("Failed to save scripts to localStorage", e);
        alert("错误：无法保存脚本数据。可能是存储空间已满。");
    }
}

/**
 * Deletes a single script from the database.
 * @param {object} allScriptsData - The entire database of scripts.
 * @param {string} scriptId - The ID of the script to delete.
 * @returns {object} The updated database.
 */
export function deleteScript(allScriptsData, scriptId) {
    delete allScriptsData[scriptId];
    saveAllScripts(allScriptsData);
    return allScriptsData;
}

/**
 * Deletes all script data from localStorage.
 */
export function deleteAllScripts() {
    localStorage.removeItem(STORAGE_KEY);
}
