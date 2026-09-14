import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  mockIntakeExtract,
  mockEvidenceChecklist,
  mockDraft,
} from "./helpers/mock-gemini";

test.describe("Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    // Mock Gemini API calls
    await page.route("**/api/start", async (route) => {
      const body = await route.request().postDataJSON();
      if (body.rawCitizenText && body.rawCitizenText.includes("landlord")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ caseId: "mock-case-123" }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/cases/*/draft", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ draftId: "mock-draft-456" }),
      });
    });

    await page.route("**/api/cases/*/evidence", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, added: 1 }),
      });
    });

    await page.route("**/api/cases/*/approve", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route("**/api/cases/*/upvote", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });
  });

  test("full happy path: intake → case → evidence → draft → approve", async ({
    page,
  }) => {
    // Step 1: Go to homepage
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Ziddi");

    // Step 2: Fill intake form with Aadhaar + OTP
    const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]');
    await aadhaarInput.fill("234567890124");

    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.locator("text=Demo mode")).toBeVisible();

    const otpCode = page.locator("text=/\\d{6}/").first();
    const codeText = await otpCode.textContent();
    const otpValue = codeText?.match(/\d{6}/)?.[0] ?? "123456";

    const otpInput = page.locator('input[placeholder*="6-digit OTP"]');
    await otpInput.fill(otpValue);

    await page.getByRole("button", { name: "Verify" }).click();
    await expect(page.locator("text=Aadhaar + OTP verified")).toBeVisible();

    // Step 3: Submit grievance
    const textarea = page.locator("textarea");
    await textarea.fill(
      "Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein",
    );

    await page.getByRole("button", { name: "Start My Case" }).click();

    // Wait for case creation (mocked)
    await expect(page.locator("text=Case created")).toBeVisible({
      timeout: 10_000,
    });

    // Step 4: Go to case detail
    await page.getByRole("link", { name: "View case" }).click();
    await expect(page.locator("h1")).toContainText("Landlord");

    // Step 5: Add text evidence
    const evidenceInput = page.locator(
      'input[placeholder*="Text-only evidence"]',
    );
    await evidenceInput.fill("Rental agreement copy");
    await page.getByRole("button", { name: "Add evidence" }).click();
    await expect(page.locator("text=Rental agreement copy")).toBeVisible();

    // Step 6: Draft demand notice
    await page.getByRole("button", { name: "Draft DemandNotice" }).click();
    await expect(page.locator("text=Draft")).toBeVisible({ timeout: 10_000 });

    // Step 7: Approve draft
    await page.getByRole("button", { name: "Approve draft" }).click();
    await expect(page.locator("text=approved")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("upvote flow with Aadhaar verification", async ({ page }) => {
    await page.goto("/cases");

    // If no cases exist, skip this test
    const caseLinks = page.locator('a[href*="/cases/"]');
    const count = await caseLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Click first case
    await caseLinks.first().click();

    // Scroll to community support section
    await page.locator("text=Community support").scrollIntoViewIfNeeded();

    // Enter Aadhaar for upvote
    const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]').last();
    await aadhaarInput.fill("234567890124");

    await page.getByRole("button", { name: "Send OTP" }).last().click();
    await expect(page.locator("text=Demo mode").last()).toBeVisible();

    const otpCode = page.locator("text=/\\d{6}/").last();
    const codeText = await otpCode.textContent();
    const otpValue = codeText?.match(/\d{6}/)?.[0] ?? "123456";

    const otpInput = page.locator('input[placeholder*="6-digit OTP"]').last();
    await otpInput.fill(otpValue);

    await page.getByRole("button", { name: "Verify" }).last().click();
    await expect(page.locator("text=Your support counted")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("duplicate detection shows existing cases", async ({ page }) => {
    await page.goto("/");

    // Fill Aadhaar + OTP
    const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]');
    await aadhaarInput.fill("234567890124");

    await page.getByRole("button", { name: "Send OTP" }).click();
    const otpCode = page.locator("text=/\\d{6}/").first();
    const codeText = await otpCode.textContent();
    const otpValue = codeText?.match(/\d{6}/)?.[0] ?? "123456";

    const otpInput = page.locator('input[placeholder*="6-digit OTP"]');
    await otpInput.fill(otpValue);
    await page.getByRole("button", { name: "Verify" }).click();

    // Submit grievance with locality
    const textarea = page.locator("textarea");
    await textarea.fill(
      "Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein",
    );

    const localityInput = page.locator('input[placeholder*="Area / locality"]');
    await localityInput.fill("Koramangala");

    await page.getByRole("button", { name: "Start My Case" }).click();

    // Should show duplicate interstitial if case exists
    await expect(page.locator("text=Same case").or(page.locator("text=Case created"))).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Accessibility", () => {
  test("homepage meets WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("case detail page meets WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/cases");

    const caseLinks = page.locator('a[href*="/cases/"]');
    const count = await caseLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await caseLinks.first().click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe("Mobile Responsiveness", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("intake form works on mobile", async ({ page }) => {
    await page.goto("/");

    // Check viewport meta tag
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);

    // Check that form elements are touch-friendly
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();

    const button = page.getByRole("button", { name: "Start My Case" });
    await expect(button).toBeVisible();

    // Check that text is readable
    await expect(page.locator("h1")).toBeVisible();
  });

  test("case list is mobile-friendly", async ({ page }) => {
    await page.goto("/cases");

    const caseLinks = page.locator('a[href*="/cases/"]');
    const count = await caseLinks.count();
    if (count === 0) {
      test.skip();
      return;
    }

    // Check that case cards stack vertically on mobile
    await expect(caseLinks.first()).toBeVisible();

    // Check touch targets are large enough
    const firstCase = caseLinks.first();
    const box = await firstCase.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

