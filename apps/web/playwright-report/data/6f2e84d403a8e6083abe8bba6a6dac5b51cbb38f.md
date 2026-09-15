# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: happy-path.spec.ts >> Accessibility >> homepage meets WCAG 2.1 AA
- Location: e2e\happy-path.spec.ts:128:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 60

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#15181d",
+               "contrastRatio": 3.64,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#6f7177",
+               "fontSize": "7.5pt (10px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 3.64 (foreground color: #6f7177, background color: #15181d, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"rounded-[6px] border border-[var(--hairline)] bg-[var(--ink-2)] p-6\">",
+                 "target": Array [
+                   ".rounded-\\[6px\\]",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 3.64 (foreground color: #6f7177, background color: #15181d, font size: 7.5pt (10px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"fixed bottom-3 left-4 z-30 font-mono-data text-[10px] leading-relaxed text-[var(--text-2)] opacity-70 pointer-events-none whitespace-pre-line\">ZIDDI — 2026
+ CASE FILE UI · REDESIGN PASS 02
+ REF FMC26-A1042</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".left-4",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Ziddi ज़िद्दी" [ref=e4] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]: Ziddi
        - generic [ref=e9]: ज़िद्दी
      - navigation [ref=e10]:
        - link "Shikayat" [ref=e11] [cursor=pointer]:
          - /url: /
        - link "Mere Cases" [ref=e12] [cursor=pointer]:
          - /url: /cases
        - group "Language selection" [ref=e13]:
          - button "EN" [ref=e14]
          - button "हिं" [ref=e15]
          - button "Hinglish" [pressed] [ref=e16]
  - main [ref=e17]:
    - generic [ref=e18]:
      - generic [ref=e20]:
        - paragraph [ref=e21]: sunte hain · likhte hain · ladte hain
        - generic [ref=e22]:
          - heading "Aapki shikayat tab tak solve nahi hogi jab tak koi ziddi ho kar peeche na pade." [level=1] [ref=e23]
          - paragraph [ref=e24]: "Ziddi aapka AI citizen-advocate hai: drafts banata hai, deadlines track karta hai, aur case close hone tak escalate karta hai."
          - paragraph [ref=e25]: Teri shikayat. Hamara saboot.Focus se lado. Akele nahi.
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: Ziddi Bot — batao kya hua? Hindi, English ya dono mein likh sakte ho.
          - generic [ref=e31]:
            - paragraph [ref=e32]: Monsoon watch
            - paragraph [ref=e33]: "Barish season: pothole complaints 3x spike. Duplicate case mat kholo - existing case ko upvote karo, ya naya file karo."
          - generic [ref=e34]:
            - textbox "Apni problem English, Hindi ya Hinglish mein likho..." [ref=e35]
            - textbox "City (e.g. Bengaluru)" [ref=e39]
            - textbox "Area / locality (jaise HSR Layout, Andheri West)" [ref=e41]
        - generic [ref=e43]:
          - paragraph [ref=e44]: Verify to file
          - generic [ref=e47]:
            - paragraph [ref=e48]: Verify to file
            - generic [ref=e49]:
              - textbox "12-digit Aadhaar number" [ref=e50]
              - button "Send OTP" [disabled] [ref=e51]
            - paragraph [ref=e52]: Aadhaar number is NEVER stored — only a one-way salted hash (UIDAI-compliant). OTP proves you own the number.
          - button "Voice Intake (Live)" [ref=e55]
          - switch "Anonymous mode — naam chhupa rahega" [ref=e59]
          - button "Start My Case" [disabled] [ref=e68]
  - contentinfo [ref=e69]:
    - generic [ref=e70]:
      - paragraph [ref=e71]:
        - strong [ref=e72]: CONCEPT & BUILD
        - text: — ZIDDI TEAM ·
        - strong [ref=e73]: AI DRAFTING
        - text: — GOOGLE GEMINI ·
        - strong [ref=e74]: FOR
        - text: — FUND MY CRAZY 2026
      - paragraph [ref=e75]: Ziddi informational assistance hai, legal advice nahi. Bhejne se pehle drafts review karo.
  - generic: ZIDDI — 2026 CASE FILE UI · REDESIGN PASS 02 REF FMC26-A1042
  - generic: HOME / INTAKE
  - button "Open Next.js Dev Tools" [ref=e81] [cursor=pointer]
  - alert [ref=e85]
```

# Test source

```ts
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
  118 |     await expect(page.getByTestId("case-created")).toBeVisible({ timeout: 15_000 });
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
> 133 |     expect(results.violations).toEqual([]);
      |                                ^ Error: expect(received).toEqual(expected) // deep equality
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