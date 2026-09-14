// e-Daakhil (consumer complaint) auto-fill script

chrome.storage.local.get(["ziddiCase", "ziddiPortal"], (data) => {
  if (data.ziddiPortal !== "edaakhil") return;
  
  const caseData = data.ziddiCase;
  if (!caseData) return;

  console.log("[Ziddi] Auto-filling e-Daakhil form with case:", caseData.id);

  const checkFormReady = setInterval(() => {
    const complaintTextarea = document.querySelector('textarea[name*="complaint"], textarea[id*="complaint"]');
    const amountInput = document.querySelector('input[name*="amount"], input[id*="amount"]');
    const cityInput = document.querySelector('input[name*="city"], input[id*="city"]');
    
    if (complaintTextarea || amountInput || cityInput) {
      clearInterval(checkFormReady);
      
      if (cityInput) {
        cityInput.value = caseData.city;
        cityInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      
      if (amountInput && caseData.amountRupees) {
        amountInput.value = String(caseData.amountRupees);
        amountInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      
      if (complaintTextarea) {
        const complaintText = `
Consumer Complaint under Consumer Protection Act 2019

Case ID: ${caseData.id}
Complainant: Citizen of ${caseData.city}, ${caseData.state}
Opposite Party: [To be filled by citizen]

Facts of the Case:
${caseData.summary}

Relief Sought:
${caseData.amountRupees ? `Refund of ₹${caseData.amountRupees.toLocaleString("en-IN")}` : "Appropriate relief"}

Evidence: ${caseData.evidenceCount} documents attached

---
This complaint was drafted by Ziddi (AI grievance assistant) and approved by the citizen. Please review all fields and click Submit.

Disclaimer: Informational assistance, not legal advice. Consult a lawyer before filing.
        `.trim();
        
        complaintTextarea.value = complaintText;
        complaintTextarea.dispatchEvent(new Event("input", { bubbles: true }));
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
      notification.textContent = "✅ Ziddi: e-Daakhil form auto-filled. Review and click Submit.";
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 5000);
    }
  }, 1000);
});

