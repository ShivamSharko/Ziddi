# Indian Behavioral Patterns (research-backed)

Design decisions for Ziddi based on documented Indian user behavior:

## Trust & Psychology
- **Trust deficit in government systems:** 4,05,509 RTI appeals pending across 29 commissions (2026). Every claim needs evidence + timeline proof.
- **High tolerance until snap point:** "Sahi hai" acceptance → sudden outrage. Ziddi catches both the simmering and the snap.
- **Receipt culture:** Indians keep UPI screenshots, bills, WhatsApp chats. The product must treat these as first-class evidence, not attachments.
- **Family consultation before action:** Legal action is a family decision. "Share with family" > "Share on social."
- **Fear of retaliation:** Against landlords, bosses, local politicians. Anonymous mode + encrypted storage mandatory.

## Communication
- **WhatsApp-first mental model:** 500M+ Indian WhatsApp users. UI should read like a chat.
- **Hinglish natural speech:** All prompts and UI strings must be Hinglish-native, not English-translated.
- **Voice > text for many:** Especially elderly and rural-adjacent users. Voice-first intake.

## Motivation
- **Festival/cycle driven grievances:** Diwali → landlord deposits. Monsoon → potholes. Tax season → TDS refunds. Trigger engine must know this.
- **Status signaling:** "You're top 5% persistent citizens in Bengaluru." Progress bars and social proof work (see: Zomato, Swiggy gamification).
- **Emotional triggers:** Disrespect, being ignored, money lost. Copy must name these.

## Constraints
- **Time-poor middle class:** 3-click max per action. Abandon rate explodes past 3 steps.
- **Babu anxiety:** Government office visits are feared. Agent does all drafting; user only approves.
- **"Log kya kahenge" (what will people say):** Social proof matters. Share anonymized progress.

## Implications for Ziddi
1. Receipt vault = core primitive, not a feature.
2. Family-share button, not just share.
3. Festival trigger calendar baked in.
4. Gamified persistence ("Fight Meter").
5. Anonymous mode on by default for sensitive cases.
6. Voice intake as primary path.
7. Every screen ≤ 3 clicks to next action.

