// CPGRAMS auto-fill script
// Injects case data into CPGRAMS complaint form

chrome.storage.local.get(["ziddiCase", "ziddiPortal"], (data) => {
  if (data.ziddiPortal !== "cpgrams") return;
  
  const caseData = data.ziddiCase;
  if (!caseData) return;

  console.log("[Ziddi] Auto-filling CPGRAMS form with case:", caseData.id);

  // Wait for form to load
  const checkFormReady = setInterval(() => {
    const complaintTextarea = document.querySelector('textarea[name*="complaint"], textarea[id*="complaint"]');
    const subjectInput = document.querySelector('input[name*="subject"], input[id*="subject"]');
    
    if (complaintTextarea || subjectInput) {
      clearInterval(checkFormReady);
      
      if (subjectInput) {
        subjectInput.value = `${caseData.kind} - ${caseData.city}`;
        subjectInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
      
      if (complaintTextarea) {
        const complaintText = `
Case ID: ${caseData.id}
Kind: ${caseData.kind}
City: ${caseData.city}, ${caseData.state}
${caseData.locality ? `Locality: ${caseData.locality}` : ""}
Amount: ${caseData.amountRupees ? `₹${caseData.amountRupees.toLocaleString("en-IN")}` : "N/A"}

Summary:
${caseData.summary}

Evidence Count: ${caseData.evidenceCount}

---
This complaint was drafted by Ziddi (AI grievance assistant) and approved by the citizen. Please review and submit.

Disclaimer: Informational assistance, not legal advice.
        `.trim();
        
        complaintTextarea.value = complaintText;
        complaintTextarea.dispatchEvent(new Event("input", { bubbles: true }));
      }

      // Show notification
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
      notification.textContent = "✅ Ziddi: Form auto-filled. Review and click Submit.";
      document.body.appendChild(notification);
      
      setTimeout(() => notification.remove(), 5000);
    }
  }, 1000);
});

