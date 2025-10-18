// Parser Module: Handles conversion between Markdown and Script Objects

/**
 * Parses a Markdown string into a structured script object.
 * It extracts metadata from the frontmatter and table data from the body.
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

    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const frontmatterMatch = markdownContent.match(frontmatterRegex);

    if (!frontmatterMatch) {
        throw new Error("Markdown frontmatter (---...---) not found.");
    }

    const frontmatterContent = frontmatterMatch[1];
    const bodyContent = markdownContent.substring(frontmatterMatch[0].length);

    frontmatterContent.split('\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join(':').trim().replace(/^"(.*)"$/, '$1');

            // CRITICAL: Ignore progress from MD file, it will be recalculated.
            if (key === 'videoProgress' || key === 'audioProgress') {
                return;
            }

            scriptObject.metadata[key] = value;
            if (key === 'scriptId') {
                scriptObject.id = value;
            }
            if (key === 'title') {
                scriptObject.title = value;
            }
        }
    });

    if (!scriptObject.id) {
        throw new Error("`scriptId` is missing in the Markdown frontmatter.");
    }

    const sections = bodyContent.split(/^(?=## |### )/m);

    let currentSection = null;
    let currentChapter = null;
    let taskCounter = 0;

    sections.forEach(sectionContent => {
        if (sectionContent.trim() === '') return;

        const h2Match = sectionContent.match(/^## (.*)/);
        const h3Match = sectionContent.match(/^### (.*)/);

        if (h2Match) {
            currentSection = {
                title: h2Match[1].trim(),
                chapters: [],
                tasks: [],
            };
            scriptObject.sections.push(currentSection);
            currentChapter = null; // Reset chapter when a new section starts
        } else if (h3Match && currentSection) {
            currentChapter = {
                title: h3Match[1].trim(),
                tasks: [],
            };
            currentSection.chapters.push(currentChapter);
        }

        const tableRegex = /\|([\s\S]*?)\|\s*\n/g;
        let tableMatch;
        while ((tableMatch = tableRegex.exec(sectionContent)) !== null) {
            const rowContent = tableMatch[1].trim();
            if (rowContent.includes('---')) continue; // Skip header separator
            // Skip header row itself by checking for a keyword that only appears in the header
            if (rowContent.includes('画面内容')) continue;

            const cells = rowContent.split('|').map(cell => cell.trim());
            if (cells.length < 6) continue; // Expect at least 6 columns

            const task = {};
            const commentRegex = /<!--\s*id:([^ ]+)\s*video:([^ ]+)\s*audio:([^ ]+)\s*-->/;
            const commentMatch = cells[2].match(commentRegex) || cells[0].match(commentRegex);

            if (commentMatch) {
                task.id = commentMatch[1];
                task.video = commentMatch[2] === 'checked';
                task.audio = commentMatch[3] === 'checked';
            } else {
                // Fallback if no comment found
                task.id = `task-${scriptObject.sections.length}-${taskCounter++}`;
                task.video = cells[0].includes('✓');
                task.audio = cells[1].includes('✓');
            }

            task.timestamp = cells[2].replace(commentRegex, '').trim();
            task.content = cells[3];
            task.dialogue = cells[4];
            task.notes = cells[5];

            if (currentChapter) {
                currentChapter.tasks.push(task);
            } else if (currentSection) {
                currentSection.tasks.push(task);
            }
        }
    });

    return scriptObject;
}

/**
 * Serializes a script object back into a Markdown string.
 *
 * @param {object} scriptObject - The script object to serialize.
 * @param {object} [progress={}] - Optional progress data.
 * @param {number} [progress.videoPercentage] - The video progress percentage.
 * @param {number} [progress.audioPercentage] - The audio progress percentage.
 * @returns {string} The Markdown string representation.
 */
export function serializeToMarkdown(scriptObject, progress = {}) {
    let md = '---\n';
    for (const key in scriptObject.metadata) {
        md += `${key}: "${scriptObject.metadata[key]}"\n`;
    }
    // Add progress if provided
    if (progress.videoPercentage !== undefined) md += `videoProgress: "${progress.videoPercentage}%"\n`;
    if (progress.audioPercentage !== undefined) md += `audioProgress: "${progress.audioPercentage}%"\n`;
    // Add current date on export
    md += `exportDate: "${new Date().toISOString()}"\n`;
    md += '---\n\n';

    md += `# ${scriptObject.title}\n\n`;

    scriptObject.sections.forEach(section => {
        md += `## ${section.title}\n\n`;

        if (section.tasks && section.tasks.length > 0) {
            md += `| 录视频 | 配音 | 时间轴 | 画面内容 | 旁白/对话 | 备注 |\n`;
            md += `| :---: | :---: | --- | --- | --- | --- |\n`;
            section.tasks.forEach(task => {
                const videoCheck = task.video ? '✓' : ' ';
                const audioCheck = task.audio ? '✓' : ' ';
                const videoStatus = task.video ? 'checked' : 'unchecked';
                const audioStatus = task.audio ? 'checked' : 'unchecked';
                const comment = `<!-- id:${task.id} video:${videoStatus} audio:${audioStatus} -->`;
                md += `| ${videoCheck} | ${audioCheck} | ${comment}${task.timestamp} | ${task.content} | ${task.dialogue} | ${task.notes} |\n`;
            });
            md += '\n';
        }

        if (section.chapters) {
            section.chapters.forEach(chapter => {
                md += `### ${chapter.title}\n\n`;
                if (chapter.tasks && chapter.tasks.length > 0) {
                    md += `| 录视频 | 配音 | 时间轴 | 画面内容 | 旁白/对话 | 视觉引导/备注 |\n`;
                    md += `| :---: | :---: | --- | --- | --- | --- |\n`;
                    chapter.tasks.forEach(task => {
                        const videoCheck = task.video ? '✓' : ' ';
                        const audioCheck = task.audio ? '✓' : ' ';
                        const videoStatus = task.video ? 'checked' : 'unchecked';
                        const audioStatus = task.audio ? 'checked' : 'unchecked';
                        const comment = `<!-- id:${task.id} video:${videoStatus} audio:${audioStatus} -->`;
                        md += `| ${videoCheck} | ${audioCheck} | ${comment}${task.timestamp} | ${task.content} | ${task.dialogue} | ${task.notes} |\n`;
                    });
                    md += '\n';
                }
            });
        }
    });

    return md;
}