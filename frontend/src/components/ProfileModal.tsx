import React from 'react';
import { getInitials } from '../utils/dateFormatter';
import { User } from '../types/models';

export interface ProfileModalProps {
  user: User | null;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export default function ProfileModal({
  user,
  onClose,
  onLogout,
}: ProfileModalProps): React.ReactElement | null {
  if (!user) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <div className="modal-card">
        <div className="profile-header-center">
          <div className="avatar-circle avatar-circle-lg">{getInitials(user.fullName)}</div>
          <h2 id="profile-title">{user.fullName}</h2>
          <p>{user.email}</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profile-fullname">
            Full name
          </label>
          <input
            id="profile-fullname"
            className="form-input"
            type="text"
            value={user.fullName}
            readOnly
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            className="form-input"
            type="email"
            value={user.email}
            readOnly
          />
        </div>

        <div className="modal-footer-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn-danger-outline" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
