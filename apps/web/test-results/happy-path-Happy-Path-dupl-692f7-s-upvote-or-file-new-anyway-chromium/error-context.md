# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> Happy Path >> duplicate detection offers upvote or file-new-anyway
- Location: e2e\happy-path.spec.ts:125:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: ⚡
        - generic [ref=e6]: Ziddi
        - generic [ref=e7]: ज़िद्दी
      - navigation [ref=e8]:
        - link "Intake" [ref=e9] [cursor=pointer]:
          - /url: /
        - link "My Cases" [ref=e10] [cursor=pointer]:
          - /url: /cases
  - main [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]:
        - heading "Your grievance won't get solved until someone ziddi follows up." [level=1] [ref=e14]
        - paragraph [ref=e15]: Ziddi handles the chasing, escalating, and deadline-hitting — for potholes, deposits, RTIs, and refunds. You approve the drafts. We do the rest.
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Z
          - generic [ref=e19]:
            - generic [ref=e20]: Ziddi Bot
            - generic [ref=e21]: Batao kya hua — I'll take it from here
        - generic [ref=e22]:
          - paragraph [ref=e23]: 🎪 Monsoon (Jun-Sep) — seasonal spike active
          - paragraph [ref=e24]: "Barish season: pothole complaints 3x spike. Duplicate case mat kholo - existing case ko upvote karo, ya naya file karo."
        - generic [ref=e25]:
          - textbox "e.g. 'Mera landlord Bengaluru mein 60000 deposit wapas nahi de raha, 2 mahine ho gaye. Rental agreement hai mere paas.'" [ref=e26]: Builder ne possession nahi diya aur refund bhi nahi kar raha, 3 saal ho gaye
          - textbox "Area / locality (e.g. HSR Layout, Andheri West) - duplicate cases isi se match hote hain" [ref=e27]: DUP-1789423197003
          - paragraph [ref=e28]: ✅ Aadhaar + OTP verified (number never stored - hash only)
          - generic [ref=e29]:
            - checkbox "🕶️ Anonymous mode — naam shared documents mein hide rahega (retaliation-safe)" [ref=e30]
            - text: 🕶️ Anonymous mode — naam shared documents mein hide rahega (retaliation-safe)
          - button "Start My Case →" [ref=e32]
        - paragraph [ref=e34]: ❌ Please mention your city and state (e.g. Bengaluru, Karnataka) taaki case sahi department ko jaaye.
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]: 📸
          - heading "Evidence-First" [level=3] [ref=e38]
          - paragraph [ref=e39]: Upload receipts, UPI screenshots, photos. We build your proof vault.
        - generic [ref=e40]:
          - generic [ref=e41]: ⏰
          - heading "SLA Tracking" [level=3] [ref=e42]
          - paragraph [ref=e43]: Every Indian grievance has a legal deadline. We count down and escalate.
        - generic [ref=e44]:
          - generic [ref=e45]: 🔒
          - heading "You Approve" [level=3] [ref=e46]
          - paragraph [ref=e47]: Agent drafts, human approves. Never auto-filed without you.
  - contentinfo [ref=e48]:
    - generic [ref=e49]:
      - paragraph [ref=e50]: Ziddi is informational assistance, not legal advice. Always review drafts before submitting.
      - paragraph [ref=e51]: Built for Fund My Crazy 2026 · Powered by Google Gemini
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]
  - alert [ref=e61]
```

# Test source

```ts
  44  |         ? JSON.stringify(mockDraft)
  45  |         : JSON.stringify(mockIntakeExtract);
  46  |       await route.fulfill({
  47  |         status: 200,
  48  |         contentType: "application/json",
  49  |         body: JSON.stringify({
  50  |           candidates: [
  51  |             {
  52  |               content: { role: "model", parts: [{ text }] },
  53  |               finishReason: "STOP",
  54  |               index: 0,
  55  |             },
  56  |           ],
  57  |           usageMetadata: {
  58  |             promptTokenCount: 10,
  59  |             candidatesTokenCount: 10,
  60  |             totalTokenCount: 20,
  61  |           },
  62  |         }),
  63  |       });
  64  |     });
  65  |   });
  66  | 
  67  |   test("full happy path: intake → case → evidence → draft → approve", async ({
  68  |     page,
  69  |   }) => {
  70  |     const aadhaar = freshAadhaar();
  71  |     const locality = `E2E-${Date.now()}`;
  72  | 
  73  |     await page.goto("/");
  74  |     await expect(page.locator("h1")).toContainText(/ziddi/i);
  75  | 
  76  |     await completeOtp(page, aadhaar);
  77  | 
  78  |     await page
  79  |       .locator("textarea")
  80  |       .fill("Mera landlord ne 60000 deposit wapas nahi diya Bengaluru mein, agreement hai");
  81  |     await page.locator('input[placeholder*="Area / locality"]').fill(locality);
  82  |     await page.getByRole("button", { name: /Start My Case/ }).click();
  83  | 
  84  |     await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 15_000 });
  85  |     await page.getByRole("link", { name: /View case/ }).click();
  86  | 
  87  |     await expect(page.locator("h1")).toContainText("Landlord");
  88  | 
  89  |     await page
  90  |       .locator('input[placeholder*="Text-only evidence"]')
  91  |       .fill("Rental agreement copy");
  92  |     await page.getByRole("button", { name: /Add evidence/ }).click();
  93  |     await expect(page.getByText("Rental agreement copy").first()).toBeVisible({
  94  |       timeout: 10_000,
  95  |     });
  96  | 
  97  |     await page.getByRole("button", { name: /Draft DemandNotice/ }).click();
  98  |     await expect(page.getByText(/Draft: DemandNotice/)).toBeVisible({ timeout: 15_000 });
  99  | 
  100 |     await page.getByRole("button", { name: /Approve draft/ }).click();
  101 |     await expect(page.getByText("Citizen approved the draft")).toBeVisible({
  102 |       timeout: 10_000,
  103 |     });
  104 |   });
  105 | 
  106 |   test("upvote flow with Aadhaar verification", async ({ page }) => {
  107 |     if (!(await openFirstCase(page))) {
  108 |       test.skip();
  109 |       return;
  110 |     }
  111 | 
  112 |     const aadhaar = freshAadhaar();
  113 |     await page.locator('input[placeholder*="12-digit Aadhaar"]').fill(aadhaar);
  114 |     await page.getByRole("button", { name: "Send OTP" }).click();
  115 |     const banner = page.getByText(/Demo mode: your OTP is/);
  116 |     await expect(banner).toBeVisible();
  117 |     const bannerText = await banner.textContent();
  118 |     const otp = bannerText?.match(/\d{6}/)?.[0] ?? "";
  119 |     await page.locator('input[placeholder*="6-digit OTP"]').fill(otp);
  120 |     await page.getByRole("button", { name: "Verify" }).click();
  121 | 
  122 |     await expect(page.getByText(/Your support counted/)).toBeVisible({ timeout: 10_000 });
  123 |   });
  124 | 
  125 |   test("duplicate detection offers upvote or file-new-anyway", async ({ page }) => {
  126 |     const aadhaar = freshAadhaar();
  127 |     const locality = `DUP-${Date.now()}`;
  128 |     const grievance =
  129 |       "Builder ne possession nahi diya aur refund bhi nahi kar raha, 3 saal ho gaye";
  130 | 
  131 |     await page.goto("/");
  132 |     await completeOtp(page, aadhaar);
  133 |     await page.locator("textarea").fill(grievance);
  134 |     await page.locator('input[placeholder*="Area / locality"]').fill(locality);
  135 | 
  136 |     const startButton = page.getByRole("button", { name: /Start My Case/ });
  137 |     const isStartPost = (r: import("@playwright/test").Response) =>
  138 |       r.url().includes("/api/start") && r.request().method() === "POST";
  139 | 
  140 |     const [firstResponse] = await Promise.all([
  141 |       page.waitForResponse(isStartPost),
  142 |       startButton.click(),
  143 |     ]);
> 144 |     expect(firstResponse.status()).toBe(200);
      |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  145 |     await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 10_000 });
  146 | 
  147 |     const [secondResponse] = await Promise.all([
  148 |       page.waitForResponse(isStartPost),
  149 |       startButton.click(),
  150 |     ]);
  151 |     expect(secondResponse.status()).toBe(409);
  152 |     await expect(page.getByText(/Same case, same location/)).toBeVisible({
  153 |       timeout: 10_000,
  154 |     });
  155 | 
  156 |     const [thirdResponse] = await Promise.all([
  157 |       page.waitForResponse(isStartPost),
  158 |       page.getByRole("button", { name: /Naya case file karna hai anyway/ }).click(),
  159 |     ]);
  160 |     expect(thirdResponse.status()).toBe(200);
  161 |     await expect(page.getByText(/Case created/)).toBeVisible({ timeout: 10_000 });
  162 |   });
  163 | });
  164 | 
  165 | test.describe("Accessibility", () => {
  166 |   test("homepage meets WCAG 2.1 AA", async ({ page }) => {
  167 |     await page.goto("/");
  168 |     const results = await new AxeBuilder({ page })
  169 |       .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  170 |       .analyze();
  171 |     expect(results.violations).toEqual([]);
  172 |   });
  173 | 
  174 |   test("case detail page meets WCAG 2.1 AA", async ({ page }) => {
  175 |     if (!(await openFirstCase(page))) {
  176 |       test.skip();
  177 |       return;
  178 |     }
  179 |     const results = await new AxeBuilder({ page })
  180 |       .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  181 |       .analyze();
  182 |     expect(results.violations).toEqual([]);
  183 |   });
  184 | });
  185 | 
  186 | test.describe("Mobile Responsiveness", () => {
  187 |   test("intake form works on mobile", async ({ page }) => {
  188 |     await page.goto("/");
  189 |     await expect(page.locator("textarea")).toBeVisible();
  190 |     await expect(page.getByRole("button", { name: /Start My Case/ })).toBeVisible();
  191 |     await expect(page.locator("h1")).toBeVisible();
  192 |   });
  193 | 
  194 |   test("case list is mobile-friendly", async ({ page }) => {
  195 |     await page.goto("/cases");
  196 |     const caseLinks = page.locator('a[href*="/cases/"]');
  197 |     await caseLinks.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => undefined);
  198 |     if ((await caseLinks.count()) === 0) {
  199 |       test.skip();
  200 |       return;
  201 |     }
  202 |     const box = await caseLinks.first().boundingBox();
  203 |     expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  204 |   });
  205 | });
  206 | 
```