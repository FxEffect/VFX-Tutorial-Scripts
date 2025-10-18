
        // --- TEXT TO SPEECH ---
        function speakWord(word, event) {
            event.stopPropagation(); // Prevent triggering other events like double-click
            if ('speechSynthesis' in window) {
                // Cancel any previous speech to avoid overlap
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(word.trim());
                utterance.lang = 'en-US';
                window.speechSynthesis.speak(utterance);
            } else {
                alert('抱歉，您的浏览器不支持语音朗读功能。');
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            // --- VARIABLES ---
            const storageKeyProgress = 'fireEffectChecklistProgressV3';
            const storageKeyContent = 'fireEffectEditableContentV3'; // Key for editable content
            const storageKeyStructure = 'fireEffectTableStructureV3'; // Key for table structure
            const resetButton = document.getElementById('reset-button');
            const importButton = document.getElementById('import-button');
            const importFileInput = document.getElementById('import-file-input');
            const exportButton = document.getElementById('export-button');
            const allGroupContainers = document.querySelectorAll('[data-group-container]');
            
            // --- FUNCTIONS ---
            function updateProgress() {
                // Video Progress
                const videoCheckboxes = document.querySelectorAll('.task-checkbox[data-task-type="video"]');
                const checkedVideo = document.querySelectorAll('.task-checkbox[data-task-type="video"]:checked').length;
                const totalVideo = videoCheckboxes.length;
                const percentageVideo = totalVideo > 0 ? Math.round((checkedVideo / totalVideo) * 100) : 0;
                document.getElementById('progress-bar-video').style.width = percentageVideo + '%';
                document.getElementById('progress-text-video').textContent = percentageVideo + '%';

                // Audio Progress
                const audioCheckboxes = document.querySelectorAll('.task-checkbox[data-task-type="audio"]');
                const checkedAudio = document.querySelectorAll('.task-checkbox[data-task-type="audio"]:checked').length;
                const totalAudio = audioCheckboxes.length;
                const percentageAudio = totalAudio > 0 ? Math.round((checkedAudio / totalAudio) * 100) : 0;
                document.getElementById('progress-bar-audio').style.width = percentageAudio + '%';
                document.getElementById('progress-text-audio').textContent = percentageAudio + '%';
            }

            function saveProgress() {
                const progress = [];
                // Query checkboxes at the time of saving to support dynamic rows
                document.querySelectorAll('.task-checkbox').forEach((checkbox, index) => {
                    progress[index] = checkbox.checked;
                });
                localStorage.setItem(storageKeyProgress, JSON.stringify(progress));
            }

            function loadProgress() {
                const allTaskCheckboxes = document.querySelectorAll('.task-checkbox');
                const savedProgress = localStorage.getItem(storageKeyProgress);
                if (savedProgress) {
                    try {
                        const progress = JSON.parse(savedProgress);
                        if (progress.length !== allTaskCheckboxes.length) {
                           console.warn("Saved progress length mismatch. This can happen after adding/deleting rows. Progress might be partially lost.");
                        }
                        allTaskCheckboxes.forEach((checkbox, index) => {
                            // Only load if the index exists in the saved data
                            if (progress[index] !== undefined) {
                                checkbox.checked = progress[index];
                            }
                        });
                        // Update row completed status after loading
                        document.querySelectorAll('.task-row').forEach(row => {
                             const allCheckedInRow = Array.from(row.querySelectorAll('.task-checkbox')).every(c => c.checked);
                             row.classList.toggle('completed', allCheckedInRow);
                        });

                    } catch (e) {
                        console.error("Failed to parse progress from localStorage or length mismatch.", e);
                        // Don't remove, to allow recovery if possible
                    }
                }
                updateAllGroupTitleStates();
                updateProgress();
            }
            
            function resetProgress() {
                const confirmed = confirm("您确定要重置所有进度和编辑内容吗？此操作不可撤销。");
                if (confirmed) {
                    localStorage.removeItem(storageKeyProgress);
                    localStorage.removeItem(storageKeyContent); // Clear saved text content
                    localStorage.removeItem(storageKeyStructure); // Clear saved structure
                    window.location.reload(); // Reload the page to restore original state
                }
            }

            function updateGroupTitleState(groupContainer) {
                const title = groupContainer.querySelector(':scope > .card-header .group-title, :scope > h3.group-title');
                const children = groupContainer.querySelectorAll('.task-checkbox');
                if (!title || children.length === 0) return;

                const allChecked = Array.from(children).every(c => c.checked);
                title.classList.toggle('group-completed', allChecked);
            }

            function updateAllGroupTitleStates() {
                 document.querySelectorAll('[data-group-container]').forEach(container => {
                    updateGroupTitleState(container);
                });
            }
            
            function applyAllFormatting(cells) {
                highlightTags(cells);
                addSpeechPhrases(cells);
            }

            function highlightTags(cells) {
                const tagClasses = {
                    '画面': 'tag-huamian', '操作': 'tag-caozuo', '讲解': 'tag-jiangjie', '讲解与操作': 'tag-jiangjie',
                    '视觉引导': 'tag-shijue', '快节奏混剪': 'tag-huamian', '画面淡入': 'tag-huamian',
                    '加速快进': 'tag-caozuo', '加速播放': 'tag-shijue'
                };
                cells.forEach(cell => {
                    if (cell.querySelector('textarea')) return;
                    let content = cell.innerHTML;
                    const newContent = content.replace(/\\\[(.*?)\\\]/g, (match, tagContent) => {
                        const key = tagContent.trim();
                        const tagClass = tagClasses[key] || 'tag-default';
                        if (match.includes('class="tag"')) return match;
                        return `<span class="tag ${tagClass}">${match}</span>`;
                    });
                    if (content !== newContent) cell.innerHTML = newContent;
                });
            }

            function addSpeechPhrases(cells) {
                // Regex to find English phrases, including those with underscores like M_Add_001
                const englishPhraseRegex = /\b([A-Za-z0-9_.-]{2,}(?:\s+[A-Za-z0-9_.-]{2,})*)\b/g;

                cells.forEach(cell => {
                    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
                    const nodesToProcess = [];
                    let currentNode;
                    while (currentNode = walker.nextNode()) {
                         if (!currentNode.parentElement.closest('.tts-phrase')) {
                            nodesToProcess.push(currentNode);
                         }
                    }

                    nodesToProcess.forEach(node => {
                        const text = node.textContent;
                        // Exclude pure numbers from being tagged
                        if (!englishPhraseRegex.test(text) || /^\d+$/.test(text.trim())) return;
                        
                        const fragment = document.createDocumentFragment();
                        let lastIndex = 0;
                        text.replace(englishPhraseRegex, (match, phrase, offset) => {
                            if (offset > lastIndex) {
                                fragment.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
                            }
                            
                            // Do not tag pure numbers
                            if (/^\d+$/.test(phrase.trim())) {
                                fragment.appendChild(document.createTextNode(match));
                            } else {
                                const phraseSpan = document.createElement('span');
                                phraseSpan.className = 'tts-phrase';
                                phraseSpan.textContent = phrase;
                                phraseSpan.onclick = (event) => speakWord(phrase, event);
                                fragment.appendChild(phraseSpan);
                            }
                            lastIndex = offset + match.length;
                        });

                        if (lastIndex < text.length) {
                            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
                        }
                        node.parentNode.replaceChild(fragment, node);
                    });
                });
            }
            
            function htmlToMarkdown(html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                let markdown = '';
                function traverse(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        markdown += node.textContent;
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const tagName = node.tagName.toLowerCase();
                        if (tagName === 'strong' || tagName === 'b') {
                            markdown += '**';
                            Array.from(node.childNodes).forEach(traverse);
                            markdown += '**';
                        } else if (tagName === 'br') {
                            markdown += '\n';
                        } else {
                             Array.from(node.childNodes).forEach(traverse);
                        }
                    }
                }
                Array.from(tempDiv.childNodes).forEach(traverse);
                return markdown;
            }

            function markdownToHtml(markdown) {
                const sanitizer = document.createElement('div');
                sanitizer.textContent = markdown;
                let sanitizedText = sanitizer.innerHTML;
                return sanitizedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            }
            
            function reassignAllIds() {
                document.querySelectorAll('.editable').forEach(cell => {
                    const table = cell.closest('table');
                    const row = cell.closest('tr');
                    if (!table || !row) return;

                    const tableIndex = Array.from(document.querySelectorAll('table')).indexOf(table);
                    const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(row);
                    const cellIndex = Array.from(row.querySelectorAll('td')).indexOf(cell);
                    
                    if (tableIndex > -1 && rowIndex > -1 && cellIndex > -1) {
                        const uniqueId = `editable-${tableIndex}-${rowIndex}-${cellIndex}`;
                        cell.dataset.editableId = uniqueId;
                    }
                });
            }

            function saveEditableContent() {
                const contents = {};
                document.querySelectorAll('[data-editable-id]').forEach(cell => {
                    contents[cell.dataset.editableId] = cell.innerHTML;
                });
                localStorage.setItem(storageKeyContent, JSON.stringify(contents));
            }

            function loadEditableContent() {
                const savedData = localStorage.getItem(storageKeyContent);
                if (!savedData) return;
                try {
                    const contents = JSON.parse(savedData);
                    document.querySelectorAll('[data-editable-id]').forEach(cell => {
                        const id = cell.dataset.editableId;
                        if (contents[id]) {
                            cell.innerHTML = contents[id];
                        }
                    });
                } catch (e) {
                    console.error("Failed to parse editable content from localStorage", e);
                    localStorage.removeItem(storageKeyContent);
                }
            }

            function saveStructure() {
                const structures = [];
                document.querySelectorAll('table tbody').forEach(tbody => {
                    structures.push(tbody.innerHTML);
                });
                localStorage.setItem(storageKeyStructure, JSON.stringify(structures));
            }

            function loadStructure() {
                const savedStructures = localStorage.getItem(storageKeyStructure);
                if (!savedStructures) return;

                try {
                    const structures = JSON.parse(savedStructures);
                    const allTbodies = document.querySelectorAll('table tbody');
                    if (structures.length === allTbodies.length) {
                        allTbodies.forEach((tbody, index) => {
                            tbody.innerHTML = structures[index];
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse or apply table structure from localStorage", e);
                }
            }

            function handleMarkdownImport(file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    try {
                        parseAndApplyMarkdown(content);
                        
                        // After successful import, save and refresh the entire UI
                        saveEditableContent();
                        saveStructure(); // Save the new structure if import changes it
                        saveProgress();
                        updateAllGroupTitleStates();
                        updateProgress();
                        applyAllFormatting(document.querySelectorAll('.editable'));

                        alert('导入成功！页面已更新。');
                    } catch (error) {
                        console.error('导入Markdown文件失败:', error);
                        alert('导入失败，文件格式可能不正确。请查看控制台获取详细信息。');
                    }
                };
                reader.readAsText(file, 'UTF-8');
            }

            function parseAndApplyMarkdown(markdownContent) {
                const lines = markdownContent.split('\n');
                const metadataRegex = /<!-- id:(.*?) video:(checked|unchecked) audio:(checked|unchecked) -->/;

                lines.forEach(line => {
                    if (!line.startsWith('|') || !line.includes('<!--')) return;

                    const match = line.match(metadataRegex);
                    if (!match) return;

                    const [, id, videoStatus, audioStatus] = match;
                    if (!id) return;

                    const firstCell = document.querySelector(`[data-editable-id="${id.trim()}"]`);
                    if (!firstCell) return;

                    const row = firstCell.closest('tr.task-row');
                    if (!row) return;

                    // 1. Update checkboxes
                    row.querySelector('.task-checkbox[data-task-type="video"]').checked = (videoStatus === 'checked');
                    row.querySelector('.task-checkbox[data-task-type="audio"]').checked = (audioStatus === 'checked');

                    // 2. Update editable content
                    const cellsContent = line.split('|').slice(4, -1).map(c => c.trim());
                    const editableCells = row.querySelectorAll('td.editable');
                    
                    let contentWithMetadata = cellsContent[0].replace(metadataRegex, '').trim();
                    cellsContent[0] = contentWithMetadata;

                    editableCells.forEach((cell, index) => {
                        cell.innerHTML = markdownToHtml(cellsContent[index].replace(/<br>/g, '\n'));
                    });
                });
            }

            function exportToMarkdown() {
                let markdownString = '';

                // 1. Build YAML Front Matter
                const videoProgress = document.getElementById('progress-text-video').textContent;
                const audioProgress = document.getElementById('progress-text-audio').textContent;
                const exportDate = new Date().toISOString();

                markdownString += `---\n`;
                markdownString += `version: "1.0"\n`;
                markdownString += `exportDate: "${exportDate}"\n`;
                markdownString += `videoProgress: "${videoProgress}"\n`;
                markdownString += `audioProgress: "${audioProgress}"\n`;
                markdownString += `---\n\n`;

                // 2. Add main title
                const mainTitle = document.querySelector('h1').textContent;
                markdownString += `# ${mainTitle}\n\n`;

                // 3. Iterate through each main card/section
                document.querySelectorAll('div.card[data-group-container]').forEach(card => {
                    const cardHeader = card.querySelector('.card-header');
                    const sectionTitle = cardHeader.querySelector('h2, h3').textContent.replace(' ✓', '').trim();
                    markdownString += `## ${sectionTitle}\n\n`;

                    // Handle tables directly under the card
                    const directTable = card.querySelector(':scope > .collapsible-content > .overflow-x-auto > table');
                    if (directTable) {
                        markdownString += processTableToMarkdown(directTable);
                    }

                    // Handle sub-chapters (like in "The Core")
                    card.querySelectorAll(':scope > .collapsible-content > div[data-group-container]').forEach(subChapter => {
                        const subChapterTitle = subChapter.querySelector('h3').textContent.replace(' ✓', '').trim();
                        markdownString += `### ${subChapterTitle}\n\n`;
                        const subChapterTable = subChapter.querySelector('table');
                        if (subChapterTable) {
                            markdownString += processTableToMarkdown(subChapterTable);
                        }
                    });
                });

                // 4. Create and trigger download
                const blob = new Blob([markdownString], { type: 'text/markdown;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `视频脚本-${mainTitle.slice(0,20)}.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            function processTableToMarkdown(tableElement) {
                let tableMd = '';
                // Exclude the "操作" (Actions) column from export
                const headers = Array.from(tableElement.querySelectorAll('thead th'))
                    .filter(th => !th.textContent.includes('操作')).map(th => th.textContent);
                tableMd += `| ${headers.join(' | ')} |\n`;
                tableMd += `|${headers.map(h => h.includes('录') || h.includes('配') ? ' :---: ' : ' --- ').join('|')}|\n`;

                tableElement.querySelectorAll('tbody tr.task-row').forEach(row => {
                    const videoCheckbox = row.querySelector('.task-checkbox[data-task-type="video"]');
                    const audioCheckbox = row.querySelector('.task-checkbox[data-task-type="audio"]');
                    const firstEditableCell = row.querySelector('.editable');
                    const id = firstEditableCell ? firstEditableCell.dataset.editableId : '';

                    const videoStatus = videoCheckbox.checked ? 'checked' : 'unchecked';
                    const audioStatus = audioCheckbox.checked ? 'checked' : 'unchecked';
                    const metadata = `<!-- id:${id} video:${videoStatus} audio:${audioStatus} -->`;

                    // Slice from 2 to -1 to exclude checkboxes and the action cell
                    const cellsContent = Array.from(row.querySelectorAll('td')).slice(2, -1).map(td => htmlToMarkdown(td.innerHTML).replace(/\|/g, '\\|').replace(/\n/g, '<br>'));
                    tableMd += `| ${videoCheckbox.checked ? '✓' : ' '} | ${audioCheckbox.checked ? '✓' : ' '} | ${metadata}${cellsContent.join(' | ')} |\n`;
                });
                return tableMd + '\n';
            }

            function makeCellEditable(cell) {
                if (cell.querySelector('textarea')) return;

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
                    applyAllFormatting([cell]); // Pass an array with only the edited cell
                    saveEditableContent(); // Save content after edit
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

            function createActionButtons() {
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'action-buttons';
                buttonsDiv.innerHTML = `
                    <svg data-action="add-above" class="w-5 h-5 action-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z" clip-rule="evenodd" /></svg>
                    <svg data-action="add-below" class="w-5 h-5 action-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.25 5.75a.75.75 0 0 0-1.5 0v2.5H5.25a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5H9.25V5.75Z" clip-rule="evenodd" /></svg>
                    <svg data-action="delete" class="w-5 h-5 action-btn delete" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clip-rule="evenodd" /></svg>
                `;
                return buttonsDiv;
            }

            function createNewRow(numEditableCells) {
                const newRow = document.createElement('tr');
                newRow.className = 'task-row';
                newRow.innerHTML = `
                    <td class="text-center"><input type="checkbox" class="task-checkbox" data-task-type="video"></td>
                    <td class="text-center"><input type="checkbox" class="task-checkbox" data-task-type="audio"></td>
                    <td>0:00</td>
                    ${Array(numEditableCells).fill('<td class="editable"></td>').join('')}
                    <td class="text-center"></td>
                `;
                // Add action buttons to the last cell
                newRow.lastElementChild.appendChild(createActionButtons());
                // Add event listeners to new elements
                addEventListenersToRow(newRow);
                return newRow;
            }

            function handleRowAction(action, currentRow) {
                let domChanged = false;
                const parentCollapsible = currentRow.closest('.collapsible-content');

                if (action === 'delete') {
                    if (confirm('确定要删除这一行吗？')) {
                        currentRow.remove();
                        domChanged = true;
                    }
                } else if (action === 'add-above' || action === 'add-below') {
                    // Correctly calculate the number of content columns.
                    // Total columns - 2 checkboxes - 1 timeline - 1 actions = number of editable content cells.
                    const numContentCells = currentRow.cells.length - 4;
                    const newRow = createNewRow(numContentCells);

                    if (action === 'add-above') {
                        currentRow.parentNode.insertBefore(newRow, currentRow);
                    } else {
                        currentRow.parentNode.insertBefore(newRow, currentRow.nextSibling);
                    }
                    domChanged = true;
                }

                if (domChanged) {
                    // After any DOM change, re-ID and save everything
                    saveStructure();
                    reassignAllIds();
                    saveEditableContent();
                    saveProgress();
                    updateAllGroupTitleStates();
                    updateProgress();

                    // Update the container's max-height to fit new content
                    if (parentCollapsible && parentCollapsible.style.maxHeight && parentCollapsible.style.maxHeight !== '0px') {
                        parentCollapsible.style.maxHeight = parentCollapsible.scrollHeight + "px";
                    }
                }
            }

            function addEventListenersToRow(row) {
                row.querySelectorAll('.task-checkbox').forEach(cb => {
                    cb.addEventListener('change', onCheckboxChange);
                });
                row.querySelectorAll('.editable').forEach(cell => {
                    cell.addEventListener('dblclick', () => makeCellEditable(cell));
                });
            }

            function onCheckboxChange(event) {
                const cb = event.target;
                const row = cb.closest('.task-row');
                if (row) {
                    const allCheckedInRow = Array.from(row.querySelectorAll('.task-checkbox')).every(c => c.checked);
                    row.classList.toggle('completed', allCheckedInRow);
                }
                updateAllGroupTitleStates();
                updateProgress();
                saveProgress();
            }

            // --- EVENT LISTENERS ---
            document.querySelectorAll('.group-title').forEach(title => {
                title.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const groupContainer = title.closest('[data-group-container]');
                    const childrenCheckboxes = groupContainer.querySelectorAll('.task-checkbox');
                    const shouldCheck = !Array.from(childrenCheckboxes).every(c => c.checked);
                    
                    childrenCheckboxes.forEach(child => {
                        child.checked = shouldCheck;
                    });
                    
                    groupContainer.querySelectorAll('.task-row').forEach(row => {
                        row.classList.toggle('completed', shouldCheck);
                    });

                    updateAllGroupTitleStates();
                    updateProgress();
                    saveProgress();
                });
            });


            resetButton.addEventListener('click', resetProgress);

            importButton.addEventListener('click', () => {
                importFileInput.click();
            });

            importFileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    handleMarkdownImport(file);
                }
                event.target.value = ''; // Allow re-importing the same file
            });
            
            exportButton.addEventListener('click', exportToMarkdown);

            document.querySelectorAll('.card-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('.group-title')) {
                        return; // Do nothing if the click was on the title area
                    }
                    const content = header.nextElementSibling;
                    const chevron = header.querySelector('.chevron');
                    if (content && content.classList.contains('collapsible-content')) {
                        if (content.style.maxHeight && content.style.maxHeight !== '0px') {
                             content.style.maxHeight = '0px';
                        } else {
                            content.style.maxHeight = content.scrollHeight + "px";
                        }
                        chevron?.classList.toggle('rotate-180');
                    }
                });
            });

            // Use event delegation for row actions
            document.querySelectorAll('table tbody').forEach(tbody => {
                tbody.addEventListener('click', (e) => {
                    const actionButton = e.target.closest('[data-action]');
                    if (actionButton) {
                        const currentRow = actionButton.closest('tr.task-row');
                        handleRowAction(actionButton.dataset.action, currentRow);
                    }
                });
            });

            // --- INITIALIZATION ---
            // Set initial expanded state
            document.querySelectorAll('.collapsible-content').forEach(content => {
                content.style.maxHeight = content.scrollHeight + "px";
                const chevron = content.previousElementSibling.querySelector('.chevron');
                chevron?.classList.add('rotate-180');
            });
            
            // Load structure first to rebuild dynamic rows
            loadStructure();

            // Add action buttons to all initial rows
            // This loop now also handles rows restored from localStorage
            document.querySelectorAll('.task-row').forEach(row => {
                if (row.lastElementChild && row.lastElementChild.innerHTML.trim() === '') {
                    row.lastElementChild.appendChild(createActionButtons());
                }
                addEventListenersToRow(row);
            });

            reassignAllIds();
            loadProgress();
            loadEditableContent();
            applyAllFormatting(document.querySelectorAll('.editable'));
        });
