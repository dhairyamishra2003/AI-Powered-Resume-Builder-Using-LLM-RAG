import './index.css';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/AuthContext.jsx';
import { createResume, getResumes, uploadResume } from '../../services/resumeService.js';
import HomeLayout from '../../layouts/HomeLayout';
import ModalLayout from '../../layouts/ModalLayout';
import TEMPLATES from '../../constants/templates.js';
import TemplateCard from '../../components/TemplateCard';
import {
  HiArrowRight,
  HiArrowUpTray,
  HiChartBar,
  HiClock,
  HiDocumentPlus,
  HiDocumentText,
} from 'react-icons/hi2';

function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('modern-professional');
  const [newTargetRole, setNewTargetRole] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('idle');
  const [uploadError, setUploadError] = useState('');

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

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      const resume = await createResume({
        title: newTitle || 'Untitled Resume',
        templateId: newTemplate,
        targetRole: newTargetRole,
      });
      toast.success('Resume created!');
      navigate(`/builder/${resume._id}`);
    } catch (error) {
      toast.error(error?.message || 'Failed to create resume');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setProcessingStage('uploading');
    setUploadProgress(0);
    setUploadError('');
    try {
      const response = await uploadResume(uploadFile, (percent) => {
        setUploadProgress(percent);
        if (percent >= 100) {
          setProcessingStage('processing');
        }
      });
      const resume = response?.data || response;
      if (response?.warnings && response.warnings.length > 0) {
        toast.success('Resume imported successfully!');
      } else {
        toast.success('Resume parsed and imported!');
      }
      setShowUpload(false);
      setUploadFile(null);
      setProcessingStage('idle');
      navigate(`/builder/${resume._id}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to parse resume. Please try a text-selectable PDF.';
      setUploadError(message);
      setProcessingStage('error');
      toast.error(message);
    }
  };


  return (
    <HomeLayout>
      <section className="home-page__hero">
        <h1 className="heading-xl">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h1>
        <p className="text-muted">Choose a workflow and keep moving.</p>
      </section>

      <section className="home-page__actions" aria-label="Primary actions">
        <button type="button" className="home-action-card" onClick={() => setShowCreate(true)}>
          <span className="home-action-card__icon"><HiDocumentPlus /></span>
          <span className="home-action-card__title">Create New Resume</span>
          <span className="home-action-card__copy">Start fresh with AI-powered resume building.</span>
        </button>
        <button type="button" className="home-action-card" onClick={() => setShowUpload(true)}>
          <span className="home-action-card__icon"><HiArrowUpTray /></span>
          <span className="home-action-card__title">Improve Existing</span>
          <span className="home-action-card__copy">Upload a PDF to parse, enhance, and optimize.</span>
        </button>
        <button type="button" className="home-action-card" onClick={() => setShowUpload(true)}>
          <span className="home-action-card__icon"><HiChartBar /></span>
          <span className="home-action-card__title">Check ATS Score</span>
          <span className="home-action-card__copy">Import a resume and analyze it against a job description.</span>
        </button>
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2 className="heading-lg">How It Works</h2>
          <p className="text-muted">Build a professional resume in three focused steps.</p>
        </div>
        <div className="home-steps">
          {[
            ['1', 'Chat with AI', 'Describe your experience naturally and refine the structure.'],
            ['2', 'Shape the Resume', 'Use templates, sections, bullets, and ATS guidance.'],
            ['3', 'Download & Apply', 'Export a polished A4 PDF ready for applications.'],
          ].map(([number, title, description]) => (
            <article className="home-step-card" key={number}>
              <span className="home-step-card__number">{number}</span>
              <h3 className="heading-sm">{title}</h3>
              <p className="text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section__header">
          <h2 className="heading-lg">Choose a Template</h2>
          <p className="text-muted">Preview clean, ATS-aware layouts before you start.</p>
        </div>
        <div className="home-template-grid">
          {TEMPLATES.slice(0, 6).map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={false}
              onSelect={() => {
                setNewTemplate(template.id);
                setShowCreate(true);
              }}
              density="gallery"
            />
          ))}
        </div>
        <div className="home-section__action">
          <Link to="/templates" className="btn btn-outline">
            Browse All Templates <HiArrowRight />
          </Link>
        </div>
      </section>

      {!isLoading && resumes.length > 0 && (
        <section className="home-section">
          <div className="home-recent-header">
            <h2 className="heading-md">Recent Resumes</h2>
            <Link to="/dashboard" className="btn btn-ghost">View All <HiArrowRight /></Link>
          </div>
          <div className="home-recent-grid">
            {resumes.slice(0, 3).map((resume) => (
              <button
                type="button"
                key={resume._id}
                className="home-resume-card"
                onClick={() => navigate(`/builder/${resume._id}`)}
              >
                <span className="home-resume-card__title">{resume.title}</span>
                {resume.targetRole && <span className="home-resume-card__role">{resume.targetRole}</span>}
                <span className="home-resume-card__date">
                  <HiClock />
                  {new Date(resume.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <ModalLayout isOpen={showCreate} title="Create New Resume" size="lg" onClose={() => setShowCreate(false)}>
        <form className="home-create-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="label-text" htmlFor="resume-title">Resume Title</label>
            <input
              id="resume-title"
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              className="input-field"
              placeholder="e.g., Software Engineer Resume"
            />
          </div>
          <div className="form-group">
            <label className="label-text" htmlFor="target-role">Target Role</label>
            <input
              id="target-role"
              type="text"
              value={newTargetRole}
              onChange={(event) => setNewTargetRole(event.target.value)}
              className="input-field"
              placeholder="e.g., Frontend Developer"
            />
          </div>
          <div className="form-group">
            <span className="label-text">Template</span>
            <div className="home-create-template-grid">
              {TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isActive={newTemplate === template.id}
                  onSelect={() => setNewTemplate(template.id)}
                  density="compact"
                />
              ))}
            </div>
          </div>
          <div className="home-modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Resume</button>
          </div>
        </form>
      </ModalLayout>

      <ModalLayout
        isOpen={showUpload}
        title="Upload Existing Resume"
        onClose={() => {
          if (processingStage === 'uploading' || processingStage === 'processing') return;
          setShowUpload(false);
          setProcessingStage('idle');
          setUploadError('');
        }}
      >
        {processingStage === 'uploading' ? (
          <div className="home-upload-state">
            <span className="home-upload-stage-badge">Transferring File</span>
            <div className="home-upload-progress-wrapper">
              <div className="home-upload-progress-track">
                <div className="home-upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="text-xs text-muted">Uploading PDF ({uploadProgress}%)...</p>
            </div>
          </div>
        ) : processingStage === 'processing' ? (
          <div className="home-upload-state">
            <div className="spinner" />
            <span className="home-upload-stage-badge">Analyzing & Saving</span>
            <p className="text-muted" style={{ fontWeight: 600 }}>Structuring resume content with AI...</p>
            <p className="text-xs text-muted">Extracting text, identifying sections, and verifying completeness...</p>
          </div>
        ) : (
          <div className="home-upload-form">
            <p className="text-muted">Upload a PDF and the app will parse it into editable sections.</p>
            <label className={`home-upload-dropzone ${uploadFile ? 'home-upload-dropzone--active' : ''}`}>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(event) => {
                  setUploadFile(event.target.files[0] || null);
                  setUploadError('');
                }}
              />
              <HiArrowUpTray />
              <span>{uploadFile ? uploadFile.name : 'Click to select a PDF file'}</span>
              <small>PDF up to 10MB</small>
            </label>
            {uploadFile && (
              <div className="home-upload-file">
                <HiDocumentText />
                <span>{uploadFile.name}</span>
                <button type="button" className="btn btn-ghost" onClick={() => { setUploadFile(null); setUploadError(''); }}>Remove</button>
              </div>
            )}
            {uploadError && (
              <div className="home-upload-error-box">
                <strong>Upload issue:</strong> {uploadError}
              </div>
            )}
            <div className="home-modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setShowUpload(false);
                  setProcessingStage('idle');
                  setUploadError('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!uploadFile}
                onClick={handleUpload}
              >
                Parse & Import
              </button>
            </div>
          </div>
        )}
      </ModalLayout>
    </HomeLayout>
  );
}

export default HomePage;
