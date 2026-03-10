import { test, expect } from '@playwright/test';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function deleteTestUser() {
  const client = new MongoClient(process.env.MONGO_URL as string);
  try {
    await client.connect();
    const db = client.db();
    await db.collection('users').deleteOne({ email: 'user1@example.com' });
  } finally {
    await client.close();
  }
}

test.beforeAll(deleteTestUser);
test.afterAll(deleteTestUser);

// All tests must be run in order
test('register and login user', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.waitForURL('**/register');
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('user1');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user1@example.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Password123');
  await page.getByRole('textbox', { name: 'Enter Your Phone' }).fill('81234567');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('123 Test St');
  await page.getByPlaceholder('Enter Your DOB').fill('2001-01-01');
  await page.getByRole('textbox', { name: 'What is Your Favorite sports' }).fill('basketball');
  await page.getByRole('button', { name: 'REGISTER' }).click();
  
  await page.waitForURL('**/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user1@example.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Password123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByRole('button', { name: 'user1' })).toBeVisible();
  await page.getByRole('button', { name: 'user1' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  await page.waitForURL('**/dashboard/user');
  await expect(page.getByRole('heading', { name: 'user1', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'user1@example.com' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '123 Test St' })).toBeVisible();

  await page.getByRole('button', { name: 'user1' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('login and update username, address and password', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.waitForURL('**/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user1@example.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('Password123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByRole('button', { name: 'user1' })).toBeVisible();
  await page.getByRole('button', { name: 'user1' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  await page.waitForURL('**/dashboard/user');
  await page.getByRole('link', { name: 'Profile' }).click();

  await page.waitForURL('**/dashboard/user/profile');
  await page.getByRole('textbox', { name: 'Enter Your Name' }).fill('user2');
  await page.getByRole('textbox', { name: 'Enter Your Address' }).fill('456 Main St');
  await page.getByRole('textbox', { name: 'Enter Your New Password' }).fill('NewPassword123');
  await page.getByRole('button', { name: 'UPDATE' }).click();

  await expect(page.getByRole('button', { name: 'user2' })).toBeVisible();
  await page.getByRole('button', { name: 'user2' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();

  await page.waitForURL('**/dashboard/user');
  await expect(page.getByRole('heading', { name: 'user2', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'user1@example.com' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '456 Main St' })).toBeVisible();

  await page.getByRole('button', { name: 'user2' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});

test('login with new password', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.waitForURL('**/login');
  await page.getByRole('textbox', { name: 'Enter Your Email' }).fill('user1@example.com');
  await page.getByRole('textbox', { name: 'Enter Your Password' }).fill('NewPassword123');
  await page.getByRole('button', { name: 'LOGIN' }).click();

  await expect(page.getByRole('button', { name: 'user2' })).toBeVisible();

  await page.getByRole('button', { name: 'user2' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();
});