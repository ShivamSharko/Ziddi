# Evals: 10 Grievance Transcripts → Expected Case JSON

CI-gated prompt regression suite. Every prompt edit must keep all 10 fixtures passing.

| # | Transcript (input) | Expected extraction |
|---|--------------------|---------------------|
| 1 | Hinglish landlord deposit, Bengaluru, ₹60,000 | LandlordDeposit / Bengaluru / Karnataka / High / 60000 / hinglish / genuine |
| 2 | HSR Layout pothole, bike fell | CivicPothole / Bengaluru / Karnataka / hinglish / genuine |
| 3 | Air India cancellation refund ₹15,000 | ConsumerRefund / High / 15000 / genuine |
| 4 | Abuse text ("i need sex") | isGenuineGrievance: false (rejected) |
| 5 | Gibberish keyboard mash | isGenuineGrievance: false (rejected) |
| 6 | RTI no reply 40 days, Delhi Jal Board | RtiFiling / Delhi / Delhi / genuine |
| 7 | Fake product refund, Mumbai, ₹15,000 | ConsumerRefund / Mumbai / Maharashtra / 15000 / genuine |
| 8 | Wrong electricity meter bill, Bengaluru ₹8,000 | ElectricityBill / Bengaluru / Karnataka / 8000 / genuine |
| 9 | Aadhaar mobile update failing, Pune | AadhaarUpdate / Pune / Maharashtra / genuine |
| 10 | No water supply 2 weeks, Gurgaon Sector 45 | CivicWater / Gurgaon / Haryana / genuine |

Run locally: `pnpm evals` (requires GEMINI_API_KEY).
CI: runs automatically in .github/workflows/ci.yml on every push.

