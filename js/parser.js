// Parser Module: Handles conversion between Markdown and Script Objects

// Maps markdown header text to internal script object property names.
const HEADER_TO_PROPERTY_MAP = {
    '录视频': 'video',
    '配音': 'audio',
    '时间轴': 'timestamp',
    '画面内容': 'content',
    '旁白/对话': 'dialogue',
    '备注': 'notes',
    '视觉引导/备注': 'notes', // Both map to 'notes'
};

// Maps internal property names back to a default header text for serialization.
const PROPERTY_TO_HEADER_MAP = {
    'video': '录视频',
    'audio': '配音',
    'timestamp': '时间轴',
    'content': '画面内容',
    'dialogue': '旁白/对话',
    'notes': '备注',
};


/**
 * Parses a Markdown string into a structured script object.
 * It extracts metadata, headers, and table data.
 *
 * @param {string} markdownContent - The full content of the markdown file.
 * @returns {object} A structured script object.
 * @throws {Error} If the scriptId is missing or the format is invalid.
 */
export function parseMarkdown(markdownContent) {
    const scriptObject = {
        metadata: {},
        sections: [],
    };

    // 1. Parse Frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = markdownContent.match(frontmatterRegex);

    if (!frontmatterMatch) {
        throw new Error("Markdown frontmatter (---...---) not found.");
    }

    const frontmatterContent = frontmatterMatch[1];
    const bodyContent = markdownContent.substring(frontmatterMatch[0].length);

    frontmatterContent.split(/\r?\n/).forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim().replace(/^\"(.*)\"$/, '$1');
            if (key !== 'videoProgress' && key !== 'audioProgress') {
                scriptObject.metadata[key] = value;
            }
        }
    });

    scriptObject.id = scriptObject.metadata.scriptId;
    scriptObject.title = scriptObject.metadata.title;

    if (!scriptObject.id) {
        throw new Error("`scriptId` is missing in the Markdown frontmatter.");
    }

    // 2. Parse Body Content
    const normalizedBody = bodyContent.replace(/\r\n/g, '\n');
    const h2Sections = normalizedBody.split(/^(?=## )/m).slice(1);
    let taskCounter = 0;

    h2Sections.forEach((sectionContent, sectionIndex) => {
        const h2Match = sectionContent.match(/^## (.*)/);
        if (!h2Match) return;

        const currentSection = { title: h2Match[1].trim(), chapters: [], tasks: [] };
        scriptObject.sections.push(currentSection);

        const contentAfterH2 = sectionContent.substring(h2Match[0].length);
        const h3Parts = contentAfterH2.split(/^(?=### )/m);
        const contentBeforeFirstH3 = h3Parts[0];
        taskCounter = parseTables(contentBeforeFirstH3, currentSection, sectionIndex, taskCounter);

        if (h3Parts.length > 1) {
            h3Parts.slice(1).forEach((chapterContent) => {
                const h3Match = chapterContent.match(/^### (.*)/);
                if (!h3Match) return;

                const currentChapter = { title: h3Match[1].trim(), tasks: [] };
                currentSection.chapters.push(currentChapter);
                const contentAfterH3 = chapterContent.substring(h3Match[0].length);
                taskCounter = parseTables(contentAfterH3, currentChapter, sectionIndex, taskCounter);
            });
        }
    });

    return scriptObject;
}

/**
 * Helper function to parse tables within a given content block using special markers.
 * @param {string} content - The markdown content to search for tables.
 * @param {object} container - The section or chapter object to add tasks to.
 * @param {number} sectionIndex - The index of the current H2 section.
 * @param {number} taskCounter - The running counter for unique task IDs.
 * @returns {number} The updated task counter.
 */
function parseTables(content, container, sectionIndex, taskCounter) {
    const tableRegex = /<!-- TABLE_START -->([\s\S]*?)<!-- TABLE_END -->/g;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(content)) !== null) {
        const tableContent = tableMatch[1].trim();
        const tableRows = tableContent.split('\n').filter(row => row.trim().startsWith('|'));

        if (tableRows.length < 2) continue;

        const headerRow = tableRows[0];
        const separatorRow = tableRows[1];
        if (!separatorRow.includes('---')) continue;

        const headerCells = headerRow.split('|').slice(1, -1).map(h => h.trim());
        if (headerCells.length === 0) continue;
        
        container.header = headerCells;
        
        const headerIndexMap = {};
        headerCells.forEach((h, i) => { headerIndexMap[h] = i; });

        const propertyMap = {};
        for(const headerText in headerIndexMap) {
            const propertyName = HEADER_TO_PROPERTY_MAP[headerText];
            if (propertyName) {
                propertyMap[propertyName] = headerIndexMap[headerText];
            }
        }

        const dataRows = tableRows.slice(2);
        
        dataRows.forEach(row => {
            const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
            if (cells.length > headerCells.length) return;

            const task = { video: false, audio: false, timestamp: '', content: '', dialogue: '', notes: '' };
            
            for (const propName in propertyMap) {
                const cellIndex = propertyMap[propName];
                if (cells[cellIndex] !== undefined) {
                    task[propName] = cells[cellIndex];
                }
            }

            const commentRegex = /<!--\s*id:([^ ]+)\s*video:([^ ]+)\s*audio:([^ ]+)\s*-->/; // Corrected regex escaping
            const timestampCellContent = task.timestamp || '';
            const commentMatch = timestampCellContent.match(commentRegex);

            if (commentMatch) {
                task.id = commentMatch[1];
                task.video = commentMatch[2] === 'checked';
                task.audio = commentMatch[3] === 'checked';
                task.timestamp = timestampCellContent.replace(commentRegex, '').trim();
            } else {
                task.id = `task-${sectionIndex}-${taskCounter++}`;
                const videoCellIndex = propertyMap['video'];
                const audioCellIndex = propertyMap['audio'];
                if (videoCellIndex !== undefined && cells[videoCellIndex]) task.video = cells[videoCellIndex].includes('✓');
                if (audioCellIndex !== undefined && cells[audioCellIndex]) task.audio = cells[audioCellIndex].includes('✓');
            }
            
            container.tasks.push(task);
        });
    }
    return taskCounter;
}


/**
 * Serializes a script object back into a Markdown string with dynamic headers.
 *
 * @param {object} scriptObject - The script object to serialize.
 * @param {object} [progress={}] - Optional progress data.
 * @returns {string} The Markdown string representation.
 */
export function serializeToMarkdown(scriptObject, progress = {}) {
    let md = '---\n';
    
    const finalMetadata = { ...scriptObject.metadata };
    if (progress.videoPercentage !== undefined) finalMetadata.videoProgress = `${progress.videoPercentage}%`;
    if (progress.audioPercentage !== undefined) finalMetadata.audioProgress = `${progress.audioPercentage}%`;
    finalMetadata.exportDate = new Date().toISOString();

    for (const key in finalMetadata) {
        if ((key === 'scriptId' || key === 'title') && !finalMetadata[key]) continue;
        md += `${key}: \"${finalMetadata[key]}\"\n`;
    }
    md += '---\n\n';
    md += `# ${scriptObject.title}\n\n`;

    scriptObject.sections.forEach(section => {
        md += `## ${section.title}\n\n`;

        if (section.tasks && section.tasks.length > 0) {
            md += serializeTable(section.tasks, section.header);
        }

        if (section.chapters) {
            section.chapters.forEach(chapter => {
                md += `### ${chapter.title}\n\n`;
                if (chapter.tasks && chapter.tasks.length > 0) {
                    md += serializeTable(chapter.tasks, chapter.header);
                }
            });
        }
    });

    return md;
}

/**
 * Helper function to serialize an array of tasks into a Markdown table.
 * @param {Array<object>} tasks - The array of task objects.
 * @param {Array<string>} header - The dynamic header for this table.
 * @returns {string} A markdown table as a string.
 */
function serializeTable(tasks, header) {
    const tableHeader = header || Object.values(PROPERTY_TO_HEADER_MAP);

    let tableMd = `| ${tableHeader.join(' | ')} |\n`;
    tableMd += `|${tableHeader.map(h => h.includes('录视频') || h.includes('配音') ? ' :---: ' : ' --- ' ).join('|')}|\n`;

    tasks.forEach(task => {
        const row = [];
        tableHeader.forEach(headerText => {
            const propName = HEADER_TO_PROPERTY_MAP[headerText];
            let cellContent = task[propName] || '';

            if (propName === 'video' || propName === 'audio') {
                cellContent = task[propName] ? '✓' : ' ';
            }
            
            if (propName === 'timestamp') {
                const videoStatus = task.video ? 'checked' : 'unchecked';
                const audioStatus = task.audio ? 'checked' : 'unchecked';
                const comment = `<!-- id:${task.id} video:${videoStatus} audio:${audioStatus} -->`;
                cellContent = `${comment}${cellContent}`;
            }
            row.push(cellContent);
        });
        tableMd += `| ${row.join(' | ')} |\n`;
    });

    // Wrap the generated table in the special markers.
    return `<!-- TABLE_START -->\n${tableMd.trim()}\n<!-- TABLE_END -->\n\n`;
}
