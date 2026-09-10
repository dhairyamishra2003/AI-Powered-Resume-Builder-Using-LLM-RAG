import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeAcademicAvailability,
  mapAcademicRecordsToEducation,
  mergeEducationRecords,
  normalizeDigiLockerAcademicData,
} from './digilocker.mapper.js';

test('normalizes academic records from official response-shaped payloads', () => {
  const records = normalizeDigiLockerAcademicData({
    academicRecords: [{
      institutionName: 'State University',
      qualification: 'Bachelor of Technology',
      programName: 'Computer Science',
      admissionDate: '2020',
      graduationDate: '2024',
      cgpa: '8.7/10',
      uri: 'in.gov.example.degree/123',
    }],
  });

  assert.deepEqual(records[0], {
    institution: 'State University',
    degree: 'Bachelor of Technology',
    field: 'Computer Science',
    startDate: '2020',
    endDate: '2024',
    gpa: '8.7/10',
    source: '',
    documentId: 'in.gov.example.degree/123',
  });
});

test('maps only actually provided academic data into education fields', () => {
  const education = mapAcademicRecordsToEducation([{
    institution: 'Open College',
    degree: '',
    field: 'Data Science',
    endDate: '2025',
  }]);

  assert.deepEqual(education, [{
    institution: 'Open College',
    degree: '',
    field: 'Data Science',
    startDate: '',
    endDate: '2025',
    gpa: '',
  }]);
});

test('reports missing fields as unavailable instead of inventing values', () => {
  const availability = describeAcademicAvailability([{
    institution: 'State University',
    degree: 'B.Tech',
    field: '',
    startDate: '',
    endDate: '',
    gpa: '',
  }]);

  assert.equal(availability.find((field) => field.key === 'institution').available, true);
  assert.equal(availability.find((field) => field.key === 'gpa').available, false);
  assert.match(availability.find((field) => field.key === 'gpa').reason, /Not provided/);
});

test('preserves existing education records and prevents duplicate imports', () => {
  const current = [{
    institution: 'State University',
    degree: 'B.Tech',
    field: 'Computer Science',
    startDate: '2020',
    endDate: '2024',
    gpa: '8.7/10',
  }];
  const imported = [
    { ...current[0] },
    {
      institution: 'National Board',
      degree: 'Class XII',
      field: 'Science',
      startDate: '',
      endDate: '2020',
      gpa: '92%',
    },
  ];

  const merged = mergeEducationRecords(current, imported);

  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0], current[0]);
  assert.equal(merged[1].institution, 'National Board');
});
