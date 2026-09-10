const pickFirstString = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';

export const ACADEMIC_IMPORT_FIELDS = [
  { key: 'institution', label: 'Institution', field: 'institution' },
  { key: 'degree', label: 'Degree', field: 'degree' },
  { key: 'field', label: 'Field / Program', field: 'field' },
  { key: 'startDate', label: 'Start Date', field: 'startDate' },
  { key: 'endDate', label: 'Graduation Date', field: 'endDate' },
  { key: 'gpa', label: 'GPA / Marks', field: 'gpa' },
];

const normalizeAcademicItem = (item = {}) => {
  const institution = pickFirstString(
    item.institution,
    item.institutionName,
    item.university,
    item.universityName,
    item.board,
    item.boardName,
    item.issuer,
    item.issuerName,
    item.orgName
  );
  const degree = pickFirstString(item.degree, item.qualification, item.course, item.certificateName, item.documentName, item.docName);
  const field = pickFirstString(item.field, item.program, item.programName, item.fieldOfStudy, item.specialization, item.branch, item.stream);
  const startDate = pickFirstString(item.startDate, item.admissionDate, item.fromDate, item.courseStartDate);
  const endDate = pickFirstString(item.endDate, item.graduationDate, item.passingDate, item.issueDate, item.yearOfPassing, item.toDate);
  const gpa = pickFirstString(item.gpa, item.cgpa, item.grade, item.marks, item.percentage, item.result);

  return {
    institution,
    degree,
    field,
    startDate,
    endDate,
    gpa,
    source: pickFirstString(item.source, item.docType, item.documentType),
    documentId: pickFirstString(item.documentId, item.uri, item.id),
  };
};

export const normalizeDigiLockerAcademicData = (payload = {}) => {
  const candidates = [
    payload.academicRecords,
    payload.academicDocuments,
    payload.education,
    payload.documents,
    payload.items,
    Array.isArray(payload) ? payload : null,
  ].find(Array.isArray) || [];

  return candidates
    .map(normalizeAcademicItem)
    .filter((item) => item.institution || item.degree || item.field || item.startDate || item.endDate || item.gpa);
};

export const mapAcademicRecordsToEducation = (records = []) => records.map((record) => ({
  institution: record.institution || '',
  degree: record.degree || '',
  field: record.field || '',
  startDate: record.startDate || '',
  endDate: record.endDate || '',
  gpa: record.gpa || '',
}));

export const mergeEducationRecords = (currentEducation = [], importedEducation = []) => {
  const existing = Array.isArray(currentEducation) ? currentEducation : [];
  const imported = Array.isArray(importedEducation) ? importedEducation : [];
  const seen = new Set(existing.map((item) => [
    item.institution || '',
    item.degree || '',
    item.field || '',
    item.endDate || '',
  ].join('|').toLowerCase()));

  const additions = imported.filter((item) => {
    const key = [
      item.institution || '',
      item.degree || '',
      item.field || '',
      item.endDate || '',
    ].join('|').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return [...existing, ...additions];
};

export const describeAcademicAvailability = (education = []) => ACADEMIC_IMPORT_FIELDS.map((field) => {
  const values = education
    .map((item) => item[field.field])
    .filter((value) => typeof value === 'string' && value.trim());

  return {
    ...field,
    available: values.length > 0,
    value: values.length ? values : null,
    reason: values.length ? '' : 'Not provided by the authorized DigiLocker/APAAR response. You can enter it manually.',
  };
});
