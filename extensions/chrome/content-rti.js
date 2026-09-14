// RTI Online auto-fill script

chrome.storage.local.get(["ziddiCase", "ziddiPortal"], (data) => {
  if (data.ziddiPortal !== "rti") return;
  
  const caseData = data.ziddiCase;
  if (!caseData) return;

  console.log("[Ziddi] Auto-filling RTI Online form with case:", caseData.id);

  const checkFormReady = setInterval(() => {
    const questionTextarea = document.querySelector('textarea[name*="question"], textarea[id*="question"]');
    const subjectInput = document.querySelector('input[name*="subject"], input[id*="subject"]');
    
    if (questionTextarea || subjectInput) {
      clearInterval(checkFormReady);
      
      if (subjectInput) {
        subjectInput.value = `RTI Application - ${caseData.kind} - ${caseData.city}`;
        subjectInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      
      if (questionTextarea) {
        const questionText = `
RTI Application under Section 6(1) of Right to Information Act 2005

Applicant: Citizen of ${caseData.city}, ${caseData.state}

Information Requested:
${caseData.summary}

Background:
This RTI is filed in connection with a grievance regarding ${caseData.kind.toLowerCase()} in ${caseData.locality || caseData.city}.

Please provide the following information:
1. Status of the complaint/issue
2. Action taken by the concerned department
3. Reasons for delay (if any)
4. Name and designation of the officer responsible

Application Fee: ₹10 (to be paid via IPO/DD/online)

---
This RTI application was drafted by Ziddi (AI grievance assistant) and approved by the citizen. Please review and submit.

Note: PIO must respond within 30 days as per Section 7(1) of RTI Act 2005.
        `.trim();
        
        questionTextarea.value = questionText;
        questionTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      }

      const notification = document.createElement("div");
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 16px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      notification.textContent = "✅ Ziddi: RTI form auto-filled. Review and click Submit.";
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 5000);
    }
  }, 1000);
});

