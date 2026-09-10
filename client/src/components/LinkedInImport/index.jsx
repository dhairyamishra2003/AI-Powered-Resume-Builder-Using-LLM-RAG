import './index.css';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiCheck, HiExclamationTriangle, HiOutlineArrowPath, HiOutlineCloudArrowDown, HiXMark } from 'react-icons/hi2';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import {
  confirmLinkedInImport,
  getLinkedInPreview,
  getLinkedInStatus,
  startLinkedInAuth,
} from '../../services/linkedinService.js';

const profileUrlPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-Za-z0-9_.-]+\/?$/;

const buildSelectedSections = (availableFields, selectedKeys) => availableFields.reduce((sections, item) => {
  if (!selectedKeys.includes(item.key)) return sections;
  if (item.section === 'personalInfo') {
    return {
      ...sections,
      personalInfo: {
        ...(sections.personalInfo || {}),
        [item.field]: item.value,
      },
    };
  }
  return { ...sections, [item.section]: item.value };
}, { personalInfo: {} });

function LinkedInImport() {
  const { resume, loadResume } = useContext(ResumeContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [configured, setConfigured] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [importToken, setImportToken] = useState('');
  const [preview, setPreview] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const availableFields = preview?.availableFields || [];
  const unavailableFields = preview?.unavailableFields || [];

  const hasExistingData = useMemo(() => {
    const sections = resume.sections || {};
    const info = sections.personalInfo || {};
    return Boolean(
      info.fullName || info.email || info.phone || info.location || info.linkedIn || info.portfolio
      || sections.summary || sections.experience?.length || sections.education?.length
      || sections.skills?.technical?.length || sections.projects?.length || sections.certifications?.length
    );
  }, [resume.sections]);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await getLinkedInStatus();
        setConfigured(data.configured);
        if (!data.configured) {
          setStatus('not-configured');
          setMessage('LinkedIn integration is not configured.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error?.message || 'Unable to check LinkedIn integration.');
      }
    };
    loadStatus();
  }, []);

  useEffect(() => {
    const linkedinStatus = searchParams.get('linkedin');
    const token = searchParams.get('importToken');
    const callbackMessage = searchParams.get('message');
    if (!linkedinStatus) return;

    if (linkedinStatus !== 'success') {
      setStatus(linkedinStatus === 'not_configured' ? 'not-configured' : 'error');
      setMessage(callbackMessage || 'LinkedIn authorization could not be completed.');
      setModalOpen(true);
      return;
    }
    if (!token || !resume._id) return;

    const loadPreview = async () => {
      setStatus('loading');
      setModalOpen(true);
      try {
        const data = await getLinkedInPreview({ resumeId: resume._id, importToken: token });
        setConfigured(data.configured);
        setImportToken(token);
        setPreview(data.preview);
        setSelectedKeys(data.preview.availableFields.map((field) => field.key));
        setStatus(data.preview.partial ? 'partial' : 'preview');
        setMessage(data.preview.partial ? 'Some resume fields are not available from the current LinkedIn API response.' : '');
      } catch (error) {
        setStatus('error');
        setMessage(error?.message || 'Unable to load LinkedIn import preview.');
      } finally {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('linkedin');
        nextParams.delete('importToken');
        nextParams.delete('message');
        setSearchParams(nextParams, { replace: true });
      }
    };
    loadPreview();
  }, [resume._id, searchParams, setSearchParams]);

  const openModal = () => {
    setModalOpen(true);
    setUrlError('');
    if (!resume._id) {
      setStatus('error');
      setMessage('Save this resume before importing from LinkedIn.');
      return;
    }
    if (!preview) setStatus(configured ? 'idle' : 'not-configured');
  };

  const handleStartImport = async () => {
    if (!resume._id) {
      setStatus('error');
      setMessage('Save this resume before importing from LinkedIn.');
      return;
    }

    const trimmedUrl = profileUrl.trim();
    if (!profileUrlPattern.test(trimmedUrl)) {
      setUrlError('Enter a valid LinkedIn profile URL, such as https://www.linkedin.com/in/username.');
      return;
    }

    setUrlError('');
    setStatus('authorizing');
    setMessage('');
    try {
      const data = await startLinkedInAuth({
        resumeId: resume._id,
        templateId: resume.templateId,
        profileUrl: trimmedUrl,
      });
      window.location.href = data.authorizationUrl;
    } catch (error) {
      const notConfigured = error?.response?.data?.code === 'LINKEDIN_NOT_CONFIGURED';
      setStatus(notConfigured ? 'not-configured' : 'error');
      setConfigured(!notConfigured);
      setMessage(error?.message || 'Unable to start LinkedIn authorization.');
    }
  };

  const toggleField = (key) => {
    setSelectedKeys((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ));
  };

  const handleConfirm = async () => {
    if (hasExistingData) {
      const shouldContinue = window.confirm('Selected LinkedIn data may replace matching existing resume fields. Continue?');
      if (!shouldContinue) return;
    }

    setStatus('saving');
    try {
      const updatedResume = await confirmLinkedInImport({
        resumeId: resume._id,
        importToken,
        sections: buildSelectedSections(availableFields, selectedKeys),
      });
      loadResume(updatedResume);
      setStatus('success');
      setMessage('LinkedIn profile data imported.');
      setModalOpen(false);
      toast.success('LinkedIn import saved');
    } catch (error) {
      setStatus('error');
      setMessage(error?.message || 'Unable to save LinkedIn import.');
    }
  };

  const isBusy = ['authorizing', 'loading', 'saving'].includes(status);
  const showPreview = ['preview', 'partial', 'saving'].includes(status) && preview;

  return (
    <>
      <div className="linkedin-import">
        <div>
          <h3>Import from LinkedIn</h3>
          {message && !modalOpen && (
            <p className={`linkedin-import__message linkedin-import__message--${status}`}>{message}</p>
          )}
        </div>
        <button className="linkedin-import__button" type="button" onClick={openModal} disabled={!resume._id}>
          <HiOutlineCloudArrowDown />
          <span>Import</span>
        </button>
      </div>

      {modalOpen && (
        <div className="linkedin-modal" role="dialog" aria-modal="true" aria-labelledby="linkedin-modal-title">
          <div className="linkedin-modal__panel">
            <div className="linkedin-modal__header">
              <div>
                <h2 id="linkedin-modal-title">Import from LinkedIn</h2>
                <p>Connect your profile and review available data before it changes this resume.</p>
              </div>
              <button className="linkedin-modal__close" type="button" onClick={() => setModalOpen(false)} aria-label="Close LinkedIn import">
                <HiXMark />
              </button>
            </div>

            {!configured && (
              <div className="linkedin-import__notice">
                <HiExclamationTriangle />
                <span>LinkedIn integration is not configured.</span>
              </div>
            )}

            {message && <p className={`linkedin-import__message linkedin-import__message--${status}`}>{message}</p>}

            {!showPreview && (
              <div className="linkedin-modal__form">
                <label>
                  LinkedIn Profile URL
                  <input
                    value={profileUrl}
                    onChange={(event) => setProfileUrl(event.target.value)}
                    placeholder="https://www.linkedin.com/in/username"
                    disabled={!configured || isBusy}
                  />
                </label>
                {urlError && <p className="linkedin-modal__error">{urlError}</p>}
                <button className="linkedin-modal__primary" type="button" onClick={handleStartImport} disabled={!configured || !resume._id || isBusy}>
                  {status === 'authorizing' ? <HiOutlineArrowPath /> : <HiOutlineCloudArrowDown />}
                  <span>{status === 'authorizing' ? 'Connecting...' : 'Connect & Import'}</span>
                </button>
              </div>
            )}

            {showPreview && (
              <div className="linkedin-preview">
                <div className="linkedin-preview__section">
                  <h3>Imported from LinkedIn</h3>
                  {availableFields.length ? availableFields.map((field) => (
                    <label key={field.key} className="linkedin-preview__field">
                      <input type="checkbox" checked={selectedKeys.includes(field.key)} onChange={() => toggleField(field.key)} disabled={status === 'saving'} />
                      <HiCheck />
                      <span>{field.label}</span>
                    </label>
                  )) : <p className="linkedin-preview__empty">No importable fields were returned.</p>}
                </div>

                {unavailableFields.length > 0 && (
                  <div className="linkedin-preview__section">
                    <h3>Unavailable fields</h3>
                    {unavailableFields.map((field) => (
                      <div key={field.key} className="linkedin-preview__unavailable">
                        <span>{field.label}</span>
                        <small>{field.reason}</small>
                      </div>
                    ))}
                  </div>
                )}

                <div className="linkedin-modal__actions">
                  <button className="linkedin-modal__secondary" type="button" onClick={() => setModalOpen(false)} disabled={status === 'saving'}>Cancel</button>
                  <button className="linkedin-modal__primary" type="button" onClick={handleConfirm} disabled={status === 'saving' || selectedKeys.length === 0}>
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

export default LinkedInImport;
