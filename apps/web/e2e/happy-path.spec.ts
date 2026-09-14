import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { aadhaarCheckDigit } from "@ziddi/domain";
import { mockDraft, mockIntakeExtract } from "./helpers/mock-gemini";

const freshAadhaar = (): string => {
  const prefix = `2${String(Date.now()).slice(-10)}`;
  const check = aadhaarCheckDigit(prefix);
  return `${prefix}${check ?? "0"}`;
};

const completeOtp = async (page: Page, aadhaar: string) => {
  await page.locator('input[placeholder*="12-digit Aadhaar"]').fill(aadhaar);
  await page.getByRole("button", { name: "Send OTP" }).click();
  const banner = page.getByText(/Demo mode: your OTP is/);
  await expect(banner).toBeVisible();
  const bannerText = await banner.textContent();
  const otp = bannerText?.match(/\d{6}/)?.[0] ?? "";
  expect(otp).toHaveLength(6);
  await page.locator('input[placeholder*="6-digit OTP"]').fill(otp);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText(/Aadhaar \+ OTP verified/)).toBeVisible();
};

const openFirstCase = async (page: Page): Promise<boolean> => {
  await page.goto("/cases");
  const caseLinks = page.locator('a[href*="/cases/"]');
  await caseLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  if ((await caseLinks.count()) === 0) return false;
  await caseLinks.first().click();
  return true;
};

test.describe("Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/generativelanguage.googleapis.com/**", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.continue();
        return;
      }
      const raw = request.postData() ?? "";
      const text = raw.includes("Draft a")
        ? JSON.stringify(mockDraft)
        : JSON.stringify(mockIntakeExtract);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          candidates: [
            {
              content: { role: "model", parts: [{ text }] },
              finishReason: "STOP",
              index: 0,
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 10,
            totalTokenCount: 20,
          },
        }),
      });
    });
  });

  test("full happy path: intake → case → evidence → draft → approve", async ({
    page,
  }) => {
    const aadhaar = freshAadhaar();
    const locality = `E2E-${Date.now()}`;

    await page.goto("/");
    await expect(page.locator("h1")).toContainText(/ziddi/i);

    await completeOtp(page, aadhaar);

    await page
      .locator("textarea")
      .fill("Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein, agreement hai");
    await page.locator('input[placeholder*="Area / locality"]').fill(locality);
    await page.getByRole("button", { name: /Start My Case/ }).click();

    await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: /View case/ }).click();

    await expect(page.locator("h1")).toContainText("Landlord");

    await page
      .locator('input[placeholder*="Text-only evidence"]')
      .fill("Rental agreement copy");
    await page.getByRole("button", { name: /Add evidence/ }).click();
    await expect(page.getByText("Rental agreement copy").first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Draft DemandNotice/ }).click();
    await expect(page.getByText(/Draft: DemandNotice/)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Approve draft/ }).click();
    await expect(page.getByText("Citizen approved the draft")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("upvote flow with Aadhaar verification", async ({ page }) => {
    if (!(await openFirstCase(page))) {
      test.skip();
      return;
    }

    const aadhaar = freshAadhaar();
    await page.locator('input[placeholder*="12-digit Aadhaar"]').fill(aadhaar);
    await page.getByRole("button", { name: "Send OTP" }).click();
    const banner = page.getByText(/Demo mode: your OTP is/);
    await expect(banner).toBeVisible();
    const bannerText = await banner.textContent();
    const otp = bannerText?.match(/\d{6}/)?.[0] ?? "";
    await page.locator('input[placeholder*="6-digit OTP"]').fill(otp);
    await page.getByRole("button", { name: "Verify" }).click();

    await expect(page.getByText(/Your support counted/)).toBeVisible({ timeout: 10_000 });
  });

  test("duplicate detection offers upvote or file-new-anyway", async ({ page }) => {
    const aadhaar = freshAadhaar();
    const locality = `DUP-${Date.now()}`;
    const grievance =
      "Mera landlord ne 50000 deposit wapas nahi diya Bengaluru mein, 1 saal ho gaya, agreement hai mere paas";

    await page.goto("/");
    await completeOtp(page, aadhaar);
    await page.locator("textarea").fill(grievance);
    await page.locator('input[placeholder*="Area / locality"]').fill(locality);

    const startButton = page.getByRole("button", { name: /Start My Case/ });
    const isStartPost = (r: import("@playwright/test").Response) =>
      r.url().includes("/api/start") && r.request().method() === "POST";

    const [firstResponse] = await Promise.all([
      page.waitForResponse(isStartPost),
      startButton.click(),
    ]);
    expect(firstResponse.status()).toBe(200);
    await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 10_000 });

    // Navigate to case detail to verify case exists
    const caseLink = page.getByRole("link", { name: /View case/ });
    await caseLink.waitFor({ state: "visible", timeout: 5_000 });
    await caseLink.click();
    await page.waitForURL(/\/cases\//);
    await expect(page.locator("h1")).toContainText("Landlord");

    // Go back to homepage for fresh submission
    await page.goto("/");

    // Complete OTP again
    await completeOtp(page, aadhaar);

    // Fill form with same details
    await page.locator("textarea").fill(grievance);
    await page.locator('input[placeholder*="Area / locality"]').fill(locality);

    // Submit and expect duplicate detection
    const [secondResponse] = await Promise.all([
      page.waitForResponse(isStartPost),
      page.getByRole("button", { name: /Start My Case/ }).click(),
    ]);
    expect(secondResponse.status()).toBe(409);
    await expect(page.getByText(/Same case, same location/)).toBeVisible({
      timeout: 10_000,
    });

    // Click "file new anyway" and expect 200
    const [thirdResponse] = await Promise.all([
      page.waitForResponse(isStartPost),
      page.getByRole("button", { name: /Naya case file karna hai anyway/ }).click(),
    ]);
    expect(thirdResponse.status()).toBe(200);
    await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Accessibility", () => {
  test("homepage meets WCAG 2.1 AA", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("case detail page meets WCAG 2.1 AA", async ({ page }) => {
    if (!(await openFirstCase(page))) {
      test.skip();
      return;
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe("Mobile Responsiveness", () => {
  test("intake form works on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("textarea")).toBeVisible();
    await expect(page.getByRole("button", { name: /Start My Case/ })).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("case list is mobile-friendly", async ({ page }) => {
    await page.goto("/cases");
    const caseLinks = page.locator('a[href*="/cases/"]');
    await caseLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
    if ((await caseLinks.count()) === 0) {
      test.skip();
      return;
    }
    const box = await caseLinks.first().boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});
