import './index.css';
import { useContext, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiCheck, HiDocumentArrowUp, HiOutlineArrowPath } from 'react-icons/hi2';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import { importResumeData } from '../../services/resumeService.js';

const STEPS = [
  'Uploading document',
  'Reading & extracting text',
  'Structuring resume with AI & heuristics',
  'Validating completeness & mapping fields',
];
const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/json'];
const MAX_SIZE = 10 * 1024 * 1024;

function UploadDataImport() {
  const inputRef = useRef(null);
  const { resume, setResume, setHasChanges, setActiveSection } = useContext(ResumeContext);
  const [file, setFile] = useState(null);
  const [state, setState] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'complete'
  const [uploadPercent, setUploadPercent] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [importSummary, setImportSummary] = useState('');
  const [error, setError] = useState('');

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    setError('');
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(selected.type) && !['pdf', 'docx', 'txt', 'json'].includes(extension)) {
      setFile(null); setError('Unsupported file. Choose a PDF, DOCX, TXT, or JSON file.'); return;
    }
    if (selected.size > MAX_SIZE) { setFile(null); setError('The file must be 10 MB or smaller.'); return; }
    setFile(selected);
  };

  const importFile = async () => {
    if (!file) return;
    setState('uploading');
    setError('');
    setUploadPercent(0);
    setActiveStep(0);

    try {
      const imported = await importResumeData(file, (percent) => {
        setUploadPercent(percent);
        if (percent >= 100) {
          setState('processing');
          setActiveStep(1);
        }
      });

      setActiveStep(3);

      const newSections = imported?.sections || imported || {};

      const summaryParts = [];
      if (newSections.personalInfo?.fullName) summaryParts.push(newSections.personalInfo.fullName);
      if (newSections.projects?.length) summaryParts.push(`${newSections.projects.length} project(s)`);
      if (newSections.experience?.length) summaryParts.push(`${newSections.experience.length} experience(s)`);
      if (newSections.education?.length) summaryParts.push(`${newSections.education.length} education item(s)`);
      if (newSections.certifications?.length) summaryParts.push(`${newSections.certifications.length} certification(s)`);
      if (newSections.publications?.length) summaryParts.push(`${newSections.publications.length} publication(s)`);
      setImportSummary(summaryParts.join(' · ') || 'All fields populated');

      setResume((current) => ({
        ...current,
        targetRole: newSections.personalInfo?.targetRole || current.targetRole,
        sections: {
          ...current.sections,
          ...newSections,
          personalInfo: {
            ...(current.sections?.personalInfo || {}),
            ...(newSections.personalInfo || {}),
          },
          skills: {
            ...(current.sections?.skills || {}),
            ...(newSections.skills || {}),
          },
        },
      }));
      setHasChanges(true);
      setActiveSection('personalInfo');
      setState('complete');
      toast.success('Resume imported successfully! All fields filled.');
    } catch (requestError) {
      setState('idle');
      setError(requestError?.message || 'Unable to import this document. Please ensure it has readable text.');
    }
  };

  return (
    <section className="upload-data-import" aria-labelledby="upload-data-title">
      <div className="upload-data-import__copy">
        <h3 id="upload-data-title">Upload Existing Resume</h3>
        <p>Upload PDF, DOCX, TXT or JSON and let AI automatically fill your resume.</p>
      </div>
      <input ref={inputRef} className="upload-data-import__input" type="file" accept=".pdf,.docx,.txt,.json" onChange={selectFile} />
      <div className="upload-data-import__actions">
        <button type="button" className="upload-data-import__choose" onClick={() => inputRef.current?.click()} disabled={state === 'uploading' || state === 'processing'}>
          <HiDocumentArrowUp /> {file ? 'Change File' : 'Choose File'}
        </button>
        {file && (
          <button type="button" className="upload-data-import__import" onClick={importFile} disabled={state === 'uploading' || state === 'processing'}>
            {state === 'uploading' ? <><HiOutlineArrowPath /> Uploading ({uploadPercent}%)...</> : state === 'processing' ? <><HiOutlineArrowPath /> Processing...</> : 'Upload & Autofill'}
          </button>
        )}
      </div>
      {file && (
        <p className="upload-data-import__file">
          <strong>{file.name}</strong> · {file.name.split('.').pop()?.toUpperCase()} · {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}

      {state === 'uploading' && (
        <div className="upload-data-import__progress-wrapper">
          <div className="upload-data-import__bar-track">
            <div className="upload-data-import__bar-fill" style={{ width: `${uploadPercent}%` }} />
          </div>
          <span style={{ fontSize: 12, color: '#6d28d9' }}>Transferring file ({uploadPercent}%)...</span>
        </div>
      )}

      {(state === 'processing' || state === 'uploading') && (
        <ol className="upload-data-import__progress">
          {STEPS.map((step, index) => {
            const isDone = activeStep > index;
            const isActive = activeStep === index;
            return (
              <li key={step} className={isActive ? 'is-active' : isDone ? 'is-done' : ''}>
                <span>
                  {isDone ? <HiCheck /> : isActive ? <HiOutlineArrowPath /> : index + 1}
                </span>
                {step}
              </li>
            );
          })}
        </ol>
      )}
      {state === 'complete' && (
        <div className="upload-data-import__complete-box">
          <p className="upload-data-import__success">
            <HiCheck /> Complete — <strong>Imported Data Applied</strong>!
          </p>
          {importSummary && (
            <p style={{ fontSize: 12, color: '#15803d', margin: '4px 0 0' }}>
              {importSummary}
            </p>
          )}
        </div>
      )}
      {error && <p className="upload-data-import__error">{error}</p>}
    </section>
  );
}

export default UploadDataImport;
