/* ===================================================
   भारत पेयजल - जल मित्र मोबाइल ऐप लॉजिक
   File: app.js
   =================================================== */

// 1. Google Apps Script Web App API URL
const API_URL = "https://script.google.com/macros/s/AKfycbxTzRuoHBEUEM9GJSLFwxMwZzaroIYRANnIgJP7OCHWX_lkeP1cHv9SfK9sMF9vNz3X/exec";

// Global App State
let globalMonthMap = {};
let globalMonthList = [];
let currentStaff = {
  name: "अतिथि",
  id: "BP---",
  phone: "पंजीकृत सदस्य",
  photo: "",
  dob: "",
  joiningDate: "",
  joiningDateDisplay: ""
};
let incrementState = {
  customers: 0,
  months: 0,
  targetCustomers: 36,
  targetMonths: 12
};
let currentSelectedMonth = "";
let isLoggedIn = false;

// ================= 2. SPLASH SCREEN & AUTO-LOGIN INITIALIZATION =================
window.addEventListener('DOMContentLoaded', () => {
  // 1. Segmented Retro Loading Bar Animation
  const segments = document.querySelectorAll('.segmented-bar .segment');
  let currentSeg = 0;

  const barInterval = setInterval(() => {
    if (currentSeg < segments.length) {
      segments[currentSeg].classList.add('active');
      currentSeg++;
    }
  }, 110);

  // 2. Hide Splash Screen smoothly after ~1.6 seconds
  setTimeout(() => {
    clearInterval(barInterval);
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => splash.remove(), 450);
    }
  }, 1600);

  // 3. Auto-Login Check (Saved Credentials)
  const savedId = localStorage.getItem('bp_staff_id');
  const savedPin = localStorage.getItem('bp_staff_pin');
  const remember = localStorage.getItem('bp_remember_me');

  if (remember === 'true' && savedId && savedPin) {
    document.getElementById('inputId').value = savedId;
    document.getElementById('inputPin').value = savedPin;
    document.getElementById('rememberMeCheck').checked = true;
    doLogin(true);
  } else {
    setTimeout(() => {
      if (!isLoggedIn) {
        showLoginModal(false);
      }
    }, 1650);
  }
});

// ================= 3. 3-TAB BOTTOM NAVIGATION SYSTEM =================
function navigateTab(tabKey) {
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

  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.add('hidden');
      views[key].classList.remove('active');
    }
    if (buttons[key]) {
      buttons[key].classList.remove('active');
    }
  });

  if (views[tabKey]) {
    views[tabKey].classList.remove('hidden');
    views[tabKey].classList.add('active');
  }
  if (buttons[tabKey]) {
    buttons[tabKey].classList.add('active');
  }

  // Re-trigger smooth bar fill animation when opening Increment tab
  if (tabKey === 'tab-increment') {
    animateIncrementBars();
  }

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

// ================= 5. LOGIN MODAL & PIN TOGGLE =================
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

// ================= 6. AUTHENTICATION & API LOGIN =================
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
  loginBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1"></i> डेटा लोड हो रहा है...`;

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

      // Remember me credentials storage
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

      isLoggedIn = true;
      hideLoginModal();

      // Extract Staff Details & Phone cleanly
      const apiStaff = res.staff || {};
      const rawPhone = apiStaff.phone || apiStaff.mobile || (/^[6-9]\d{9}$/.test(idVal) ? idVal : "");
      const cleanDigits = String(rawPhone).replace(/\D/g, '');
      let detectedPhone = "पंजीकृत सदस्य";
      if (/^[6-9]\d{9}$/.test(cleanDigits)) {
        detectedPhone = `+91 ${cleanDigits}`;
      } else if (/^91[6-9]\d{9}$/.test(cleanDigits)) {
        detectedPhone = `+91 ${cleanDigits.slice(2)}`;
      } else if (rawPhone) {
        detectedPhone = String(rawPhone);
      }

      currentStaff = {
        name: apiStaff.name || idVal,
        id: apiStaff.id || idVal,
        phone: detectedPhone,
        photo: apiStaff.photo || "",
        dob: apiStaff.dob || "",
        joiningDate: apiStaff.joiningDate || apiStaff.joinDate || "",
        joiningDateDisplay: apiStaff.joiningDateDisplay || ""
      };

      // Update Header & Sidebar UI
      document.getElementById('vStaffName').textContent = currentStaff.name;
      document.getElementById('vStaffId').textContent = "ID: " + currentStaff.id;
      document.getElementById('sideStaffName').textContent = currentStaff.name;
      document.getElementById('sideStaffId').textContent = "ID: " + currentStaff.id;

      document.getElementById('headerBadge').classList.remove('hidden');
      document.getElementById('headerBadge').classList.add('flex');
      document.getElementById('sideLoginBtn').classList.add('hidden');
      document.getElementById('sideLogoutBtn').classList.remove('hidden');
      document.getElementById('sideLogoutBtn').classList.add('flex');

      // Populate Months in Dropdown
      globalMonthMap = res.monthDataMap || {};
      globalMonthList = res.monthList || Object.keys(globalMonthMap);

      const mSelect = document.getElementById('monthSelector');
      mSelect.innerHTML = '';
      globalMonthList.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m + (idx === globalMonthList.length - 1 ? ' (चालू)' : '');
        mSelect.appendChild(opt);
      });

      const defaultM = res.defaultMonth;
      mSelect.value = defaultM;
      currentSelectedMonth = defaultM;
      renderMonthData(defaultM);

      // Update Live Increment Progress Bars
      calculateIncrementProgress(res);
      updateIncrementProgress();

      // Update ID Card & Salary Slip Data silently
      syncIdCardData();
      syncSalarySlipData();

      // Default Open Dashboard Tab
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

// ================= 7. RENDER MONTH DATA =================
function onMonthChange(selectedMonth) {
  currentSelectedMonth = selectedMonth;
  renderMonthData(selectedMonth);
  syncIdCardData();
  syncSalarySlipData();
}

function renderMonthData(m) {
  const d = globalMonthMap[m];
  if (!d) return;

  document.getElementById('vPerfMonth').textContent = d.month;
  document.getElementById('vDetailMonth').textContent = d.month;

  // 1. KPI - Naye Grahak
  const totalCust = (d.regList ? d.regList.length : 0) + (d.altList ? d.altList.length : 0);
  document.getElementById('vTotalCust').textContent = totalCust + " ग्राहक";
  document.getElementById('vCustBreakdown').textContent =
    `${d.regList ? d.regList.length : 0} रेगुलर + ${d.altList ? d.altList.length : 0} अल्टरनेटिव`;

  // 2. KPI - Missed Delivery
  const missedCount = d.missedCount || 0;
  document.getElementById('vMissedDeliveries').textContent = missedCount + " शिकायत";
  document.getElementById('vMissedCutText').textContent = "₹" + (d.missedDeliveries || 0) + " कटौती हुई";

  // 3. KPI - Penalty
  document.getElementById('vPenaltyAmount').textContent = "₹" + (d.damagePenalty || 0);

  // 4. KPI - Attendance Record (Full Leave + Half Day सपोर्ट)
  const totalLeave = Number(d.leaveDays || 0);
  const halfDaysCount = d.halfDays !== undefined
    ? Number(d.halfDays)
    : (totalLeave % 1 !== 0 ? 1 : 0);
  const fullLeavesCount = d.fullLeaveDays !== undefined
    ? Number(d.fullLeaveDays)
    : Math.max(0, Math.floor(totalLeave - (halfDaysCount * 0.5)));

  let leaveSummaryText = "";
  if (fullLeavesCount > 0 && halfDaysCount > 0) {
    leaveSummaryText = `${fullLeavesCount} छुट्टी + ${halfDaysCount} हाफ डे`;
  } else if (halfDaysCount > 0) {
    leaveSummaryText = `${halfDaysCount} हाफ डे`;
  } else {
    leaveSummaryText = `${totalLeave} दिन छुट्टी`;
  }

  if (totalLeave === 0 && halfDaysCount === 0) {
    document.getElementById('vAttendancePercent').textContent = "100% हाज़िरी";
    document.getElementById('vAttendanceBonusText').textContent = "+₹200 नकद इनाम मिला";
  } else {
    document.getElementById('vAttendancePercent').textContent = leaveSummaryText;
    document.getElementById('vAttendanceBonusText').textContent =
      (d.attendanceBonus > 0) ? `+₹${d.attendanceBonus} इनाम मिला` : "इनाम के पात्र नहीं";
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

  // Detailed Breakdown (Items 1 to 9)
  document.getElementById('item1').textContent = "₹" + (d.baseSalary || 0).toLocaleString('en-IN');

  // Regular Tanks Accordion List
  document.getElementById('regCountLabel').textContent = `${d.regList ? d.regList.length : 0} टंकी जुड़ीं • सूची देखें ▾`;
  document.getElementById('regTotalAmount').textContent = "+₹" + (d.regIncentiveTotal || 0).toLocaleString('en-IN');
  renderList('regListItems', d.regList);

  // Alternative Tanks Accordion List
  document.getElementById('altCountLabel').textContent = `${d.altList ? d.altList.length : 0} टंकी जुड़ी • सूची देखें ▾`;
  document.getElementById('altTotalAmount').textContent = "+₹" + (d.altIncentiveTotal || 0).toLocaleString('en-IN');
  renderList('altListItems', d.altList);

  document.getElementById('item4').textContent = "+₹" + (d.bookingPercentBonus || 0).toLocaleString('en-IN');
  document.getElementById('item5').textContent = "+₹" + (d.attendanceBonus || 0).toLocaleString('en-IN');
  document.getElementById('item5Desc').textContent = (d.attendanceBonus > 0)
    ? "पात्र (हाज़िरी बोनस)"
    : `अपात्र (${leaveSummaryText})`;

  const perDayRate = (d.baseSalary > 0)
    ? Math.round(d.baseSalary / 30)
    : (totalLeave > 0 && d.leaveCut > 0 ? Math.round(d.leaveCut / totalLeave) : 0);

  const halfDayDates = Array.isArray(d.halfDayList) && d.halfDayList.length > 0
    ? ` (${d.halfDayList.map(h => h.date).join(', ')})`
    : "";

  document.getElementById('item6').textContent = "-₹" + (d.leaveCut || 0).toLocaleString('en-IN');
  document.getElementById('item6Desc').textContent = (totalLeave > 0 || halfDaysCount > 0)
    ? `${leaveSummaryText}${halfDayDates} • कुल ${totalLeave} दिन (@ ₹${perDayRate}/दिन)`
    : `0 दिन अनुपस्थित (@ ₹${perDayRate}/दिन)`;

  document.getElementById('item7').textContent = "-₹" + (d.missedDeliveries || 0).toLocaleString('en-IN');
  document.getElementById('item7Desc').textContent = missedCount > 0 ? `${missedCount} बार पानी छूटा` : "कोई कटौती नहीं";

  document.getElementById('item8').textContent = "-₹" + (d.damagePenalty || 0).toLocaleString('en-IN');
  document.getElementById('item9').textContent = "-₹" + (d.advanceTaken || 0).toLocaleString('en-IN');
}

// Helper: Render Tank List Items
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

// ================= 7B. LIVE INCREMENT PROGRESS BAR SYSTEM =================
function calcMonthsFromJoinDate(dateStr) {
  if (!dateStr) return null;
  const jd = new Date(dateStr);
  if (isNaN(jd.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - jd.getFullYear()) * 12 + (now.getMonth() - jd.getMonth());
  if (now.getDate() >= jd.getDate()) months += 1;
  return Math.max(0, months);
}

function calculateIncrementProgress(apiRes = {}) {
  const apiStaff = apiRes.staff || {};
  const apiInc = apiRes.increment || {};

  // 1. Calculate Service Tenure Months
  let monthsCount = globalMonthList.length;
  if (apiInc.completedMonths !== undefined) {
    monthsCount = Number(apiInc.completedMonths) || 0;
  } else if (apiStaff.completedMonths !== undefined) {
    monthsCount = Number(apiStaff.completedMonths) || 0;
  } else {
    const joinedMonths = calcMonthsFromJoinDate(currentStaff.joiningDate);
    if (joinedMonths !== null) {
      monthsCount = joinedMonths;
    }
  }

  // 2. Calculate Total New Customers (Last 12 Months Cycle)
  let totalNewCustomers = 0;
  if (apiInc.totalCustomers !== undefined) {
    totalNewCustomers = Number(apiInc.totalCustomers) || 0;
  } else if (apiStaff.totalCustomers !== undefined) {
    totalNewCustomers = Number(apiStaff.totalCustomers) || 0;
  } else {
    const cycleMonths = globalMonthList.slice(-12);
    cycleMonths.forEach(mKey => {
      const mData = globalMonthMap[mKey];
      if (mData) {
        const regLen = Array.isArray(mData.regList) ? mData.regList.length : 0;
        const altLen = Array.isArray(mData.altList) ? mData.altList.length : 0;
        totalNewCustomers += regLen + altLen;
      }
    });
  }

  incrementState = {
    customers: Math.max(0, totalNewCustomers),
    months: Math.max(0, monthsCount),
    targetCustomers: 36,
    targetMonths: 12
  };
}

function updateIncrementProgress() {
  const { customers, months, targetCustomers, targetMonths } = incrementState;

  const custPercent = Math.min(100, Math.round((customers / targetCustomers) * 100));
  const custRemaining = Math.max(0, targetCustomers - customers);
  const isCustDone = customers >= targetCustomers;

  const displayMonths = Math.min(targetMonths, months);
  const monthPercent = Math.min(100, Math.round((displayMonths / targetMonths) * 100));
  const monthRemaining = Math.max(0, targetMonths - displayMonths);
  const isMonthDone = months >= targetMonths;

  const overallPercent = Math.round((custPercent + monthPercent) / 2);
  const isEligible = isCustDone && isMonthDone;

  // 1. Overall Status Badge
  const overallBadge = document.getElementById('incOverallBadge');
  if (overallBadge) {
    if (isEligible) {
      overallBadge.textContent = "🎉 पात्र (Eligible)";
      overallBadge.className = "inline-block bg-emerald-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm";
    } else {
      overallBadge.textContent = `प्रगति पर (${overallPercent}%)`;
      overallBadge.className = "inline-block bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm";
    }
  }

  // 2. Customer Target Bar & Text
  const custLabel = document.getElementById('incCustProgressLabel');
  const custBadge = document.getElementById('incCustPercentBadge');
  const custBar = document.getElementById('incCustBar');
  const custHint = document.getElementById('incCustHint');

  if (custLabel) {
    custLabel.textContent = `आपकी वेतन वृद्धि प्रगति: ${customers} / ${targetCustomers} नए ग्राहक पूरे (${custPercent}%)`;
  }
  if (custBadge) {
    custBadge.textContent = `${custPercent}%`;
  }
  if (custBar) {
    custBar.style.width = `${custPercent}%`;
  }
  if (custHint) {
    custHint.textContent = isCustDone
      ? "🎉 बधाई हो! न्यूनतम 36 नए ग्राहकों का लक्ष्य पूरा हुआ"
      : `लक्ष्य पूरा करने के लिए ${custRemaining} नए ग्राहक और जोड़ें`;
  }

  // 3. Service Tenure Bar & Text
  const monthLabel = document.getElementById('incMonthProgressLabel');
  const monthBadge = document.getElementById('incMonthPercentBadge');
  const monthBar = document.getElementById('incMonthBar');
  const monthHint = document.getElementById('incMonthHint');

  if (monthLabel) {
    monthLabel.textContent = months > targetMonths
      ? `सेवाकाल: ${targetMonths} / ${targetMonths} माह पूरे (कुल ${months} माह)`
      : `सेवाकाल: ${displayMonths} / ${targetMonths} माह पूरे`;
  }
  if (monthBadge) {
    monthBadge.textContent = `${monthPercent}%`;
  }
  if (monthBar) {
    monthBar.style.width = `${monthPercent}%`;
  }
  if (monthHint) {
    monthHint.textContent = isMonthDone
      ? "✓ 1 वर्ष (12 माह) का सेवाकाल पूर्ण हुआ"
      : `वार्षिक समीक्षा में ${monthRemaining} माह शेष`;
  }

  // 4. Motivational Summary Strip
  const summaryBox = document.getElementById('incSummaryBox');
  const summaryText = document.getElementById('incSummaryText');
  if (summaryBox && summaryText) {
    if (isEligible) {
      summaryBox.className = "bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center gap-2";
      summaryBox.querySelector('i').className = "fa-solid fa-trophy text-emerald-600 text-sm shrink-0";
      summaryText.className = "text-[10.5px] text-emerald-900 font-bold leading-snug";
      summaryText.textContent = "बधाई हो! आपने दोनों शर्तें पूरी कर ली हैं — आप वार्षिक वेतन वृद्धि (Increment) के लिए पात्र हैं!";
    } else if (isCustDone && !isMonthDone) {
      summaryBox.className = "bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center gap-2";
      summaryBox.querySelector('i').className = "fa-solid fa-clock text-brand-blue text-sm shrink-0";
      summaryText.className = "text-[10.5px] text-slate-700 font-semibold leading-snug";
      summaryText.textContent = `शानदार! आपका ग्राहक लक्ष्य पूरा हो चुका है। बस ${monthRemaining} माह का सेवाकाल पूरा होते ही आप इंक्रीमेंट के पात्र होंगे।`;
    } else if (!isCustDone && isMonthDone) {
      summaryBox.className = "bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2";
      summaryBox.querySelector('i').className = "fa-solid fa-bullseye text-amber-600 text-sm shrink-0";
      summaryText.className = "text-[10.5px] text-amber-900 font-semibold leading-snug";
      summaryText.textContent = `आपका 1 वर्ष सेवाकाल पूर्ण है! सैलरी इंक्रीमेंट के लिए बस ${custRemaining} नए ग्राहक और जोड़ें।`;
    } else {
      const perMonthNeed = monthRemaining > 0 ? Math.max(1, Math.ceil(custRemaining / monthRemaining)) : custRemaining;
      summaryBox.className = "bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center gap-2";
      summaryBox.querySelector('i').className = "fa-solid fa-rocket text-amber-600 text-sm shrink-0";
      summaryText.className = "text-[10.5px] text-amber-900 font-medium leading-snug";
      summaryText.textContent = `हर माह औसतन ${perMonthNeed} नए ग्राहक जोड़कर आप आसानी से वार्षिक वेतन वृद्धि का लक्ष्य पूरा कर सकते हैं!`;
    }
  }

  // 5. Policy Condition Badges (Condition 1 & 2)
  const cond1Badge = document.getElementById('incCond1Badge');
  const cond2Badge = document.getElementById('incCond2Badge');

  if (cond1Badge) {
    if (isMonthDone) {
      cond1Badge.textContent = "✓ पूर्ण";
      cond1Badge.className = "text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap";
    } else {
      cond1Badge.textContent = `${displayMonths} / ${targetMonths} माह`;
      cond1Badge.className = "text-[9px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap";
    }
  }

  if (cond2Badge) {
    if (isCustDone) {
      cond2Badge.textContent = "✓ पूर्ण";
      cond2Badge.className = "text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full whitespace-nowrap";
    } else {
      cond2Badge.textContent = `${customers} / ${targetCustomers} ग्राहक`;
      cond2Badge.className = "text-[9px] bg-blue-100 text-brand-blue font-bold px-2 py-0.5 rounded-full whitespace-nowrap";
    }
  }

  // 6. Dashboard Mini Progress Preview
  const dashPercent = document.getElementById('dashIncPercent');
  const dashBar = document.getElementById('dashIncBar');
  const dashCustText = document.getElementById('dashIncCustText');
  const dashMonthText = document.getElementById('dashIncMonthText');

  if (dashPercent) dashPercent.textContent = isEligible ? "पात्र ✓" : `${custPercent}%`;
  if (dashBar) dashBar.style.width = `${custPercent}%`;
  if (dashCustText) dashCustText.textContent = `${customers} / ${targetCustomers} नए ग्राहक`;
  if (dashMonthText) dashMonthText.textContent = `सेवाकाल: ${displayMonths} / ${targetMonths} माह`;
}

function animateIncrementBars() {
  const custBar = document.getElementById('incCustBar');
  const monthBar = document.getElementById('incMonthBar');
  if (!custBar || !monthBar) return;

  const custTargetW = Math.min(100, Math.round((incrementState.customers / incrementState.targetCustomers) * 100)) + '%';
  const monthTargetW = Math.min(100, Math.round((Math.min(incrementState.targetMonths, incrementState.months) / incrementState.targetMonths) * 100)) + '%';

  custBar.style.width = '0%';
  monthBar.style.width = '0%';

  requestAnimationFrame(() => {
    setTimeout(() => {
      custBar.style.width = custTargetW;
      monthBar.style.width = monthTargetW;
    }, 60);
  });
}

// ================= 8. DIGITAL EMPLOYEE ID CARD SYSTEM =================
function syncIdCardData() {
  const nameEl = document.getElementById('idCardName');
  const idEl = document.getElementById('idCardStaffId');
  const phoneEl = document.getElementById('idCardPhone');
  const dobEl = document.getElementById('idCardDob');
  const joinEl = document.getElementById('idCardJoinDate');
  const monthEl = document.getElementById('idCardMonth');
  const avatarEl = document.getElementById('idCardAvatar');

  if (nameEl) nameEl.textContent = currentStaff.name || "जल मित्र";
  if (idEl) idEl.textContent = currentStaff.id || "BP---";
  if (phoneEl) phoneEl.textContent = currentStaff.phone || "पंजीकृत सदस्य";
  if (dobEl) dobEl.textContent = currentStaff.dob || "----";
  if (joinEl) joinEl.textContent = currentStaff.joiningDateDisplay || "----";
  if (monthEl) monthEl.textContent = currentSelectedMonth || "सत्यापित सदस्य";

  if (avatarEl) {
    avatarEl.src = currentStaff.photo ? currentStaff.photo : "app-icon.png";
    avatarEl.onerror = () => {
      avatarEl.src = "app-icon.png";
    };
  }
}

function openIdCardModal() {
  if (!isLoggedIn) {
    showLoginModal(false);
    return;
  }

  syncIdCardData();
  const modal = document.getElementById('idCardModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }
}

function closeIdCardModal() {
  const modal = document.getElementById('idCardModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
}

// Helper: Generate HD Canvas of ID Card (Clipping-Free Capture)
async function captureIdCardCanvas() {
  if (typeof html2canvas === 'undefined') {
    throw new Error("html2canvas लोड नहीं हुआ, कृपया इंटरनेट जांचें।");
  }

  const cardEl = document.getElementById('digitalIdCardCapture');
  if (!cardEl) {
    throw new Error("ID Card एलिमेंट नहीं मिला।");
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const imgs = Array.from(cardEl.querySelectorAll('img'));
  await Promise.all(
    imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  cardEl.classList.add('id-card-capturing');
  try {
    const canvas = await html2canvas(cardEl, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedCard = clonedDoc.getElementById('digitalIdCardCapture');
        if (clonedCard) {
          clonedCard.style.width = '340px';
          clonedCard.style.maxWidth = '340px';
          clonedCard.style.margin = '0 auto';
          clonedCard.style.transform = 'none';
          clonedCard.style.animation = 'none';
          clonedCard.style.boxShadow = 'none';
        }
        const clonedModalInner = clonedDoc.querySelector('#idCardModal > div');
        if (clonedModalInner) {
          clonedModalInner.style.transform = 'none';
          clonedModalInner.style.animation = 'none';
        }
      }
    });
    return canvas;
  } finally {
    cardEl.classList.remove('id-card-capturing');
  }
}

// Download Digital ID Card as HD PNG
async function downloadIdCard() {
  const btn = document.getElementById('downloadIdBtn');
  const originalHtml = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>बन रहा है...</span>`;

    const canvas = await captureIdCardCanvas();
    const safeId = String(currentStaff.id || 'BP').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `Bharat-Peyjal-ID-${safeId}.png`;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } else {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>सेव हो गया!</span>`;
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }, 1800);
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    alert("ID कार्ड डाउनलोड करने में समस्या आई: " + error.message);
  }
}

// Share Digital ID Card (Image + Proud Caption)
async function shareIdCard() {
  const btn = document.getElementById('shareIdBtn');
  const originalHtml = btn.innerHTML;
  const shareCaption = `🇮🇳 मुझे गर्व है कि मैं *भारत पेयजल (Bharat Peyjal)* परिवार का अधिकृत *जल मित्र* हूँ!\n\n👤 नाम: ${currentStaff.name}\n🆔 Staff ID: ${currentStaff.id}\n💧 शुद्ध पेयजल, स्वस्थ भारत!`;

  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>तैयार हो रहा...</span>`;

    if (typeof html2canvas !== 'undefined' && navigator.share) {
      const canvas = await captureIdCardCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

      if (blob) {
        const safeId = String(currentStaff.id || 'BP').replace(/[^a-zA-Z0-9_-]/g, '');
        const file = new File([blob], `Bharat-Peyjal-ID-${safeId}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'भारत पेयजल - आधिकारिक जल मित्र ID कार्ड',
            text: shareCaption,
            files: [file]
          });
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return;
        }
      }
    }

    if (navigator.share) {
      await navigator.share({
        title: 'भारत पेयजल - जल मित्र ID कार्ड',
        text: shareCaption
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareCaption)}`, '_blank');
    }
  } catch (error) {
    if (error && error.name !== 'AbortError') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareCaption)}`, '_blank');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ================= 9. OFFICIAL SALARY SLIP (PAYSLIP) SYSTEM =================
function syncSalarySlipData() {
  const d = globalMonthMap[currentSelectedMonth] || {};

  const baseSalary = Number(d.baseSalary || 0);
  const regInc = Number(d.regIncentiveTotal || 0);
  const altInc = Number(d.altIncentiveTotal || 0);
  const targetBonus = Number(d.bookingPercentBonus || 0);
  const attBonus = Number(d.attendanceBonus || 0);
  const grossTotal = baseSalary + regInc + altInc + targetBonus + attBonus;

  const leaveCut = Number(d.leaveCut || 0);
  const missedCut = Number(d.missedDeliveries || 0);
  const penaltyCut = Number(d.damagePenalty || 0);
  const advanceCut = Number(d.advanceTaken || 0);
  const totalDeductions = leaveCut + missedCut + penaltyCut + advanceCut;

  const netPay = d.inHand !== undefined ? Number(d.inHand) : (grossTotal - totalDeductions);
  const paid = d.paidAmount !== undefined ? Number(d.paidAmount) : Math.max(0, netPay);
  const due = Math.max(0, netPay - paid);

  const now = new Date();
  const issueDateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('slipMonthBadge', d.month || currentSelectedMonth || "चालू माह");
  setText('slipStaffName', currentStaff.name || "जल मित्र");
  setText('slipStaffId', currentStaff.id || "BP---");

  setText('slipBaseSalary', `₹${baseSalary.toLocaleString('en-IN')}`);
  setText('slipRegIncentive', `+₹${regInc.toLocaleString('en-IN')}`);
  setText('slipAltIncentive', `+₹${altInc.toLocaleString('en-IN')}`);
  setText('slipTargetBonus', `+₹${targetBonus.toLocaleString('en-IN')}`);
  setText('slipAttBonus', `+₹${attBonus.toLocaleString('en-IN')}`);
  setText('slipGrossTotal', `₹${grossTotal.toLocaleString('en-IN')}`);

  setText('slipLeaveCut', `-₹${leaveCut.toLocaleString('en-IN')}`);
  setText('slipMissedCut', `-₹${missedCut.toLocaleString('en-IN')}`);
  setText('slipPenaltyCut', `-₹${penaltyCut.toLocaleString('en-IN')}`);
  setText('slipAdvanceCut', `-₹${advanceCut.toLocaleString('en-IN')}`);
  setText('slipTotalDeductions', `-₹${totalDeductions.toLocaleString('en-IN')}`);

  setText('slipNetPay', `₹${netPay.toLocaleString('en-IN')}`);
  setText('slipPaid', `₹${paid.toLocaleString('en-IN')}`);
  setText('slipDue', `₹${due.toLocaleString('en-IN')}`);
  setText('slipIssueDate', issueDateStr);
}

function openSalarySlipModal() {
  if (!isLoggedIn) {
    showLoginModal(false);
    return;
  }

  syncSalarySlipData();
  const modal = document.getElementById('salarySlipModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }
}

function closeSalarySlipModal() {
  const modal = document.getElementById('salarySlipModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
}

// Close ID Card or Salary Slip modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const idModal = document.getElementById('idCardModal');
    if (idModal && !idModal.classList.contains('hidden')) {
      closeIdCardModal();
    }
    const slipModal = document.getElementById('salarySlipModal');
    if (slipModal && !slipModal.classList.contains('hidden')) {
      closeSalarySlipModal();
    }
  }
});

// Helper: Generate HD Canvas of Salary Slip (Corporate 2-Column Wide Layout)
async function captureSalarySlipCanvas() {
  if (typeof html2canvas === 'undefined') {
    throw new Error("html2canvas लोड नहीं हुआ, कृपया इंटरनेट जांचें।");
  }

  const slipEl = document.getElementById('salarySlipCapture');
  if (!slipEl) {
    throw new Error("Salary Slip एलिमेंट नहीं मिला।");
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const imgs = Array.from(slipEl.querySelectorAll('img'));
  await Promise.all(
    imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  slipEl.classList.add('payslip-capturing');
  try {
    const canvas = await html2canvas(slipEl, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: 800,
      windowHeight: document.documentElement.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedSlip = clonedDoc.getElementById('salarySlipCapture');
        if (clonedSlip) {
          clonedSlip.style.width = '560px';
          clonedSlip.style.maxWidth = '560px';
          clonedSlip.style.margin = '0 auto';
          clonedSlip.style.transform = 'none';
          clonedSlip.style.animation = 'none';
          clonedSlip.style.boxShadow = 'none';
        }
        const clonedModalInner = clonedDoc.querySelector('#salarySlipModal > div');
        if (clonedModalInner) {
          clonedModalInner.style.maxWidth = '560px';
          clonedModalInner.style.transform = 'none';
          clonedModalInner.style.animation = 'none';
        }
      }
    });
    return canvas;
  } finally {
    slipEl.classList.remove('payslip-capturing');
  }
}

// Print / Save PDF or Download HD Payslip
async function downloadOrPrintSalarySlip() {
  const btn = document.getElementById('downloadSlipBtn');
  const originalHtml = btn.innerHTML;

  // Use native print-to-PDF when running in a standard top-level browser tab
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  const isInIframe = window.self !== window.top;

  if (!isStandalone && !isInIframe && typeof window.print === 'function') {
    document.body.classList.add('printing-payslip');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-payslip'), 500);
    }, 80);
    return;
  }

  // Fallback for Installed PWA / Preview / WebView: Save crisp HD PNG
  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>सेव हो रहा है...</span>`;

    const canvas = await captureSalarySlipCanvas();
    const safeId = String(currentStaff.id || 'BP').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeMonth = String(currentSelectedMonth || 'Month').replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `Bharat-Peyjal-Payslip-${safeId}-${safeMonth}.png`;

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } else {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>सेव हो गया!</span>`;
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }, 1800);
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
    alert("सैलरी स्लिप सेव करने में समस्या आई: " + error.message);
  }
}

// Share Salary Slip on WhatsApp (HD Image + Summary Fallback)
async function shareSalarySlip() {
  const btn = document.getElementById('shareSlipBtn');
  const originalHtml = btn.innerHTML;

  const d = globalMonthMap[currentSelectedMonth] || {};
  const monthName = d.month || currentSelectedMonth || "चालू माह";
  const netVal = document.getElementById('slipNetPay')?.textContent || "₹0";
  const grossVal = document.getElementById('slipGrossTotal')?.textContent || "₹0";
  const dedVal = document.getElementById('slipTotalDeductions')?.textContent || "-₹0";
  const paidVal = document.getElementById('slipPaid')?.textContent || "₹0";
  const dueVal = document.getElementById('slipDue')?.textContent || "₹0";

  const shareText =
    `🇮🇳 *भारत पेयजल - आधिकारिक वेतन पर्ची*\n` +
    `📅 माह: ${monthName}\n` +
    `👤 नाम: ${currentStaff.name} (${currentStaff.id})\n` +
    `💰 सकल आय: ${grossVal}\n` +
    `✂️ कुल कटौतियां: ${dedVal}\n` +
    `✅ शुद्ध देय (Net In-Hand): *${netVal}*\n` +
    `🟢 भुगतान हुआ: ${paidVal} | 🟠 बकाया: ${dueVal}`;

  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>तैयार हो रहा...</span>`;

    if (typeof html2canvas !== 'undefined' && navigator.share) {
      const canvas = await captureSalarySlipCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));

      if (blob) {
        const safeId = String(currentStaff.id || 'BP').replace(/[^a-zA-Z0-9_-]/g, '');
        const safeMonth = String(monthName).replace(/[^a-zA-Z0-9_-]/g, '');
        const file = new File([blob], `Bharat-Peyjal-Payslip-${safeId}-${safeMonth}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `भारत पेयजल - वेतन पर्ची (${monthName})`,
            text: shareText,
            files: [file]
          });
          btn.disabled = false;
          btn.innerHTML = originalHtml;
          return;
        }
      }
    }

    if (navigator.share) {
      await navigator.share({
        title: `भारत पेयजल - वेतन पर्ची (${monthName})`,
        text: shareText
      });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  } catch (error) {
    if (error && error.name !== 'AbortError') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ================= 10. LOGOUT ACTION =================
function logout() {
  localStorage.removeItem('bp_staff_id');
  localStorage.removeItem('bp_staff_pin');
  localStorage.removeItem('bp_remember_me');

  isLoggedIn = false;
  closeIdCardModal();
  closeSalarySlipModal();
  document.getElementById('inputPin').value = '';

  currentStaff = {
    name: "अतिथि",
    id: "BP---",
    phone: "पंजीकृत सदस्य",
    photo: "",
    dob: "",
    joiningDate: "",
    joiningDateDisplay: ""
  };

  globalMonthMap = {};
  globalMonthList = [];
  incrementState = {
    customers: 0,
    months: 0,
    targetCustomers: 36,
    targetMonths: 12
  };
  updateIncrementProgress();

  // Reset Profile Text
  document.getElementById('vStaffName').textContent = "नमस्ते, अतिथि";
  document.getElementById('vStaffId').textContent = "ID: BP---";
  document.getElementById('sideStaffName').textContent = "लॉगिन नहीं हैं";
  document.getElementById('sideStaffId').textContent = "ID: ----";

  // Hide badge & show login button
  document.getElementById('headerBadge').classList.add('hidden');
  document.getElementById('headerBadge').classList.remove('flex');
  document.getElementById('sideLoginBtn').classList.remove('hidden');
  document.getElementById('sideLogoutBtn').classList.add('hidden');
  document.getElementById('sideLogoutBtn').classList.remove('flex');

  showLoginModal(false);
}