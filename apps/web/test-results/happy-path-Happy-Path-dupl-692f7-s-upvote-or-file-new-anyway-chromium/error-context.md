# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> Happy Path >> duplicate detection offers upvote or file-new-anyway
- Location: e2e\happy-path.spec.ts:107:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('case-created')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByTestId('case-created') with timeout 15000ms
  - waiting for getByTestId('case-created')

```

```yaml
- banner:
  - link "Ziddi ज़िद्दी":
    - /url: /
  - navigation:
    - link "Shikayat":
      - /url: /
    - link "Mere Cases":
      - /url: /cases
    - group "Language selection":
      - button "EN"
      - button "हिं"
      - button "Hinglish" [pressed]
- main:
  - paragraph: sunte hain · likhte hain · ladte hain
  - heading "Aapki shikayat tab tak solve nahi hogi jab tak koi ziddi ho kar peeche na pade." [level=1]
  - paragraph: "Ziddi aapka AI citizen-advocate hai: drafts banata hai, deadlines track karta hai, aur case close hone tak escalate karta hai."
  - paragraph: Teri shikayat. Hamara saboot. Focus se lado. Akele nahi.
  - text: Ziddi Bot — batao kya hua? Hindi, English ya dono mein likh sakte ho. Mera landlord ne 50000 deposit wapas nahi diya Bengaluru mein, 1 saal ho gaya, agreement hai mere paas
  - paragraph: Monsoon watch
  - paragraph: "Barish season: pothole complaints 3x spike. Duplicate case mat kholo - existing case ko upvote karo, ya naya file karo."
  - textbox "Apni problem English, Hindi ya Hinglish mein likho..." [disabled]: Mera landlord ne 50000 deposit wapas nahi diya Bengaluru mein, 1 saal ho gaya, agreement hai mere paas
  - textbox "City (e.g. Bengaluru)"
  - textbox "Area / locality (jaise HSR Layout, Andheri West)": DUP-1789491853966
  - paragraph: Verify to file
  - paragraph: ✓ Verified — crop-marks lock onto identity
  - button "Voice Intake (Live)"
  - switch "Anonymous mode — naam chhupa rahega"
  - button "Case start ho raha hai..." [disabled]
- contentinfo:
  - paragraph:
    - strong: CONCEPT & BUILD
    - text: — ZIDDI TEAM ·
    - strong: AI DRAFTING
    - text: — GOOGLE GEMINI ·
    - strong: FOR
    - text: — FUND MY CRAZY 2026
  - paragraph: Ziddi informational assistance hai, legal advice nahi. Bhejne se pehle drafts review karo.
- text: ZIDDI — 2026 CASE FILE UI · REDESIGN PASS 02 REF FMC26-A1042 HOME / INTAKE
- alert
```

# Test source

```ts
  18  |   const otp = bannerText?.match(/\d{6}/)?.[0] ?? "";
  19  |   expect(otp).toHaveLength(6);
  20  |   await page.getByTestId("otp-input").fill(otp);
  21  |   await page.getByTestId("verify-otp").click();
  22  |   await expect(page.getByTestId("otp-verified")).toBeVisible();
  23  | };
  24  | 
  25  | const openFirstCase = async (page: Page): Promise<boolean> => {
  26  |   await page.goto("/cases");
  27  |   const caseLinks = page.locator('a[href*="/cases/"]');
  28  |   await caseLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  29  |   if ((await caseLinks.count()) === 0) return false;
  30  |   await caseLinks.first().click();
  31  |   return true;
  32  | };
  33  | 
  34  | test.describe("Happy Path", () => {
  35  |   test.beforeEach(async ({ page }) => {
  36  |     await page.route("**/generativelanguage.googleapis.com/**", async (route) => {
  37  |       const request = route.request();
  38  |       if (request.method() !== "POST") {
  39  |         await route.continue();
  40  |         return;
  41  |       }
  42  |       const raw = request.postData() ?? "";
  43  |       const text = raw.includes("Draft a")
  44  |         ? JSON.stringify(mockDraft)
  45  |         : JSON.stringify(mockIntakeExtract);
  46  |       await route.fulfill({
  47  |         status: 200,
  48  |         contentType: "application/json",
  49  |         body: JSON.stringify({
  50  |           candidates: [
  51  |             { content: { role: "model", parts: [{ text }] }, finishReason: "STOP", index: 0 },
  52  |           ],
  53  |           usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 10, totalTokenCount: 20 },
  54  |         }),
  55  |       });
  56  |     });
  57  |   });
  58  | 
  59  |   test("full happy path: intake → case → evidence → draft → approve", async ({ page }) => {
  60  |     const aadhaar = freshAadhaar();
  61  |     const locality = `E2E-${Date.now()}`;
  62  | 
  63  |     await page.goto("/");
  64  |     await expect(page.locator("h1")).toContainText(/ziddi/i);
  65  | 
  66  |     await completeOtp(page, aadhaar);
  67  | 
  68  |     await page
  69  |       .getByTestId("grievance-text")
  70  |       .fill("Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein, agreement hai");
  71  |     await page.locator('input[placeholder*="Area / locality"]').fill(locality);
  72  |     await page.getByTestId("start-case").click();
  73  | 
  74  |     await expect(page.getByTestId("case-created")).toBeVisible({ timeout: 15_000 });
  75  |     await page.getByTestId("view-case").click();
  76  | 
  77  |     await expect(page.locator("h1")).toContainText("Landlord");
  78  | 
  79  |     await page.getByTestId("evidence-desc").fill("Rental agreement copy");
  80  |     await page.getByTestId("add-evidence").click();
  81  |     await expect(page.getByText("Rental agreement copy").first()).toBeVisible({ timeout: 10_000 });
  82  | 
  83  |     await page.getByTestId("draft-btn").click();
  84  |     await expect(page.getByTestId("draft-card")).toBeVisible({ timeout: 15_000 });
  85  | 
  86  |     await page.getByTestId("approve-draft").click();
  87  |     await expect(page.getByText("Citizen approved the draft")).toBeVisible({ timeout: 10_000 });
  88  |   });
  89  | 
  90  |   test("upvote flow with Aadhaar verification", async ({ page }) => {
  91  |     if (!(await openFirstCase(page))) {
  92  |       test.skip();
  93  |       return;
  94  |     }
  95  |     const aadhaar = freshAadhaar();
  96  |     await page.getByTestId("aadhaar-input").fill(aadhaar);
  97  |     await page.getByTestId("send-otp").click();
  98  |     const banner = page.getByTestId("otp-dev-code");
  99  |     await expect(banner).toBeVisible();
  100 |     const bannerText = await banner.textContent();
  101 |     const otp = bannerText?.match(/\d{6}/)?.[0] ?? "";
  102 |     await page.getByTestId("otp-input").fill(otp);
  103 |     await page.getByTestId("verify-otp").click();
  104 |     await expect(page.getByText(/Your support counted/)).toBeVisible({ timeout: 10_000 });
  105 |   });
  106 | 
  107 |   test("duplicate detection offers upvote or file-new-anyway", async ({ page }) => {
  108 |     const aadhaar = freshAadhaar();
  109 |     const locality = `DUP-${Date.now()}`;
  110 |     const grievance =
  111 |       "Mera landlord ne 50000 deposit wapas nahi diya Bengaluru mein, 1 saal ho gaya, agreement hai mere paas";
  112 | 
  113 |     await page.goto("/");
  114 |     await completeOtp(page, aadhaar);
  115 |     await page.getByTestId("grievance-text").fill(grievance);
  116 |     await page.locator('input[placeholder*="Area / locality"]').fill(locality);
  117 |     await page.getByTestId("start-case").click();
> 118 |     await expect(page.getByTestId("case-created")).toBeVisible({ timeout: 15_000 });
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  119 | 
  120 |     await page.getByTestId("start-case").click();
  121 |     await expect(page.getByTestId("dup-interstitial")).toBeVisible({ timeout: 15_000 });
  122 |     await page.getByTestId("file-anyway").click();
  123 |     await expect(page.getByTestId("case-created")).toBeVisible({ timeout: 15_000 });
  124 |   });
  125 | });
  126 | 
  127 | test.describe("Accessibility", () => {
  128 |   test("homepage meets WCAG 2.1 AA", async ({ page }) => {
  129 |     await page.goto("/");
  130 |     const results = await new AxeBuilder({ page })
  131 |       .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  132 |       .analyze();
  133 |     expect(results.violations).toEqual([]);
  134 |   });
  135 | 
  136 |   test("case detail page meets WCAG 2.1 AA", async ({ page }) => {
  137 |     if (!(await openFirstCase(page))) {
  138 |       test.skip();
  139 |       return;
  140 |     }
  141 |     const results = await new AxeBuilder({ page })
  142 |       .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  143 |       .analyze();
  144 |     expect(results.violations).toEqual([]);
  145 |   });
  146 | });
  147 | 
  148 | test.describe("Mobile Responsiveness", () => {
  149 |   test("intake form works on mobile", async ({ page }) => {
  150 |     await page.goto("/");
  151 |     await expect(page.getByTestId("grievance-text")).toBeVisible();
  152 |     await expect(page.getByTestId("start-case")).toBeVisible();
  153 |     await expect(page.locator("h1")).toBeVisible();
  154 |   });
  155 | 
  156 |   test("case list is mobile-friendly", async ({ page }) => {
  157 |     await page.goto("/cases");
  158 |     const caseLinks = page.locator('a[href*="/cases/"]');
  159 |     await caseLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  160 |     if ((await caseLinks.count()) === 0) {
  161 |       test.skip();
  162 |       return;
  163 |     }
  164 |     const box = await caseLinks.first().boundingBox();
  165 |     expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  166 |   });
  167 | });
  168 | 
```