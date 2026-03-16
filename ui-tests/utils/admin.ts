import type { Page } from "@playwright/test";

export async function logInAsAdmin(page: Page) {
  await page.goto("http://localhost:3000/login");
  await page
    .getByRole("textbox", { name: "Enter Your Email" })
    .fill("test@admin.com");
  await page.getByRole("textbox", { name: "Enter Your Password" }).click();
  await page
    .getByRole("textbox", { name: "Enter Your Password" })
    .fill("test@admin.com");
  await page.getByRole("button", { name: "LOGIN" }).click();
}

export async function openAdminDashboard(page: Page) {
  await page.getByRole("button", { name: "Test" }).click();
  await page.getByRole("link", { name: "Dashboard" }).click();
}

export async function logOutAsAdmin(page: Page) {
  await page.getByRole("button", { name: "Test" }).click();
  await page.getByRole("link", { name: "Logout" }).click();
}
