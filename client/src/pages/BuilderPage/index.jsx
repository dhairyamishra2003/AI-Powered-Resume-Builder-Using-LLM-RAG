import './index.css';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ResumeContext, ResumeProvider } from '../../context/ResumeContext.jsx';
import { getResume, updateResume } from '../../services/resumeService.js';
import BuilderLayout from '../../layouts/BuilderLayout';
import Sidebar from '../../components/Sidebar';
import ResumePreview from '../../components/ResumePreview';

function BuilderContent() {
  const { id } = useParams();
  const {
    resume,
    loadResume,
    getCompletionPercentage,
    isSaving,
    setIsSaving,
    lastSaved,
    setLastSaved,
    hasChanges,
    setHasChanges,
  } = useContext(ResumeContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        loadResume(await getResume(id));
      } catch {
        toast.error('Failed to load resume');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  useEffect(() => {
    if (!hasChanges || !resume._id) return undefined;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await updateResume(resume._id, {
          title: resume.title,
          templateId: resume.templateId,
          targetRole: resume.targetRole,
          jobDescription: resume.jobDescription,
          sections: resume.sections,
        });
        setLastSaved(new Date());
        setHasChanges(false);
      } catch (error) {
        toast.error(error?.message || 'Failed to save changes');
      } finally {
        setIsSaving(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasChanges, resume, setHasChanges, setIsSaving, setLastSaved]);

  const lastSavedLabel = lastSaved
    ? lastSaved.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';

  if (isLoading) {
    return (
      <div className="builder-page-loading">
        <div className="spinner" />
        <p className="text-muted">Loading resume...</p>
      </div>
    );
  }

  return (
    <BuilderLayout
      title={resume.title}
      completion={getCompletionPercentage()}
      isSaving={isSaving}
      lastSavedLabel={lastSavedLabel}
      sidebar={<Sidebar />}
      preview={<ResumePreview />}
    />
  );
}

function BuilderPage() {
  return (
    <ResumeProvider>
      <BuilderContent />
    </ResumeProvider>
  );
}

export default BuilderPage;
