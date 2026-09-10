import './index.css';
import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiAcademicCap, HiCheck, HiExclamationTriangle, HiOutlineArrowPath, HiXMark } from 'react-icons/hi2';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import {
  confirmDigiLockerImport,
  getDigiLockerPreview,
  getDigiLockerStatus,
  startDigiLockerAuth,
} from '../../services/digilockerService.js';

const educationKey = (item) => [
  item.institution || '',
  item.degree || '',
  item.field || '',
  item.startDate || '',
  item.endDate || '',
  item.gpa || '',
].join('|');

function DigiLockerImport() {
  const { resume, loadResume } = useContext(ResumeContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [configured, setConfigured] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const education = preview?.education || [];
  const unavailableFields = preview?.unavailableFields || [];

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getDigiLockerStatus();
        setConfigured(data.configured);
        if (!data.configured) {
          setStatus('not-configured');
          setMessage('DigiLocker/APAAR import needs official requester API credentials before live use.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error?.message || 'Unable to check DigiLocker/APAAR integration.');
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    const digilockerStatus = searchParams.get('digilocker');
    const token = searchParams.get('importToken');
    const callbackMessage = searchParams.get('message');
    if (!digilockerStatus) return;

    if (digilockerStatus !== 'success') {
      setStatus(digilockerStatus === 'not_configured' ? 'not-configured' : 'error');
      setMessage(callbackMessage || 'DigiLocker authorization could not be completed.');
      setModalOpen(true);
      return;
    }
    if (!token || !resume._id) return;

    const loadPreview = async () => {
      setStatus('loading');
      setModalOpen(true);
      try {
        const data = await getDigiLockerPreview({ resumeId: resume._id, importToken: token });
        setConfigured(data.configured);
        setImportToken(token);
        setPreview(data.preview);
        setSelectedKeys((data.preview.education || []).map(educationKey));
        setStatus(data.preview.partial ? 'partial' : 'preview');
        setMessage(data.preview.partial ? 'Some academic fields were not provided by DigiLocker/APAAR.' : '');
      } catch (error) {
        setStatus('error');
        setMessage(error?.message || 'Unable to load academic import preview.');
      } finally {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('digilocker');
        nextParams.delete('importToken');
        nextParams.delete('message');
        setSearchParams(nextParams, { replace: true });
      }
    };
    loadPreview();
  }, [resume._id, searchParams, setSearchParams]);

  const openModal = () => {
    setModalOpen(true);
    if (!resume._id) {
      setStatus('error');
      setMessage('Save this resume before importing academic details.');
      return;
    }
    if (!preview) setStatus(configured ? 'idle' : 'not-configured');
  };

  const handleStartImport = async () => {
    if (!resume._id) {
      setStatus('error');
      setMessage('Save this resume before importing academic details.');
      return;
    }

    setStatus('authorizing');
    setMessage('');
    try {
      const data = await startDigiLockerAuth({
        resumeId: resume._id,
        templateId: resume.templateId,
      });
      window.location.href = data.authorizationUrl;
    } catch (error) {
      const notConfigured = error?.response?.data?.code === 'DIGILOCKER_NOT_CONFIGURED';
      setStatus(notConfigured ? 'not-configured' : 'error');
      setConfigured(!notConfigured);
      setMessage(error?.message || 'Unable to start DigiLocker/APAAR authorization.');
    }
  };

  const toggleEducation = (key) => {
    setSelectedKeys((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  const handleConfirm = async () => {
    setStatus('saving');
    try {
      const selectedEducation = education.filter((item) => selectedKeys.includes(educationKey(item)));
      const updatedResume = await confirmDigiLockerImport({
        resumeId: resume._id,
        importToken,
        education: selectedEducation,
      });
      loadResume(updatedResume);
      setStatus('success');
      setMessage('Academic details imported.');
      setModalOpen(false);
      toast.success('Academic details imported');
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || 'Unable to save academic import.');
    }
  };

  const isBusy = ['authorizing', 'loading', 'saving'].includes(status);
  const showPreview = ['preview', 'partial', 'saving'].includes(status) && preview;

  return (
    <>
      <div className="digilocker-import">
        <div>
          <h3>Import Academic Details</h3>
          {message && !modalOpen && (
            <p className={`digilocker-import__message digilocker-import__message--${status}`}>{message}</p>
          )}
        </div>
        <button className="digilocker-import__button" type="button" onClick={openModal} disabled={!resume._id}>
          <HiAcademicCap />
          <span>Import</span>
        </button>
      </div>

      {modalOpen && (
        <div className="digilocker-modal" role="dialog" aria-modal="true" aria-labelledby="digilocker-modal-title">
          <div className="digilocker-modal__panel">
            <div className="digilocker-modal__header">
              <div>
                <h2 id="digilocker-modal-title">Import Academic Details</h2>
                <p>Connect DigiLocker/APAAR, grant consent, and review verified academic data before saving.</p>
              </div>
              <button className="digilocker-modal__close" type="button" onClick={() => setModalOpen(false)} aria-label="Close academic import">
                <HiXMark />
              </button>
            </div>

            {!configured && (
              <div className="digilocker-import__notice">
                <HiExclamationTriangle />
                <span>Official DigiLocker/APAAR requester API credentials are not configured.</span>
              </div>
            )}

            {message && <p className={`digilocker-import__message digilocker-import__message--${status}`}>{message}</p>}

            {!showPreview && (
              <div className="digilocker-modal__form">
                <button className="digilocker-modal__primary" type="button" onClick={handleStartImport} disabled={!configured || !resume._id || isBusy}>
                  {status === 'authorizing' ? <HiOutlineArrowPath /> : <HiAcademicCap />}
                  <span>{status === 'authorizing' ? 'Connecting...' : 'Connect DigiLocker'}</span>
                </button>
              </div>
            )}

            {showPreview && (
              <div className="digilocker-preview">
                <div className="digilocker-preview__section">
                  <h3>Academic Information Preview</h3>
                  {education.length ? education.map((item) => {
                    const key = educationKey(item);
                    return (
                      <label key={key} className="digilocker-preview__record">
                        <input type="checkbox" checked={selectedKeys.includes(key)} onChange={() => toggleEducation(key)} disabled={status === 'saving'} />
                        <HiCheck />
                        <span>
                          <strong>{item.institution || 'Institution not provided'}</strong>
                          <small>{[item.degree, item.field, item.endDate, item.gpa].filter(Boolean).join(' | ') || 'Additional fields not provided'}</small>
                        </span>
                      </label>
                    );
                  }) : <p className="digilocker-preview__empty">No importable academic records were returned.</p>}
                </div>

                {unavailableFields.length > 0 && (
                  <div className="digilocker-preview__section">
                    <h3>Unavailable fields</h3>
                    {unavailableFields.map((field) => (
                      <div key={field.key} className="digilocker-preview__unavailable">
                        <span>{field.label}</span>
                        <small>{field.reason}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="digilocker-modal__actions">
                  <button className="digilocker-modal__secondary" type="button" onClick={() => setModalOpen(false)} disabled={status === 'saving'}>Cancel</button>
                  <button className="digilocker-modal__primary" type="button" onClick={handleConfirm} disabled={status === 'saving' || selectedKeys.length === 0}>
                    <HiCheck />
                    <span>{status === 'saving' ? 'Saving...' : 'Import Selected Data'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default DigiLockerImport;
