# Ziddi Portal Automation Chrome Extension

Auto-fill Indian government grievance portals with your Ziddi case data.

## Supported Portals

- **CPGRAMS** (pgportal.gov.in) - Central grievance redressal
- **e-Daakhil** (edaakhil.nic.in) - Consumer complaints
- **RTI Online** (rtionline.gov.in) - Right to Information applications

## Installation

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `extensions/chrome` folder
5. Extension icon appears in toolbar

## Usage

1. Create a case in Ziddi (localhost:3000)
2. Click the Ziddi extension icon
3. Select your case
4. Choose portal (CPGRAMS / e-Daakhil / RTI)
5. Portal opens in new tab with form auto-filled
6. **Review all fields** and manually click Submit

## Security

- Extension only runs on official government portals
- No data is sent to third parties
- API key never exposed to browser
- User must manually submit (respects draft-not-file guardrail)

## Limitations

- Form field selectors may break if portals update their UI
- Some portals have CAPTCHA (cannot be automated)
- User must manually attach evidence files
- Payment (RTI fee, court fee) must be done manually

## Icons

Generate icons using any image editor:
- 16x16, 48x48, 128x128 PNG
- Saffron/green/blue color scheme
- "Z" logo or robot icon

