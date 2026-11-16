const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
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

function sanitizeRichText(dirtyHtml) {
  if (typeof dirtyHtml !== 'string') {
    return '';
  }
  return sanitizeHtml(dirtyHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  }).trim();
}

function sanitizePlainText(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

module.exports = {
  sanitizeRichText,
  sanitizePlainText,
};
