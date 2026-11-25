import React from 'react';
import { FileText, Clock, Download, Upload } from 'lucide-react';
import { getInitials } from '../utils/dateFormatter';
import { NavSection, User } from '../types/models';

export interface SidebarProps {
  user: User | null;
  activeNav: NavSection;
  onSelectNav: (nav: NavSection) => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onOpenImport: () => void;
  onOpenProfile: () => void;
}

export default function Sidebar({
  user,
  activeNav,
  onSelectNav,
  onExportJson,
  onExportMarkdown,
  onOpenImport,
  onOpenProfile,
}: SidebarProps): React.ReactElement {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand-logo">
          <span className="brand-icon">
            <FileText size={16} />
          </span>
          <span>Noted</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <button
            type="button"
            className={`sidebar-item ${activeNav === 'all' ? 'active' : ''}`}
            onClick={() => onSelectNav('all')}
          >
            <FileText size={16} />
            <span>All notes</span>
          </button>

          <button
            type="button"
            className={`sidebar-item ${activeNav === 'recent' ? 'active' : ''}`}
            onClick={() => onSelectNav('recent')}
          >
            <Clock size={16} />
            <span>Recent</span>
          </button>

          <button type="button" className="sidebar-item" onClick={onExportJson}>
            <Download size={16} />
            <span>Export (JSON)</span>
          </button>

          <button type="button" className="sidebar-item" onClick={onExportMarkdown}>
            <Download size={16} />
            <span>Export (Markdown)</span>
          </button>

          <button type="button" className="sidebar-item" onClick={onOpenImport}>
            <Upload size={16} />
            <span>Import</span>
          </button>
        </nav>
      </div>

      <button type="button" className="sidebar-profile" onClick={onOpenProfile}>
        <span className="avatar-circle">{getInitials(user?.fullName)}</span>
        <span className="sidebar-profile-info">
          <span className="sidebar-profile-name">{user?.fullName || 'User'}</span>
          <span className="sidebar-profile-link">View profile</span>
        </span>
      </button>
    </aside>
  );
}
