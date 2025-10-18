// Parser Module: Handles parsing .md files and converting to/from script objects.

/**
 * Parses the YAML front matter from markdown content.
 * @param {string} markdownContent - The full markdown text.
 * @returns {object} The parsed metadata.
 */
function parseFrontMatter(markdownContent) {
    const match = markdownContent.match(/^[---\r\n]([\s\S]+?)\n[---\r\n]/);
    if (!match) return {};

    const yaml = match[1];
    const metadata = {};
    yaml.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim().replace(/"/g, '');
            metadata[key] = value;
        }
    });
    return metadata;
}

/**
 * Parses the full markdown content into a structured script object.
 * @param {string} markdownContent - The full markdown text.
 * @returns {object} A structured script object.
 */
export function parseMarkdown(markdownContent) {
    const metadata = parseFrontMatter(markdownContent);
    if (!metadata.scriptId || !metadata.title) {
        throw new Error("Markdown file is missing required 'scriptId' or 'title' in the front matter.");
    }

    const lines = markdownContent.split(/\r?\n/);
    const sections = [];
    let currentSection = null;
    let currentChapter = null;
    let inTable = false;

    const metadataRegex = /<!-- id:(.*?) video:(checked|unchecked) audio:(checked|unchecked) -->/;

    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('## ')) {
            // Finish previous section before starting a new one
            if (currentSection) sections.push(currentSection);
            
            currentSection = { title: trimmedLine.substring(3).trim(), chapters: [], tasks: [] };
            currentChapter = null;
            inTable = false;
        } else if (trimmedLine.startsWith('### ')) {
            if (!currentSection) continue; // Should not happen in valid files
            
            currentChapter = { title: trimmedLine.substring(4).trim(), tasks: [] };
            currentSection.chapters.push(currentChapter);
            inTable = false;
        } else if (trimmedLine.startsWith('| :---:')) {
            inTable = true;
        } else if (inTable && trimmedLine.startsWith('|')) {
            const parts = trimmedLine.split('|').map(p => p.trim()).slice(1, -1);
            if (parts.length < 5) continue; // Not a valid task row

            const metadataMatch = parts[2].match(metadataRegex);
            if (!metadataMatch) continue;

            const [, id, videoStatus, audioStatus] = metadataMatch;
            
            const task = {
                id: id.trim(),
                video: videoStatus === 'checked',
                audio: audioStatus === 'checked',
                timestamp: parts[2].replace(metadataRegex, '').trim(),
                content: parts[3].replace(/<br>/g, '\n'),
                dialogue: parts[4].replace(/<br>/g, '\n'),
                notes: (parts[5] || '').replace(/<br>/g, '\n')
            };

            if (currentChapter) {
                currentChapter.tasks.push(task);
            } else if (currentSection) {
                currentSection.tasks.push(task);
            }
        }
    }
    if (currentSection) sections.push(currentSection); // Add the last section

    return {
        id: metadata.scriptId,
        title: metadata.title,
        metadata,
        sections
    };
}

/**
 * Serializes a script object back into a markdown string.
 * @param {object} scriptObject - The script object to serialize.
 * @returns {string} The markdown string.
 */
export function serializeToMarkdown(scriptObject) {
    let md = '---\n';
    for (const key in scriptObject.metadata) {
        md += `${key}: "${scriptObject.metadata[key]}"\n`;
    }
    md += '---\n\n';

    md += `# ${scriptObject.title}\n\n`;

    scriptObject.sections.forEach(section => {
        md += `## ${section.title}\n\n`;
        if (section.tasks && section.tasks.length > 0) {
            md += serializeTable(section.tasks);
        }
        if (section.chapters && section.chapters.length > 0) {
            section.chapters.forEach(chapter => {
                md += `### ${chapter.title}\n\n`;
                md += serializeTable(chapter.tasks);
            });
        }
    });

    return md;
}

function serializeTable(tasks) {
    let tableMd = `| 录视频 | 配音 | 时间轴 | 画面内容 | 旁白/对话 | 备注 |\n`;
    tableMd += `| :---: | :---: | --- | --- | --- | --- |\n`;
    tasks.forEach(task => {
        const video = task.video ? '✓' : ' ';
        const audio = task.audio ? '✓' : ' ';
        const videoStatus = task.video ? 'checked' : 'unchecked';
        const audioStatus = task.audio ? 'checked' : 'unchecked';
        const metadata = `<!-- id:${task.id} video:${videoStatus} audio:${audioStatus} -->`;
        
        const cells = [
            video,
            audio,
            `${metadata}${task.timestamp}`,
            task.content.replace(/\n/g, '<br>'),
            task.dialogue.replace(/\n/g, '<br>'),
            task.notes.replace(/\n/g, '<br>')
        ].map(cell => cell.replace(/\|/g, '\\|'));

        tableMd += `| ${cells.join(' | ')} |\n`;
    });
    return tableMd + '\n';
}