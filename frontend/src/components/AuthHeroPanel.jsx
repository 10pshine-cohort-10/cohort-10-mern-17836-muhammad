import React from 'react';
import { FileText } from 'lucide-react';

export default function AuthHeroPanel() {
  return (
    <section className="auth-hero" aria-label="Noted overview">
      <div className="brand-logo">
        <span className="brand-icon">
          <FileText size={16} />
        </span>
        <span>Noted</span>
      </div>

      <div className="hero-cards-stage" aria-hidden="true">
        <div className="hero-float-card hero-card-mint">
          <h4>Meeting notes</h4>
          <div className="hero-card-lines">
            <div className="hero-line" style={{ width: '90%' }} />
            <div className="hero-line" style={{ width: '70%' }} />
          </div>
        </div>

        <div className="hero-float-card hero-card-butter">
          <h4>Trip ideas</h4>
          <div className="hero-card-lines">
            <div className="hero-line" style={{ width: '85%' }} />
            <div className="hero-line" style={{ width: '65%' }} />
          </div>
        </div>

        <div className="hero-float-card hero-card-white">
          <h4>Reading list</h4>
          <div className="hero-card-lines">
            <div className="hero-line" style={{ width: '92%' }} />
            <div className="hero-line" style={{ width: '80%' }} />
            <div className="hero-line" style={{ width: '58%' }} />
          </div>
        </div>
      </div>

      <div className="auth-hero-copy">
        <h1>
          Your thoughts, beautifully
          <br />
          organized.
        </h1>
        <p>Write, format and find every note in one private place.</p>
      </div>
    </section>
  );
}
