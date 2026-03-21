import { expect, test } from "@playwright/test";

test.describe("Spinner route guard behavior", () => {
    // Sebastian Tay, A0252864X
    test("navigates to user-defined path after countdown reaches 0", async ({ page }) => {
        await page.goto("/dashboard/user");

        await expect(page.getByRole("status")).toBeVisible();
        await expect(page.getByText(/redirecting to you in 3 second/i)).toBeVisible();
        await expect(page).toHaveURL(/\/$/, { timeout: 7000 });
    });
});
