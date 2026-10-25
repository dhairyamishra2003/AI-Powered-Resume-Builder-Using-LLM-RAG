import './index.css';
import { useContext, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { HiCheck, HiDocumentArrowUp, HiOutlineArrowPath } from 'react-icons/hi2';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import { importResumeData } from '../../services/resumeService.js';

const STEPS = ['Reading document', 'Extracting information', 'Structuring resume', 'Mapping fields'];
const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/json'];
const MAX_SIZE = 5 * 1024 * 1024;

function UploadDataImport() {
  const inputRef = useRef(null);
  const { resume, setResume, setHasChanges, setActiveSection } = useContext(ResumeContext);
  const [file, setFile] = useState(null);
  const [state, setState] = useState('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    setError('');
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(selected.type) && !['pdf', 'docx', 'txt', 'json'].includes(extension)) {
      setFile(null); setError('Unsupported file. Choose a PDF, DOCX, TXT, or JSON file.'); return;
    }
    if (selected.size > MAX_SIZE) { setFile(null); setError('The file must be 5 MB or smaller.'); return; }
    setFile(selected);
  };

  const importFile = async () => {
    if (!file) return;
    setState('processing');
    setError('');
    setActiveStep(0);

    const timer1 = setTimeout(() => setActiveStep(1), 600);
    const timer2 = setTimeout(() => setActiveStep(2), 2200);
    const timer3 = setTimeout(() => setActiveStep(3), 4500);

    try {
      const imported = await importResumeData(file);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setActiveStep(4);

      const newSections = imported?.sections || imported || {};
      setResume((current) => ({
        ...current,
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
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setState('idle');
      setError(requestError?.message || 'Unable to import this document.');
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
        <button type="button" className="upload-data-import__choose" onClick={() => inputRef.current?.click()} disabled={state === 'processing'}>
          <HiDocumentArrowUp /> {file ? 'Change File' : 'Choose File'}
        </button>
        {file && (
          <button type="button" className="upload-data-import__import" onClick={importFile} disabled={state === 'processing'}>
            {state === 'processing' ? <><HiOutlineArrowPath /> Autofilling...</> : 'Upload & Autofill'}
          </button>
        )}
      </div>
      {file && (
        <p className="upload-data-import__file">
          <strong>{file.name}</strong> · {file.name.split('.').pop()?.toUpperCase()} · {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      )}
      {state === 'processing' && (
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
        <p className="upload-data-import__success">
          <HiCheck /> Complete — <strong>Imported Data Applied</strong> to all form sections below!
        </p>
      )}
      {error && <p className="upload-data-import__error">{error}</p>}
    </section>
  );
}

export default UploadDataImport;
