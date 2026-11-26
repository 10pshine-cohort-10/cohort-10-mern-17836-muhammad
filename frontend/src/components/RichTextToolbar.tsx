import React from 'react';
import { List, Quote } from 'lucide-react';

export interface RichTextToolbarProps {
  onCommand: (command: string, value?: string) => void;
}

export default function RichTextToolbar({
  onCommand,
}: RichTextToolbarProps): React.ReactElement {
  return (
    <div className="rich-toolbar" role="toolbar" aria-label="Text formatting">
      <button
        type="button"
        className="toolbar-btn"
        title="Bold"
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
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
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
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
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
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
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
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
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
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
        onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          onCommand('formatBlock', 'BLOCKQUOTE');
        }}
      >
        <Quote size={14} />
      </button>
    </div>
  );
}
