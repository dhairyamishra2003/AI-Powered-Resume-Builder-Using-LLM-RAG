import './index.css';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import ProgressBar from '../../components/ProgressBar';
import { HiArrowPath, HiCheckCircle } from 'react-icons/hi2';

function BuilderLayout({
  title,
  completion,
  isSaving,
  lastSavedLabel,
  sidebar,
  preview,
}) {
  const [mobilePanel, setMobilePanel] = useState('editor');

  return (
    <div className="builder-layout-shell">
      <div className="builder-layout-shell__nav">
        <Navbar title={title} showBack />
      </div>
      <div className="builder-layout-shell__progress">
        <ProgressBar percentage={completion} />
        <div className="builder-layout-shell__save">
          {isSaving ? (
            <>
              <HiArrowPath className="spinner-sm" />
              <span>Saving...</span>
            </>
          ) : lastSavedLabel ? (
            <>
              <HiCheckCircle />
              <span>Saved at {lastSavedLabel}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="builder-layout-shell__mobile-switch" aria-label="Resume builder view">
        <button
          type="button"
          className={mobilePanel === 'editor' ? 'is-active' : ''}
          onClick={() => setMobilePanel('editor')}
          aria-pressed={mobilePanel === 'editor'}
        >
          Edit resume
        </button>
        <button
          type="button"
          className={mobilePanel === 'preview' ? 'is-active' : ''}
          onClick={() => setMobilePanel('preview')}
          aria-pressed={mobilePanel === 'preview'}
        >
          Preview
        </button>
      </div>
      <div className={`builder-layout-shell__workspace builder-layout-shell__workspace--${mobilePanel}`}>
        <aside className="builder-layout-shell__sidebar">{sidebar}</aside>
        <section className="builder-layout-shell__preview">{preview}</section>
      </div>
    </div>
  );
}

export default BuilderLayout;
