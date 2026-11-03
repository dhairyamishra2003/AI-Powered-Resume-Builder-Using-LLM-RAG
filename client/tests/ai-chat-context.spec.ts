import { expect, test } from '@playwright/test';

const resumeId = '507f1f77bcf86cd799439011';
const uploadedResume = {
  _id: resumeId, title: 'Uploaded Resume', targetRole: 'Software Engineer', templateId: 'modern-professional', jobDescription: '',
  sections: { personalInfo: { fullName: 'Test Candidate' }, experience: [{ company: 'Acme Labs', role: 'Developer', bullets: ['Built deployment tooling'] }], projects: [{ name: 'Resume Parser', bullets: ['Parsed PDF resumes'] }], skills: { technical: ['JavaScript'], soft: [], languages: [], tools: [], frameworks: [], databases: [], libraries: [] }, education: [{ institution: 'Example University', degree: 'BSc' }] },
};

test('sends the active uploaded resume ID and renders a context-grounded AI answer', async ({ page }) => {
  let chatPayload: Record<string, string> | undefined;
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { success: true, data: { _id: '507f1f77bcf86cd799439012', name: 'Test User' } } }));
  await page.route(`**/api/resumes/${resumeId}`, (route) => route.fulfill({ json: { success: true, data: uploadedResume } }));
  await page.route(`**/api/ai/chat-history/${resumeId}`, (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.route('**/api/ai/chat', async (route) => {
    chatPayload = route.request().postDataJSON();
    return route.fulfill({ json: { success: true, data: { message: 'Your Acme Labs Developer experience includes deployment tooling. No metrics were provided.' } } });
  });
  await page.goto(`/builder/${resumeId}`);
  await page.getByRole('button', { name: /AI Chat/i }).click();
  await page.locator('.chat-textarea').fill('Write bullets from my work experience');
  await page.locator('.chat-input-area button').click();
  await expect.poll(() => chatPayload?.resumeId).toBe(resumeId);
  await expect(page.getByText(/Acme Labs Developer experience/)).toBeVisible();
  await expect(page.getByText(/No metrics were provided/)).toBeVisible();
});
