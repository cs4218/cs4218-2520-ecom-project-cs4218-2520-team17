import type { Page } from "@playwright/test";

export async function logInAsUser(page: Page) {
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("cs4218@test.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("cs4218@test.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
}

export async function logInAsUserWithPassword(page: Page, password: string) {
  await page.goto("/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("cs4218@test.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();
}

export async function openDashboard(page: Page) {
  await page.getByRole("button", { name: "CS 4218 Test Account" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
}

export async function logOutAsUser(page: Page) {
  await page.getByRole("button", { name: "CS 4218 Test Account" }).click();
  await page.getByRole("link", { name: "Logout" }).click();
}
