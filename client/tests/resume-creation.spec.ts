import { expect, test } from '@playwright/test';

const resume = { _id: '507f1f77bcf86cd799439011', title: 'Existing Resume', targetRole: 'Developer', templateId: 'modern-professional', sections: {}, updatedAt: new Date().toISOString() };

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('token', 'e2e-token'));
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { success: true, data: { _id: '507f1f77bcf86cd799439012', name: 'Test User' } } }));
  await page.route('**/api/resumes', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { success: true, data: [resume] } });
    return route.fulfill({ status: 201, json: { success: true, data: { ...resume, ...route.request().postDataJSON() } } });
  });
});

test('blocks empty and whitespace-only resume creation without posting', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/resumes', async (route) => {
    if (route.request().method() === 'POST') posts += 1;
    return route.fulfill({ json: { success: true, data: [resume] } });
  });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create New Resume' }).click();
  await page.getByRole('button', { name: 'Create Resume' }).click();
  await expect(page.getByText('Resume title is required.')).toBeVisible();
  await expect(page.getByText('Target role is required.')).toBeVisible();
  await page.locator('#resume-title').fill('   ');
  await page.locator('#target-role').fill('   ');
  await page.getByRole('button', { name: 'Create Resume' }).click();
  expect(posts).toBe(0);
});

test('requires each field individually and posts trimmed valid data once', async ({ page }) => {
  let payload: Record<string, string> | undefined;
  await page.route('**/api/resumes', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { success: true, data: [resume] } });
    payload = route.request().postDataJSON();
    return route.fulfill({ status: 201, json: { success: true, data: { ...resume, ...payload } } });
  });
  await page.goto('/home');
  await page.getByRole('button', { name: 'Create New Resume' }).click();
  await page.locator('#target-role').fill('Developer');
  await page.getByRole('button', { name: 'Create Resume' }).click();
  await expect(page.getByText('Resume title is required.')).toBeVisible();
  await page.locator('#resume-title').fill('  Portfolio Resume  ');
  await page.getByRole('button', { name: 'Create Resume' }).click();
  await expect.poll(() => payload).toBeTruthy();
  expect(payload).toMatchObject({ title: 'Portfolio Resume', targetRole: 'Developer' });
});
