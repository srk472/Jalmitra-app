/* ===================================================
   भारत पेयजल - जल मित्र मोबाइल ऐप लॉजिक
   File: app.js
   =================================================== */

// 1. Apps Script API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxTzRuoHBEUEM9GJSLFwxMwZzaroIYRANnIgJP7OCHWX_lkeP1cHv9SfK9sMF9vNz3X/exec";

// Global App State
let globalMonthMap = {};
let currentStaff = { name: "अतिथि", id: "BP---" };
let currentSelectedMonth = "";
let isLoggedIn = false;

// ================= 2. INITIALIZATION & AUTO-LOGIN =================
window.addEventListener('DOMContentLoaded', () => {
  const savedId = localStorage.getItem('bp_staff_id');
  const savedPin = localStorage.getItem('bp_staff_pin');
  const remember = localStorage.getItem('bp_remember_me');

  if (remember === 'true' && savedId && savedPin) {
    document.getElementById('inputId').value = savedId;
    document.getElementById('inputPin').value = savedPin;
    document.getElementById('rememberMeCheck').checked = true;
    doLogin(true); // चुपचाप ऑटो-लॉगिन करें
  } else {
    // अगर पहली बार खुला है तो लॉगिन स्क्रीन दिखाएं
    showLoginModal(false);
  }
});

// ================= 3. 3-TAB NAVIGATION SYSTEM =================
function navigateTab(tabKey) {
  // All Tab Views & Nav Buttons
  const views = {
    'tab-dashboard': document.getElementById('view-dashboard'),
    'tab-salary': document.getElementById('view-salary'),
    'tab-increment': document.getElementById('view-increment')
  };

  const buttons = {
    'tab-dashboard': document.getElementById('btn-tab-dashboard'),
    'tab-salary': document.getElementById('btn-tab-salary'),
    'tab-increment': document.getElementById('btn-tab-increment')
  };

  // 1. Hide all views and remove active class from tabs
  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.add('hidden');
      views[key].classList.remove('active');
    }
    if (buttons[key]) {
      buttons[key].classList.remove('active');
    }
  });

  // 2. Activate requested tab
  if (views[tabKey]) {
    views[tabKey].classList.remove('hidden');
    views[tabKey].classList.add('active');
  }
  if (buttons[tabKey]) {
    buttons[tabKey].classList.add('active');
  }

  // Scroll back to top on tab switch
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================= 4. SIDEBAR DRAWER CONTROLLER =================
function toggleSidebar(open) {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (open) {
    sidebar.classList.add('active');
    backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

// ================= 5. LOGIN MODAL SYSTEM =================
function showLoginModal(canDismiss = true) {
  const modal = document.getElementById('loginModal');
  const dismissBtn = document.getElementById('dismissLoginBtn');
  modal.classList.remove('hidden');

  if (canDismiss && isLoggedIn) {
    dismissBtn.classList.remove('hidden');
  } else {
    dismissBtn.classList.add('hidden');
  }
}

function hideLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

function togglePinVisibility() {
  const pinField = document.getElementById('inputPin');
  const eyeIcon = document.getElementById('eyeIcon');
  if (pinField.type === "password") {
    pinField.type = "text";
    eyeIcon.classList.remove('fa-eye');
    eyeIcon.classList.add('fa-eye-slash');
  } else {
    pinField.type = "password";
    eyeIcon.classList.remove('fa-eye-slash');
    eyeIcon.classList.add('fa-eye');
  }
}

// ================= 6. AUTHENTICATION (LOGIN ACTION) =================
function doLogin(isAutoLogin = false) {
  const idVal = document.getElementById('inputId').value.trim();
  const pinVal = document.getElementById('inputPin').value.trim();
  const err = document.getElementById('loginErr');
  const loginBtn = document.getElementById('loginBtn');
  const loadingBox = document.getElementById('loadingBox');

  if (!idVal || !pinVal) {
    err.textContent = "कृपया मोबाइल नंबर/ID और PIN दोनों दर्ज करें!";
    err.classList.remove('hidden');
    return;
  }

  err.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1"></i> कृपया प्रतीक्षा करें...`;

  if (!isAutoLogin) {
    loadingBox.classList.remove('hidden');
    loadingBox.classList.add('flex');
  }

  fetch(`${API_URL}?id=${encodeURIComponent(idVal)}&pin=${encodeURIComponent(pinVal)}`)
    .then(response => response.json())
    .then(res => {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `<span>डैशबोर्ड खोलें</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;
      loadingBox.classList.add('hidden');
      loadingBox.classList.remove('flex');

      if (!res.success) {
        err.textContent = res.message || "लॉगिन असफल रहा!";
        err.classList.remove('hidden');
        showLoginModal(false);

        if (isAutoLogin) {
          localStorage.removeItem('bp_staff_id');
          localStorage.removeItem('bp_staff_pin');
          localStorage.removeItem('bp_remember_me');
        }
        return;
      }

      // Remember me logic
      const rememberCheck = document.getElementById('rememberMeCheck');
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem('bp_staff_id', idVal);
        localStorage.setItem('bp_staff_pin', pinVal);
        localStorage.setItem('bp_remember_me', 'true');
      } else {
        localStorage.removeItem('bp_staff_id');
        localStorage.removeItem('bp_staff_pin');
        localStorage.removeItem('bp_remember_me');
      }

      // Mark logged in & hide modal
      isLoggedIn = true;
      hideLoginModal();

      // Update UI Header & Sidebar States
      currentStaff = res.staff || { name: idVal, id: idVal };
      document.getElementById('vStaffName').textContent = currentStaff.name;
      document.getElementById('vStaffId').textContent = "ID: " + currentStaff.id;
      document.getElementById('sideStaffName').textContent = currentStaff.name;
      document.getElementById('sideStaffId').textContent = "ID: " + currentStaff.id;

      document.getElementById('headerBadge').classList.remove('hidden');
      document.getElementById('headerBadge').classList.add('flex');
      document.getElementById('sideLoginBtn').classList.add('hidden');
      document.getElementById('sideLogoutBtn').classList.remove('hidden');
      document.getElementById('sideLogoutBtn').classList.add('flex');

      // Populate Month Selector
      globalMonthMap = res.monthDataMap || {};
      const mSelect = document.getElementById('monthSelector');
      mSelect.innerHTML = '';
      (res.monthList || []).forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + (idx === res.monthList.length - 1 ? ' (चालू)' : '');
        mSelect.appendChild(opt);
      });

      const defaultM = res.defaultMonth;
      mSelect.value = defaultM;
      currentSelectedMonth = defaultM;
      renderMonthData(defaultM);

      // Open Home Dashboard Tab
      navigateTab('tab-dashboard');
    })
    .catch(error => {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `<span>डैशबोर्ड खोलें</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;
      loadingBox.classList.add('hidden');
      loadingBox.classList.remove('flex');

      err.textContent = "सर्वर कनेक्शन में समस्या: " + error.message;
      err.classList.remove('hidden');
    });
}

// ================= 7. MONTH DATA RENDERING =================
function onMonthChange(selectedMonth) {
  currentSelectedMonth = selectedMonth;
  renderMonthData(selectedMonth);
}

function renderMonthData(m) {
  const d = globalMonthMap[m];
  if (!d) return;

  // Month labels
  document.getElementById('vPerfMonth').textContent = d.month;
  document.getElementById('vDetailMonth').textContent = d.month;

  // 1. KPI - Naye Grahak
  const totalCust = (d.regList ? d.regList.length : 0) + (d.altList ? d.altList.length : 0);
  document.getElementById('vTotalCust').textContent = totalCust + " ग्राहक";
  document.getElementById('vCustBreakdown').textContent = 
    `${d.regList ? d.regList.length : 0} रेगुलर + ${d.altList ? d.altList.length : 0} अल्टरनेटिव`;

  // 2. KPI - Chhooti Delivery
  const missedCount = d.missedCount || 0;
  document.getElementById('vMissedDeliveries').textContent = missedCount + " शिकायत";
  document.getElementById('vMissedCutText').textContent = "₹" + (d.missedDeliveries || 0) + " कटौती हुई";

  // 3. KPI - Penalty
  document.getElementById('vPenaltyAmount').textContent = "₹" + (d.damagePenalty || 0);

  // 4. KPI - Haziri
  if (d.leaveDays === 0) {
    document.getElementById('vAttendancePercent').textContent = "100% हाज़िरी";
    document.getElementById('vAttendanceBonusText').textContent = "+₹200 नकद इनाम मिला";
  } else {
    document.getElementById('vAttendancePercent').textContent = d.leaveDays + " दिन छुट्टी";
    document.getElementById('vAttendanceBonusText').textContent = "इनाम के पात्र नहीं";
  }

  // Net In-Hand Banner
  document.getElementById('vInHand').textContent = "₹" + (d.inHand || 0).toLocaleString('en-IN');
  document.getElementById('finalInHandBottom').textContent = "₹" + (d.inHand || 0).toLocaleString('en-IN');

  // Paid vs Pending Calculation
  const paid = d.paidAmount !== undefined ? Number(d.paidAmount) : d.inHand;
  const pending = Math.max(0, d.inHand - paid);

  document.getElementById('vPaidAmount').textContent = "₹" + paid.toLocaleString('en-IN');
  document.getElementById('vPendingAmount').textContent = "₹" + pending.toLocaleString('en-IN');
  document.getElementById('bottomPaidText').textContent = "₹" + paid.toLocaleString('en-IN');
  document.getElementById('bottomDueText').textContent = "₹" + pending.toLocaleString('en-IN');

  const statusTextEl = document.getElementById('vPaymentStatusText');
  if (pending === 0 && d.inHand > 0) {
    statusTextEl.innerHTML = `<span class="inline-block bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full"><i class="fa-solid fa-circle-check mr-1"></i> पूरा भुगतान हो चुका है</span>`;
  } else if (pending > 0) {
    statusTextEl.innerHTML = `<span class="inline-block bg-amber-400 text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded-full"><i class="fa-solid fa-clock mr-1"></i> शेष ₹${pending.toLocaleString('en-IN')} बाद में देय है</span>`;
  } else {
    statusTextEl.innerHTML = `<span class="inline-block bg-white/20 text-white text-[10px] px-2.5 py-0.5 rounded-full">हिसाब सामान्य</span>`;
  }

  // 4 Quick Stat Badges
  document.getElementById('vStatBase').textContent = "₹" + (d.baseSalary || 0).toLocaleString('en-IN');
  document.getElementById('vStatIncentive').textContent = "+₹" + (d.totalIncentive || 0).toLocaleString('en-IN');
  document.getElementById('vStatCut').textContent = "-₹" + (d.totalPenalties || 0).toLocaleString('en-IN');
  document.getElementById('vStatAdv').textContent = "-₹" + (d.advanceTaken || 0).toLocaleString('en-IN');

  // Detailed Breakdown Items (1 to 9)
  document.getElementById('item1').textContent = "₹" + (d.baseSalary || 0).toLocaleString('en-IN');
  
  // Regular Tanks List
  document.getElementById('regCountLabel').textContent = `${d.regList ? d.regList.length : 0} टंकी जुड़ीं • सूची देखें ▾`;
  document.getElementById('regTotalAmount').textContent = "+₹" + (d.regIncentiveTotal || 0).toLocaleString('en-IN');
  renderList('regListItems', d.regList);

  // Alternative Tanks List
  document.getElementById('altCountLabel').textContent = `${d.altList ? d.altList.length : 0} टंकी जुड़ी • सूची देखें ▾`;
  document.getElementById('altTotalAmount').textContent = "+₹" + (d.altIncentiveTotal || 0).toLocaleString('en-IN');
  renderList('altListItems', d.altList);

  document.getElementById('item4').textContent = "+₹" + (d.bookingPercentBonus || 0).toLocaleString('en-IN');
  document.getElementById('item5').textContent = "+₹" + (d.attendanceBonus || 0).toLocaleString('en-IN');
  document.getElementById('item5Desc').textContent = d.leaveDays === 0 ? "पात्र (0 छुट्टी बोनस)" : `अपात्र (${d.leaveDays} छुट्टी)`;
  
  document.getElementById('item6').textContent = "-₹" + (d.leaveCut || 0).toLocaleString('en-IN');
  document.getElementById('item6Desc').textContent = `${d.leaveDays || 0} दिन अनुपस्थित (@ ₹${Math.round((d.baseSalary || 0)/30)}/दिन)`;

  document.getElementById('item7').textContent = "-₹" + (d.missedDeliveries || 0).toLocaleString('en-IN');
  document.getElementById('item7Desc').textContent = missedCount > 0 ? `${missedCount} बार पानी छूटा` : "कोई कटौती नहीं";

  document.getElementById('item8').textContent = "-₹" + (d.damagePenalty || 0).toLocaleString('en-IN');
  document.getElementById('item9').textContent = "-₹" + (d.advanceTaken || 0).toLocaleString('en-IN');
}

// Helper: Render Tank Details List
function renderList(targetId, list) {
  const box = document.getElementById(targetId);
  box.innerHTML = '';
  if (!list || list.length === 0) {
    box.innerHTML = '<span class="text-slate-400 text-[10.5px]">कोई नई टंकी दर्ज नहीं है।</span>';
    return;
  }
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = "flex justify-between items-center py-1 border-b border-slate-100 last:border-0 gap-2";
    row.innerHTML = `
      <div class="truncate text-[11px] text-slate-700">📅 ${item.date}: <strong>${item.customer}</strong></div>
      <span class="text-emerald-600 font-bold text-[11px] shrink-0">+₹${item.amount}</span>
    `;
    box.appendChild(row);
  });
}

// Helper: Accordion Toggle
function toggleAccordion(id) {
  const el = document.getElementById(id);
  el.classList.toggle('hidden');
}

// ================= 8. LOGOUT ACTION =================
function logout() {
  localStorage.removeItem('bp_staff_id');
  localStorage.removeItem('bp_staff_pin');
  localStorage.removeItem('bp_remember_me');

  isLoggedIn = false;
  document.getElementById('inputPin').value = '';

  // Reset Profile Text
  document.getElementById('vStaffName').textContent = "नमस्ते, अतिथि";
  document.getElementById('vStaffId').textContent = "ID: BP---";
  document.getElementById('sideStaffName').textContent = "लॉगिन नहीं हैं";
  document.getElementById('sideStaffId').textContent = "ID: ----";

  // Toggle Header and Sidebar Buttons
  document.getElementById('headerBadge').classList.add('hidden');
  document.getElementById('headerBadge').classList.remove('flex');
  document.getElementById('sideLoginBtn').classList.remove('hidden');
  document.getElementById('sideLogoutBtn').classList.add('hidden');
  document.getElementById('sideLogoutBtn').classList.remove('flex');

  showLoginModal(false);
}