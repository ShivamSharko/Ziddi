const API_BASE = "http://localhost:3000";
let selectedCaseId = null;
let cases = [];

async function loadCases() {
  try {
    const response = await fetch(`${API_BASE}/api/cases`);
    const data = await response.json();
    cases = data.cases || [];
    renderCases();
  } catch (error) {
    document.getElementById("content").innerHTML = `
      <div class="empty">
        <p>❌ Could not connect to Ziddi server</p>
        <p style="font-size: 11px; margin-top: 8px;">Make sure the app is running at localhost:3000</p>
      </div>
    `;
  }
}

function renderCases() {
  const content = document.getElementById("content");
  
  if (cases.length === 0) {
    content.innerHTML = `
      <div class="empty">
        <p>No cases found</p>
        <p style="font-size: 11px; margin-top: 8px;">Create a case in Ziddi first</p>
      </div>
    `;
    return;
  }

  const casesHtml = cases.map(c => `
    <div class="case-item" data-case-id="${c.id}">
      <div class="case-id">${c.id.slice(0, 10)}...</div>
      <div class="case-summary">${c.summary}</div>
      <div class="case-meta">
        ${c.kind} · ${c.city} · ₹${c.amountRupees?.toLocaleString("en-IN") || "N/A"}
      </div>
    </div>
  `).join("");

  content.innerHTML = `
    <div class="case-list">${casesHtml}</div>
    <div id="portal-section" style="display: none;">
      <p style="font-size: 12px; margin: 0 0 8px 0;">Submit to portal:</p>
      <div class="portal-buttons">
        <button class="portal-btn" data-portal="cpgrams">CPGRAMS</button>
        <button class="portal-btn" data-portal="edaakhil">e-Daakhil</button>
        <button class="portal-btn" data-portal="rti">RTI Online</button>
      </div>
    </div>
    <div class="disclaimer">
      ⚠️ Extension auto-fills the portal form. You must manually click the portal's Submit button after reviewing.
    </div>
  `;

  document.querySelectorAll(".case-item").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll(".case-item").forEach(e => e.classList.remove("selected"));
      el.classList.add("selected");
      selectedCaseId = el.dataset.caseId;
      document.getElementById("portal-section").style.display = "block";
    });
  });

  document.querySelectorAll(".portal-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const portal = btn.dataset.portal;
      await openPortalWithCase(selectedCaseId, portal);
    });
  });
}

async function openPortalWithCase(caseId, portal) {
  const selectedCase = cases.find(c => c.id === caseId);
  if (!selectedCase) return;

  const portalUrls = {
    cpgrams: "https://pgportal.gov.in/",
    edaakhil: "https://edaakhil.nic.in/",
    rti: "https://rtionline.gov.in/"
  };

  const url = portalUrls[portal];
  if (!url) return;

  // Store case data in chrome.storage for content script to read
  await chrome.storage.local.set({
    ziddiCase: selectedCase,
    ziddiPortal: portal
  });

  // Open portal in new tab
  chrome.tabs.create({ url });
}

document.addEventListener("DOMContentLoaded", loadCases);

