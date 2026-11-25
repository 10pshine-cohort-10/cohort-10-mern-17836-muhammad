import { Note, NotePayload, NoteTag } from '../types/models';

const VALID_TAGS = new Set<NoteTag>(['Work', 'Personal', 'Ideas']);

export function stripHtmlToText(html?: string | null): string {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return doc.body.textContent || '';
}

export function exportNotesAsJson(notes: Note[]): void {
  const exportPayload: NotePayload[] = notes.map(({ title, content, tag, color }) => ({
    title,
    content,
    tag,
    color,
  }));
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `noted-export-${new Date().toISOString().slice(0, 10)}.json`);
}

export function exportNotesAsMarkdown(notes: Note[]): void {
  const mdContent = notes
    .map((note) => `# ${note.title}\n**Tag:** ${note.tag}\n\n${stripHtmlToText(note.content)}`)
    .join('\n\n---\n\n');
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `noted-export-${new Date().toISOString().slice(0, 10)}.md`);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedNotesFile(fileName: string, rawText: string): NotePayload[] {
  if (fileName.endsWith('.json')) {
    const parsed = JSON.parse(rawText) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : (parsed as { notes?: unknown } | null)?.notes;
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('JSON file must contain a non-empty array of notes.');
    }
    return list.map((rawItem: unknown): NotePayload => {
      const item = rawItem as Partial<NotePayload> | null;
      if (!item || typeof item.title !== 'string' || !item.title.trim()) {
        throw new Error('Each imported note must include a valid "title".');
      }
      const tag: NoteTag =
        typeof item.tag === 'string' && VALID_TAGS.has(item.tag as NoteTag)
          ? (item.tag as NoteTag)
          : 'Personal';
      const color =
        typeof item.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(item.color)
          ? item.color
          : '#FFFFFF';

      return {
        title: item.title.trim(),
        content: typeof item.content === 'string' ? item.content : '',
        tag,
        color,
      };
    });
  }

  if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
    const sections = rawText
      .split(/\n---\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    if (sections.length === 0) {
      throw new Error('Markdown file contains no readable notes.');
    }
    return sections.map((section): NotePayload => {
      const lines = section.split('\n');
      const title = lines[0].replace(/^#+\s*/, '').trim() || 'Imported Note';
      const body = lines.slice(1).join('<br/>').trim();
      return {
        title,
        content: body,
        tag: 'Personal',
        color: '#FFFFFF',
      };
    });
  }

  throw new Error('Unsupported file format. Please upload a .json or .md file.');
}
