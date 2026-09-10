import './index.css';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import VersionList from '../../components/VersionList';
import { deleteVersion, getVersions, restoreVersion, saveVersion } from '../../services/resumeService.js';
import { HiClock, HiPlus } from 'react-icons/hi2';

function VersionsPage() {
  const { id: resumeId } = useParams();
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      setVersions(await getVersions(resumeId));
    } catch {
      toast.error('Failed to load versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [resumeId]);

  const handleSaveVersion = async () => {
    if (!versionLabel.trim()) {
      toast.error('Please enter a version label');
      return;
    }
    try {
      setIsSaving(true);
      await saveVersion(resumeId, versionLabel.trim());
      toast.success('Version saved successfully');
      setShowSavePrompt(false);
      setVersionLabel('');
      fetchVersions();
    } catch {
      toast.error('Failed to save version');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionId) => {
    try {
      await restoreVersion(resumeId, versionId);
      toast.success('Version restored successfully');
    } catch {
      toast.error('Failed to restore version');
    }
  };

  const handleDelete = async (versionId) => {
    try {
      await deleteVersion(resumeId, versionId);
      toast.success('Version deleted');
      setVersions((current) => current.filter((version) => version._id !== versionId));
    } catch {
      toast.error('Failed to delete version');
    }
  };

  return (
    <DashboardLayout>
      <header className="versions-page__header">
        <div>
          <h1 className="heading-md">Version History</h1>
          <p className="text-muted">Save snapshots and restore previous versions of your resume.</p>
        </div>
        <button type="button" onClick={() => setShowSavePrompt(true)} className="btn btn-primary">
          <HiPlus />
          Save Current Version
        </button>
      </header>

      {showSavePrompt && (
        <section className="versions-save">
          <label className="label-text" htmlFor="version-label">Version Label</label>
          <div className="versions-save__row">
            <input
              id="version-label"
              type="text"
              value={versionLabel}
              onChange={(event) => setVersionLabel(event.target.value)}
              placeholder="e.g., Before AI review, Final draft..."
              className="input-field"
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleSaveVersion();
              }}
            />
            <button type="button" onClick={handleSaveVersion} disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowSavePrompt(false); setVersionLabel(''); }} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="versions-page__loading"><div className="spinner" /></div>
      ) : versions.length === 0 ? (
        <section className="versions-empty">
          <div className="versions-empty__icon"><HiClock /></div>
          <h2 className="heading-sm">No versions yet</h2>
          <p className="text-muted">Save a version to create a snapshot of your current resume. You can restore it anytime.</p>
        </section>
      ) : (
        <VersionList versions={versions} resumeId={resumeId} onRestore={handleRestore} onDelete={handleDelete} />
      )}
    </DashboardLayout>
  );
}

export default VersionsPage;
