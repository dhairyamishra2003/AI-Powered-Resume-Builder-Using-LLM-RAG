import './index.css';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../layouts/DashboardLayout';
import ModalLayout from '../../layouts/ModalLayout';
import TemplateCard, { SAMPLE_DATA, TEMPLATE_SAMPLE_DATA } from '../../components/TemplateCard';
import TEMPLATES from '../../constants/templates.js';
import { createResume } from '../../services/resumeService.js';
import ModernProfessionalTemplate from '../../components/templates/ModernProfessionalTemplate.jsx';
import MinimalAtsTemplate from '../../components/templates/MinimalAtsTemplate.jsx';
import ExecutiveCorporateTemplate from '../../components/templates/ExecutiveCorporateTemplate.jsx';
import SoftwareEngineerTemplate from '../../components/templates/SoftwareEngineerTemplate.jsx';
import AimlEngineerTemplate from '../../components/templates/AimlEngineerTemplate.jsx';
import CreativeCleanTemplate from '../../components/templates/CreativeCleanTemplate.jsx';

const TEMPLATE_COMPONENTS = {
  'modern-professional': ModernProfessionalTemplate,
  'minimal-ats': MinimalAtsTemplate,
  'executive-corporate': ExecutiveCorporateTemplate,
  'software-engineer': SoftwareEngineerTemplate,
  'aiml-engineer': AimlEngineerTemplate,
  'creative-clean': CreativeCleanTemplate,
};

function TemplatesPage() {
  const navigate = useNavigate();
  const previewViewportRef = useRef(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewScale, setPreviewScale] = useState(0.6);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetRole, setNewTargetRole] = useState('');
  const [newTemplate, setNewTemplate] = useState('modern-professional');

  useEffect(() => {
    if (!previewTemplate) return undefined;

    const updateScale = () => {
      if (!previewViewportRef.current) return;
      const { clientWidth, clientHeight } = previewViewportRef.current;
      setPreviewScale(Math.min((clientWidth - 48) / 794, (clientHeight - 48) / 1123, 0.88));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [previewTemplate]);

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

  const PreviewComponent = previewTemplate
    ? TEMPLATE_COMPONENTS[previewTemplate.layout] || TEMPLATE_COMPONENTS[previewTemplate.id] || ModernProfessionalTemplate
    : null;

  return (
    <DashboardLayout>
      <header className="templates-page__hero">
        <div>
          <p className="templates-page__kicker">Resume templates</p>
          <h1 className="heading-xl">Choose a polished, ATS-ready layout</h1>
          <p className="text-muted">Preview every design with realistic content, then start from the format that best fits your role.</p>
        </div>
        <div className="templates-page__stats">
          <span><strong>{TEMPLATES.length}</strong> curated layouts</span>
          <span><strong>A4</strong> paper safe</span>
        </div>
      </header>

      <section className="templates-page__grid">
        {TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isActive={false}
            onSelect={() => setPreviewTemplate(template)}
            density="gallery"
          />
        ))}
      </section>

      <ModalLayout
        isOpen={Boolean(previewTemplate)}
        title={previewTemplate?.name}
        size="xl"
        onClose={() => setPreviewTemplate(null)}
        footer={(
          <button
            type="button"
            className="btn btn-primary templates-page__use"
            onClick={() => {
              setNewTemplate(previewTemplate.id);
              setPreviewTemplate(null);
              setShowCreate(true);
            }}
          >
            Use This Template
          </button>
        )}
      >
        {previewTemplate && PreviewComponent && (
          <div className="templates-page__preview" ref={previewViewportRef}>
            <div className="templates-page__preview-stage" style={{ width: 794 * previewScale, height: 1123 * previewScale }}>
              <div className="templates-page__preview-paper" style={{ transform: `scale(${previewScale})` }}>
                <PreviewComponent sections={TEMPLATE_SAMPLE_DATA[previewTemplate.id] || SAMPLE_DATA} colors={previewTemplate.colors} isPreview={true} />
              </div>
            </div>
          </div>
        )}
      </ModalLayout>

      <ModalLayout isOpen={showCreate} title="Create Resume" onClose={() => setShowCreate(false)}>
        <form className="templates-page__create-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="label-text" htmlFor="template-title">Resume Title</label>
            <input id="template-title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="input-field" placeholder="e.g., Software Engineer Resume" />
          </div>
          <div className="form-group">
            <label className="label-text" htmlFor="template-role">Target Role</label>
            <input id="template-role" value={newTargetRole} onChange={(event) => setNewTargetRole(event.target.value)} className="input-field" placeholder="e.g., Frontend Developer" />
          </div>
          <p className="text-sm text-muted">
            Template: <strong>{TEMPLATES.find((template) => template.id === newTemplate)?.name}</strong>
          </p>
          <div className="templates-page__create-actions">
            <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Resume</button>
          </div>
        </form>
      </ModalLayout>
    </DashboardLayout>
  );
}

export default TemplatesPage;
