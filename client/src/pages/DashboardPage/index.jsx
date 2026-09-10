import './index.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deleteResume, getResumes } from '../../services/resumeService.js';
import TEMPLATES from '../../constants/templates.js';
import { HiClock, HiDocumentText, HiSparkles, HiTrash } from 'react-icons/hi2';

function DashboardPage() {
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setResumes(await getResumes());
      } catch {
        toast.error('Failed to load resumes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  const handleDelete = async (id, event) => {
    event.stopPropagation();
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await deleteResume(id);
      setResumes((current) => current.filter((resume) => resume._id !== id));
      toast.success('Resume deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getTemplate = (id) => TEMPLATES.find((template) => template.id === id) || TEMPLATES[0];

  return (
    <DashboardLayout>
      <header className="dashboard-page__header">
        <div>
          <h1 className="heading-lg">My Resumes</h1>
          <p className="text-muted">{resumes.length} resume{resumes.length === 1 ? '' : 's'} created</p>
        </div>
      </header>

      {isLoading && (
        <div className="dashboard-page__loading">
          <div className="spinner" />
        </div>
      )}

      {!isLoading && resumes.length === 0 && (
        <section className="dashboard-empty">
          <div className="dashboard-empty__icon"><HiDocumentText /></div>
          <h2 className="heading-sm">No resumes yet</h2>
          <p className="text-muted">Head to Home to create your first AI-powered resume.</p>
        </section>
      )}

      {!isLoading && resumes.length > 0 && (
        <section className="dashboard-grid">
          {resumes.map((resume) => {
            const template = getTemplate(resume.templateId);
            const score = resume.atsScore?.overall || 0;
            const scoreColor = score >= 80 ? 'var(--color-success)' : score >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
            return (
              <button
                type="button"
                key={resume._id}
                className="dashboard-card"
                onClick={() => navigate(`/builder/${resume._id}`)}
              >
                <span
                  className="dashboard-card__bar"
                  style={{ '--template-primary': template.colors.primary, '--template-accent': template.colors.accent }}
                />
                <span className="dashboard-card__body">
                  <span className="dashboard-card__top">
                    <span>
                      <span className="dashboard-card__title">{resume.title}</span>
                      {resume.targetRole && <span className="dashboard-card__role">{resume.targetRole}</span>}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className="dashboard-card__delete"
                      onClick={(event) => handleDelete(resume._id, event)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') handleDelete(resume._id, event);
                      }}
                    >
                      <HiTrash />
                    </span>
                  </span>

                  {score > 0 && (
                    <span className="dashboard-card__score">
                      <HiSparkles />
                      <span className="dashboard-card__score-track">
                        <span className="dashboard-card__score-fill" style={{ width: `${score}%`, backgroundColor: scoreColor }} />
                      </span>
                      <strong>{score}</strong>
                    </span>
                  )}

                  <span className="dashboard-card__footer">
                    <span><HiClock /> {formatDate(resume.updatedAt)}</span>
                    <span className="badge" style={{ backgroundColor: template.colors.light, color: template.colors.primary }}>{template.name}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </section>
      )}
    </DashboardLayout>
  );
}

export default DashboardPage;
