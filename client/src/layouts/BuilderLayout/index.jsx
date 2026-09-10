import './index.css';
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
      <div className="builder-layout-shell__workspace">
        <aside className="builder-layout-shell__sidebar">{sidebar}</aside>
        <section className="builder-layout-shell__preview">{preview}</section>
      </div>
    </div>
  );
}

export default BuilderLayout;
