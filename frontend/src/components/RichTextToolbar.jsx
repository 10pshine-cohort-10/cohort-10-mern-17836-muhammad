import React from 'react';
import { List, Quote } from 'lucide-react';

export default function RichTextToolbar({ onCommand }) {
  return (
    <div className="rich-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        type="button"
        className="toolbar-btn"
        title="Bold"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('bold');
        }}
      >
        B
      </button>
      <button
        type="button"
        className="toolbar-btn"
        style={{ fontStyle: 'italic' }}
        title="Italic"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('italic');
        }}
      >
        I
      </button>
      <button
        type="button"
        className="toolbar-btn"
        style={{ textDecoration: 'underline' }}
        title="Underline"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('underline');
        }}
      >
        U
      </button>
      <button
        type="button"
        className="toolbar-btn"
        title="Heading"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('formatBlock', 'H3');
        }}
      >
        H
      </button>
      <button
        type="button"
        className="toolbar-btn"
        title="Bullet List"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('insertUnorderedList');
        }}
      >
        <List size={15} />
      </button>
      <button
        type="button"
        className="toolbar-btn"
        title="Quote"
        onMouseDown={(e) => {
          e.preventDefault();
          onCommand('formatBlock', 'BLOCKQUOTE');
        }}
      >
        <Quote size={14} />
      </button>
    </div>
  );
}
