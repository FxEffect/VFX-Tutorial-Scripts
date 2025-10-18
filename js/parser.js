// Parser Module: Handles parsing .md files and converting to/from script objects.

/**
 * Parses the YAML front matter from markdown content.
 * @param {string} markdownContent - The full markdown text.
 * @returns {object} The parsed metadata.
 */
function parseFrontMatter(markdownContent) {
    const match = markdownContent.match(/^[---\n]([\s\S]+?)\n[---\n]/);
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
 * Parses the main table content of the markdown.
 * @param {string} markdownContent - The full markdown text.
 * @returns {Array} An array of table objects.
 */
function parseTables(markdownContent) {
    // This is a complex task. For now, I will just create a placeholder.
    // The full implementation will involve parsing the markdown tables and rows.
    return []; 
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

    // In a real implementation, we would parse the tables and build the content structure.
    // For now, we'll just store the raw content.
    const scriptObject = {
        id: metadata.scriptId,
        title: metadata.title,
        metadata: metadata,
        content: markdownContent // Placeholder for the structured content
    };

    return scriptObject;
}


/**
 * Serializes a script object back into a markdown string.
 * @param {object} scriptObject - The script object to serialize.
 * @returns {string} The markdown string.
 */
export function serializeToMarkdown(scriptObject) {
    // This will be the reverse of the parsing process.
    let markdownString = '---\n';
    for (const key in scriptObject.metadata) {
        markdownString += `${key}: "${scriptObject.metadata[key]}"\n`;
    }
    markdownString += '---\n\n';
    markdownString += scriptObject.content; // Placeholder
    
    return markdownString;
}
