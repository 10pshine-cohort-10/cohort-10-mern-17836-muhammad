import React, { useState } from 'react';
import { parseImportedNotesFile } from '../utils/noteFileUtils';
import { NotePayload } from '../types/models';

export interface ImportNotesModalProps {
  onClose: () => void;
  onImport: (notes: NotePayload[]) => Promise<void>;
}

export default function ImportNotesModal({
  onClose,
  onImport,
}: ImportNotesModalProps): React.ReactElement {
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setError('');

    try {
      setSubmitting(true);
      const rawText = await file.text();
      const parsedNotes = parseImportedNotesFile(file.name, rawText);
      await onImport(parsedNotes);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import notes file.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="modal-card">
        <h2 id="import-title" style={{ fontSize: '20px', marginBottom: '8px' }}>
          Import notes
        </h2>
        <p style={{ fontSize: '13.5px', color: '#6B7280', marginBottom: '18px' }}>
          Upload a previously exported <strong>.json</strong> or <strong>.md</strong> notes file.
        </p>

        {error && <div className="error-banner">{error}</div>}

        <input
          type="file"
          accept=".json,.md,.txt"
          disabled={submitting}
          onChange={handleFileChange}
          aria-label="Choose notes file"
        />

        <div className="modal-footer-actions" style={{ gridTemplateColumns: '1fr' }}>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
