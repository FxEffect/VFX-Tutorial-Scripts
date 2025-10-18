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
            const allTaskCheckboxes = document.querySelectorAll('.task-checkbox');
            const resetButton = document.getElementById('reset-button');
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
                allTaskCheckboxes.forEach((checkbox, index) => {
                    progress[index] = checkbox.checked;
                });
                localStorage.setItem(storageKeyProgress, JSON.stringify(progress));
            }

            function loadProgress() {
                const savedProgress = localStorage.getItem(storageKeyProgress);
                if (savedProgress) {
                    try {
                        const progress = JSON.parse(savedProgress);
                        if (progress.length !== allTaskCheckboxes.length) {
                           throw new Error("Saved progress length mismatch");
                        }
                        allTaskCheckboxes.forEach((checkbox, index) => {
                            if (progress[index]) {
                                checkbox.checked = true;
                            }
                        });
                        // Update row completed status after loading
                        document.querySelectorAll('.task-row').forEach(row => {
                             const allCheckedInRow = Array.from(row.querySelectorAll('.task-checkbox')).every(c => c.checked);
                             row.classList.toggle('completed', allCheckedInRow);
                        });

                    } catch (e) {
                        console.error("Failed to parse progress from localStorage or length mismatch.", e);
                        localStorage.removeItem(storageKeyProgress);
                    }
                }
                updateAllGroupTitleStates();
                updateProgress();
            }
            
            function resetProgress() {
                localStorage.removeItem(storageKeyProgress);
                localStorage.removeItem(storageKeyContent); // Clear saved text content
                window.location.reload(); // Reload the page to restore original state
            }

            function updateGroupTitleState(groupContainer) {
                const title = groupContainer.querySelector(':scope > .card-header .group-title, :scope > h3.group-title');
                const children = groupContainer.querySelectorAll('.task-checkbox');
                if (!title || children.length === 0) return;

                const allChecked = Array.from(children).every(c => c.checked);
                title.classList.toggle('group-completed', allChecked);
            }

            function updateAllGroupTitleStates() {
                 Array.from(allGroupContainers).reverse().forEach(container => {
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
            
            function assignEditableIds() {
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

            // --- EVENT LISTENERS ---
            allTaskCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const row = cb.closest('.task-row');
                    if (row) {
                        const allCheckedInRow = Array.from(row.querySelectorAll('.task-checkbox')).every(c => c.checked);
                        row.classList.toggle('completed', allCheckedInRow);
                    }
                    updateAllGroupTitleStates();
                    updateProgress();
                    saveProgress();
                });
            });
            
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

            document.querySelectorAll('.editable').forEach(cell => {
                cell.addEventListener('dblclick', () => makeCellEditable(cell));
            });

            // --- INITIALIZATION ---
            // Set initial expanded state
            document.querySelectorAll('.collapsible-content').forEach(content => {
                content.style.maxHeight = content.scrollHeight + "px";
                const chevron = content.previousElementSibling.querySelector('.chevron');
                chevron?.classList.add('rotate-180');
            });
            
            assignEditableIds();
            loadProgress();
            loadEditableContent();
            applyAllFormatting(document.querySelectorAll('.editable'));
        });
