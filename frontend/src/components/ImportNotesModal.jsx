import React, { useState } from 'react';
import { parseImportedNotesFile } from '../utils/noteFileUtils';

export default function ImportNotesModal({ onClose, onImport }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = async (event) => {
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
      setError(err.message || 'Failed to import notes file.');
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
