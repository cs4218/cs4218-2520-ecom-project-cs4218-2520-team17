import { expect, test } from "@playwright/test";
import { logInAsUser, logInAsUserWithPassword, logOutAsUser, openDashboard } from "./utils/user";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
    await logInAsUser(page);
    await openDashboard(page);
    await page.getByRole("link", { name: "Profile" }).click();
});

test.afterEach(async ({ page }) => {
    const userMenuButton = page.getByRole("button", {
      name: "CS 4218 Test Account",
    });

    if (await userMenuButton.isVisible()) {
      await logOutAsUser(page);
    }
});

test.describe("User profile page", () => {
  // Sebastian Tay, A0252864X
  test("shows pre-filled profile details", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "USER PROFILE" })).toBeVisible();

    const nameInput = page.getByRole("textbox", { name: "Enter Your Name" });
    const emailInput = page.getByRole("textbox", { name: "Enter Your Email" });
    const passwordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    const phoneInput = page.getByRole("textbox", {
      name: "Enter Your Phone Number",
    });
    const addressInput = page.getByRole("textbox", { name: "Enter Your Address" });

    await expect(nameInput).toHaveValue("CS 4218 Test Account");
    await expect(emailInput).toHaveValue("cs4218@test.com");
    await expect(passwordInput).toHaveValue("");
    await expect(phoneInput).toHaveValue("81234567");
    await expect(addressInput).toHaveValue("1 Computing Drive");
  });

  // Sebastian Tay, A0252864X
  test("enables form editing except for email", async({ page }) => {
    const nameInput = page.getByRole("textbox", { name: "Enter Your Name" });
    const emailInput = page.getByRole("textbox", { name: "Enter Your Email" });
    const passwordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    const phoneInput = page.getByRole("textbox", {
      name: "Enter Your Phone Number",
    });
    const addressInput = page.getByRole("textbox", { name: "Enter Your Address" });

    await expect(emailInput).toBeDisabled();
    await expect(nameInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(phoneInput).toBeEnabled();
    await expect(addressInput).toBeEnabled();
  });

  // Sebastian Tay, A0252864X
  test("toggles password visibility", async ({ page }) => {
    const passwordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    const toggleButton = page.getByRole("button", { name: "Show password" });

    await expect(passwordInput).toHaveAttribute("type", "password");
    await passwordInput.fill("TempPassword123");

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Hide password" })).toBeVisible();

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveValue("TempPassword123");
  });
});

test.describe("Updating user profile", () => {
  // Sebastian Tay, A0252864X
  test("updates profile fields", async ({ page }) => {
    const phoneInput = page.getByRole("textbox", {
      name: "Enter Your Phone Number",
    });
    const addressInput = page.getByRole("textbox", { name: "Enter Your Address" });
    const updateButton = page.getByRole("button", { name: "UPDATE" });

    const updatedPhone = "90000000";
    const updatedAddress = "17 Computing Walk";

    await phoneInput.fill(updatedPhone);
    await addressInput.fill(updatedAddress);
    await updateButton.click();
    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    await page.reload();
    await expect(phoneInput).toHaveValue(updatedPhone);
    await expect(addressInput).toHaveValue(updatedAddress);

    const originalPhone = "81234567";
    const originalAddress = "1 Computing Drive";
    // Reset profile details back to original for test isolation.
    await phoneInput.fill(originalPhone);
    await addressInput.fill(originalAddress);
    await updateButton.click();
  });

  // Sebastian Tay, A0252864X
  test("updating new password will clear the password field", async ({ page }) => {
    const passwordInput = page.getByRole("textbox", {
      name: "Enter Your New Password",
    });
    const updateButton = page.getByRole("button", { name: "UPDATE" });

    await passwordInput.fill("NewPassword123");
    await updateButton.click();
    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

    await expect(passwordInput).toHaveValue("");

    // Reset password back to original for test isolation.  
    const oldPassword = "cs4218@test.com";
    await passwordInput.fill(oldPassword);
    await updateButton.click();
  });

  // Sebastian Tay, A0252864X
  test("updating to new password will update the password in backend", async ({ page }) => {
        const passwordInput = page.getByRole("textbox", {
          name: "Enter Your New Password",
        });
        const updateButton = page.getByRole("button", { name: "UPDATE" });

        const oldPassword = "cs4218@test.com";
        const newPassword = "NewPassword123";

        await passwordInput.fill(newPassword);
        await updateButton.click();
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();

        await logOutAsUser(page);

        // Old password should fail after update.
        await logInAsUserWithPassword(page, oldPassword);
        await expect(page).toHaveURL(/\/login$/);

        // New password should succeed.
        await logInAsUserWithPassword(page, newPassword);
        await expect(page.getByRole("button", { name: "CS 4218 Test Account" })).toBeVisible();

        // Reset password so subsequent tests/hooks can log in with the default test credential.
        await openDashboard(page);
        await page.getByRole("link", { name: "Profile" }).click();
        await passwordInput.fill(oldPassword);
        await updateButton.click();
        await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
  });

  // Sebastian Tay, A0252864X
  test("will not update password when field is cleared after receiving unintended input", async ({ page }) => {
    const passwordInput = page.getByRole("textbox", { name: "Enter Your New Password" });
    await passwordInput.click();
    await passwordInput.fill("passwordToRemove");
    await passwordInput.click();
    await passwordInput.fill("");

    
    await page.getByRole("button", { name: "UPDATE" }).click();
    await expect(page.getByText("Profile Updated Successfully")).toBeVisible();
    await logOutAsUser(page);

    await logInAsUser(page);
    await openDashboard(page);
    await page.getByRole("link", { name: "Profile" }).click();
    await expect(page.getByRole("button", { name: "CS 4218 Test Account" })).toBeVisible();
  });
});
