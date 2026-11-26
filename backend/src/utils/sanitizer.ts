import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS: string[] = [
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'div',
  'span',
];

export function sanitizeRichText(dirtyHtml: unknown): string {
  if (typeof dirtyHtml !== 'string') {
    return '';
  }
  return sanitizeHtml(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

export function sanitizePlainText(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
