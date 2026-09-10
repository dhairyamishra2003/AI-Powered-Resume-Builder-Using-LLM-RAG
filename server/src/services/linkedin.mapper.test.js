import assert from 'node:assert/strict';
import test from 'node:test';
import {
  describeImportAvailability,
  mapLinkedInProfileToResumeSections,
  mergeLinkedInSections,
  normalizeLinkedInProfile,
} from './linkedin.mapper.js';

test('normalizes LinkedIn OpenID Connect profile fields', () => {
  const profile = normalizeLinkedInProfile({
    sub: 'abc123',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    picture: 'https://example.com/ada.jpg',
  });

  assert.equal(profile.linkedinId, 'abc123');
  assert.equal(profile.fullName, 'Ada Lovelace');
  assert.equal(profile.email, 'ada@example.com');
  assert.equal(profile.picture, 'https://example.com/ada.jpg');
});

test('maps only available LinkedIn fields into resume sections', () => {
  const sections = mapLinkedInProfileToResumeSections(
    {
      fullName: 'Grace Hopper',
      email: '',
      profileUrl: '',
    },
    { profileUrl: 'https://www.linkedin.com/in/grace-hopper' }
  );

  assert.deepEqual(sections, {
    personalInfo: {
      fullName: 'Grace Hopper',
      linkedIn: 'https://www.linkedin.com/in/grace-hopper',
    },
  });
});

test('merges imported fields without replacing unrelated resume data', () => {
  const merged = mergeLinkedInSections(
    {
      personalInfo: {
        fullName: 'Old Name',
        phone: '555-0100',
      },
      summary: 'Existing summary',
    },
    {
      personalInfo: {
        fullName: 'New Name',
        email: 'new@example.com',
      },
    }
  );

  assert.deepEqual(merged.personalInfo, {
    fullName: 'New Name',
    phone: '555-0100',
    email: 'new@example.com',
  });
  assert.equal(merged.summary, 'Existing summary');
});

test('reports unavailable fields when LinkedIn API does not return them', () => {
  const availability = describeImportAvailability({
    personalInfo: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    },
  });

  const phone = availability.find((field) => field.key === 'phone');
  const experience = availability.find((field) => field.key === 'experience');

  assert.equal(phone.available, false);
  assert.match(phone.reason, /Not available from LinkedIn API/);
  assert.equal(experience.available, false);
});

test('maps experience and education only when official profile data includes them', () => {
  const sections = mapLinkedInProfileToResumeSections({
    experience: [{ company: 'ABC', role: 'Software Engineer', bullets: ['Built APIs'] }],
    education: [{ institution: 'State University', degree: 'BS' }],
  });

  assert.deepEqual(sections.experience, [{ company: 'ABC', role: 'Software Engineer', bullets: ['Built APIs'] }]);
  assert.deepEqual(sections.education, [{ institution: 'State University', degree: 'BS' }]);
});
