# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> Happy Path >> full happy path: intake → case → evidence → draft → approve
- Location: e2e\happy-path.spec.ts:58:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Ziddi"
Received string:    "Your grievance won't get solved until someone ziddi follows up."
Timeout: 5000ms

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')
    13 × locator resolved to <h1 class="text-4xl font-bold tracking-tight">…</h1>
       - unexpected value "Your grievance won't get solved until someone ziddi follows up."

```

```yaml
- heading "Your grievance won't get solved until someone ziddi follows up." [level=1]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import AxeBuilder from "@axe-core/playwright";
  3   | import {
  4   |   mockIntakeExtract,
  5   |   mockEvidenceChecklist,
  6   |   mockDraft,
  7   | } from "./helpers/mock-gemini";
  8   | 
  9   | test.describe("Happy Path", () => {
  10  |   test.beforeEach(async ({ page }) => {
  11  |     // Mock Gemini API calls
  12  |     await page.route("**/api/start", async (route) => {
  13  |       const body = await route.request().postDataJSON();
  14  |       if (body.rawCitizenText && body.rawCitizenText.includes("landlord")) {
  15  |         await route.fulfill({
  16  |           status: 200,
  17  |           contentType: "application/json",
  18  |           body: JSON.stringify({ caseId: "mock-case-123" }),
  19  |         });
  20  |       } else {
  21  |         await route.continue();
  22  |       }
  23  |     });
  24  | 
  25  |     await page.route("**/api/cases/*/draft", async (route) => {
  26  |       await route.fulfill({
  27  |         status: 200,
  28  |         contentType: "application/json",
  29  |         body: JSON.stringify({ draftId: "mock-draft-456" }),
  30  |       });
  31  |     });
  32  | 
  33  |     await page.route("**/api/cases/*/evidence", async (route) => {
  34  |       await route.fulfill({
  35  |         status: 200,
  36  |         contentType: "application/json",
  37  |         body: JSON.stringify({ ok: true, added: 1 }),
  38  |       });
  39  |     });
  40  | 
  41  |     await page.route("**/api/cases/*/approve", async (route) => {
  42  |       await route.fulfill({
  43  |         status: 200,
  44  |         contentType: "application/json",
  45  |         body: JSON.stringify({ ok: true }),
  46  |       });
  47  |     });
  48  | 
  49  |     await page.route("**/api/cases/*/upvote", async (route) => {
  50  |       await route.fulfill({
  51  |         status: 200,
  52  |         contentType: "application/json",
  53  |         body: JSON.stringify({ ok: true }),
  54  |       });
  55  |     });
  56  |   });
  57  | 
  58  |   test("full happy path: intake → case → evidence → draft → approve", async ({
  59  |     page,
  60  |   }) => {
  61  |     // Step 1: Go to homepage
  62  |     await page.goto("/");
> 63  |     await expect(page.locator("h1")).toContainText("Ziddi");
      |                                      ^ Error: expect(locator).toContainText(expected) failed
  64  | 
  65  |     // Step 2: Fill intake form with Aadhaar + OTP
  66  |     const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]');
  67  |     await aadhaarInput.fill("234567890124");
  68  | 
  69  |     await page.getByRole("button", { name: "Send OTP" }).click();
  70  |     await expect(page.locator("text=Demo mode")).toBeVisible();
  71  | 
  72  |     const otpCode = page.locator("text=/\\d{6}/").first();
  73  |     const codeText = await otpCode.textContent();
  74  |     const otpValue = codeText?.match(/\d{6}/)?.[0] ?? "123456";
  75  | 
  76  |     const otpInput = page.locator('input[placeholder*="6-digit OTP"]');
  77  |     await otpInput.fill(otpValue);
  78  | 
  79  |     await page.getByRole("button", { name: "Verify" }).click();
  80  |     await expect(page.locator("text=Aadhaar + OTP verified")).toBeVisible();
  81  | 
  82  |     // Step 3: Submit grievance
  83  |     const textarea = page.locator("textarea");
  84  |     await textarea.fill(
  85  |       "Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein",
  86  |     );
  87  | 
  88  |     await page.getByRole("button", { name: "Start My Case" }).click();
  89  | 
  90  |     // Wait for case creation (mocked)
  91  |     await expect(page.locator("text=Case created")).toBeVisible({
  92  |       timeout: 10_000,
  93  |     });
  94  | 
  95  |     // Step 4: Go to case detail
  96  |     await page.getByRole("link", { name: "View case" }).click();
  97  |     await expect(page.locator("h1")).toContainText("Landlord");
  98  | 
  99  |     // Step 5: Add text evidence
  100 |     const evidenceInput = page.locator(
  101 |       'input[placeholder*="Text-only evidence"]',
  102 |     );
  103 |     await evidenceInput.fill("Rental agreement copy");
  104 |     await page.getByRole("button", { name: "Add evidence" }).click();
  105 |     await expect(page.locator("text=Rental agreement copy")).toBeVisible();
  106 | 
  107 |     // Step 6: Draft demand notice
  108 |     await page.getByRole("button", { name: "Draft DemandNotice" }).click();
  109 |     await expect(page.locator("text=Draft")).toBeVisible({ timeout: 10_000 });
  110 | 
  111 |     // Step 7: Approve draft
  112 |     await page.getByRole("button", { name: "Approve draft" }).click();
  113 |     await expect(page.locator("text=approved")).toBeVisible({
  114 |       timeout: 5_000,
  115 |     });
  116 |   });
  117 | 
  118 |   test("upvote flow with Aadhaar verification", async ({ page }) => {
  119 |     await page.goto("/cases");
  120 | 
  121 |     // If no cases exist, skip this test
  122 |     const caseLinks = page.locator('a[href*="/cases/"]');
  123 |     const count = await caseLinks.count();
  124 |     if (count === 0) {
  125 |       test.skip();
  126 |       return;
  127 |     }
  128 | 
  129 |     // Click first case
  130 |     await caseLinks.first().click();
  131 | 
  132 |     // Scroll to community support section
  133 |     await page.locator("text=Community support").scrollIntoViewIfNeeded();
  134 | 
  135 |     // Enter Aadhaar for upvote
  136 |     const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]').last();
  137 |     await aadhaarInput.fill("234567890124");
  138 | 
  139 |     await page.getByRole("button", { name: "Send OTP" }).last().click();
  140 |     await expect(page.locator("text=Demo mode").last()).toBeVisible();
  141 | 
  142 |     const otpCode = page.locator("text=/\\d{6}/").last();
  143 |     const codeText = await otpCode.textContent();
  144 |     const otpValue = codeText?.match(/\d{6}/)?.[0] ?? "123456";
  145 | 
  146 |     const otpInput = page.locator('input[placeholder*="6-digit OTP"]').last();
  147 |     await otpInput.fill(otpValue);
  148 | 
  149 |     await page.getByRole("button", { name: "Verify" }).last().click();
  150 |     await expect(page.locator("text=Your support counted")).toBeVisible({
  151 |       timeout: 5_000,
  152 |     });
  153 |   });
  154 | 
  155 |   test("duplicate detection shows existing cases", async ({ page }) => {
  156 |     await page.goto("/");
  157 | 
  158 |     // Fill Aadhaar + OTP
  159 |     const aadhaarInput = page.locator('input[placeholder*="12-digit Aadhaar"]');
  160 |     await aadhaarInput.fill("234567890124");
  161 | 
  162 |     await page.getByRole("button", { name: "Send OTP" }).click();
  163 |     const otpCode = page.locator("text=/\\d{6}/").first();
```