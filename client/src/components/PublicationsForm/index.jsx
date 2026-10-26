// ============================================
// PublicationsForm.jsx - Research Papers & Publications Editor
// ============================================
// Dynamic list of research paper / publication entries with
// title, publisher/venue, authors, date, link, and description fields.
// ============================================

import { useContext } from 'react';
import { ResumeContext } from '../../context/ResumeContext.jsx';
import DatePicker from '../DatePicker';
import { HiPlus, HiTrash } from 'react-icons/hi2';

function PublicationsForm() {
  const { resume, updateSection } = useContext(ResumeContext);
  const publications = resume.sections.publications || [];

  const addEntry = () => {
    const newEntry = {
      _id: Date.now().toString(),
      title: '',
      publisher: '',
      authors: '',
      date: '',
      link: '',
      description: '',
    };
    updateSection('publications', [...publications, newEntry]);
  };

  const updateEntry = (index, field, value) => {
    const updated = publications.map((pub, i) =>
      i === index ? { ...pub, [field]: value } : pub,
    );
    updateSection('publications', updated);
  };

  const deleteEntry = (index) => {
    const updated = publications.filter((_, i) => i !== index);
    updateSection('publications', updated);
  };

  return (
    <div>
      <button
        onClick={addEntry}
        className="btn btn-outline btn-sm btn-full mb-md"
      >
        <HiPlus />
        Add Research Paper / Publication
      </button>

      {publications.map((pub, index) => (
        <div
          key={pub._id || index}
          className="card card-sm card-purple-top mb-md"
        >
          <div className="flex-between mb-sm">
            <span className="label-text" style={{ marginBottom: 0 }}>
              Publication {index + 1}
            </span>
            <button
              onClick={() => deleteEntry(index)}
              className="btn-icon-sm text-danger cursor-pointer"
            >
              <HiTrash />
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="label-text">Paper / Publication Title</label>
              <input
                type="text"
                value={pub.title || ''}
                onChange={(e) => updateEntry(index, 'title', e.target.value)}
                className="input-field"
                placeholder="e.g. Scalable Distributed Architectures for Streaming"
              />
            </div>
            <div className="form-group">
              <label className="label-text">Journal / Conference / Publisher</label>
              <input
                type="text"
                value={pub.publisher || ''}
                onChange={(e) => updateEntry(index, 'publisher', e.target.value)}
                className="input-field"
                placeholder="e.g. IEEE / ACM / Nature / arXiv"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="label-text">Authors</label>
              <input
                type="text"
                value={pub.authors || ''}
                onChange={(e) => updateEntry(index, 'authors', e.target.value)}
                className="input-field"
                placeholder="e.g. Alex Johnson, Jane Doe"
              />
            </div>
            <div className="form-group">
              <label className="label-text">Publication Date / Year</label>
              <DatePicker
                value={pub.date || ''}
                onChange={(val) => updateEntry(index, 'date', val)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-text">URL / DOI Link</label>
            <input
              type="url"
              value={pub.link || ''}
              onChange={(e) => updateEntry(index, 'link', e.target.value)}
              className="input-field"
              placeholder="https://doi.org/..."
            />
          </div>

          <div className="form-group">
            <label className="label-text">Abstract / Description</label>
            <textarea
              value={pub.description || ''}
              onChange={(e) => updateEntry(index, 'description', e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Brief summary or findings of the paper..."
            />
          </div>
        </div>
      ))}

      {publications.length === 0 && (
        <p className="text-muted text-center py-lg">
          No research papers or publications yet. Click above to add one.
        </p>
      )}
    </div>
  );
}

export default PublicationsForm;
