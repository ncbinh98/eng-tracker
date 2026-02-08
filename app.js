/**
 * ENG_CORE v2 Logic
 * Multi-book English Tracker with Streak Engine
 */

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

const elements = {
  bookForm: document.getElementById("book-form"),
  bookTitle: document.getElementById("book-title"),
  bookUnits: document.getElementById("book-units"),
  bookList: document.getElementById("book-list"),
  bookSelect: document.getElementById("book-select"),
  checkinUnit: document.getElementById("checkin-unit"),
  checkinBtn: document.getElementById("checkin-btn"),
  streakVal: document.getElementById("streak-val"),
  totalUnitsVal: document.getElementById("total-units-val"),
  calendar: document.getElementById("calendar"),
  loader: document.getElementById("loader"),
};

let appData = { books: [], progress: [] };

// Initialize
document.addEventListener("DOMContentLoaded", fetchData);

// Global click to clear tooltips (Touch support)
document.addEventListener("click", (e) => {
  if (!e.target.closest(".day-dot")) {
    document.querySelectorAll(".day-dot.active").forEach((el) => el.classList.remove("active"));
  }
});

// Add Book
elements.bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = elements.bookTitle.value;
  const units = elements.bookUnits.value;
  const btn = elements.bookForm.querySelector("button");

  setButtonLoading(btn, true);
  await sendRequest({ action: "create_book", title, units });
  elements.bookTitle.value = "";
  elements.bookUnits.value = "";
  await fetchData();
  setButtonLoading(btn, false);
});

// Check-in
elements.checkinBtn.addEventListener("click", async () => {
  const bookId = elements.bookSelect.value;
  const unitNumber = elements.checkinUnit.value;

  if (!bookId) return alert("Please select a book first");
  if (!unitNumber) return alert("Please enter a unit number");

  setButtonLoading(elements.checkinBtn, true);
  await sendRequest({ action: "check_in", bookId, unitNumber: unitNumber });
  elements.checkinUnit.value = "";
  await fetchData();
  setButtonLoading(elements.checkinBtn, false);
});

async function fetchData() {
  renderHeatmapLoading();
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    appData = data;
    renderAll();
  } catch (error) {
    console.error("Fetch Error:", error);
    // Optional: Show error toast
  }
}

function renderHeatmapLoading() {
  elements.calendar.innerHTML = "";
  for (let i = 0; i < 35; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day-dot loading";
    elements.calendar.appendChild(dayDiv);
  }
}

async function sendRequest(payload) {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await new Promise((r) => setTimeout(r, 2000)); // Delay for GAS consistency
  } catch (error) {
    console.error("Request Error:", error);
  }
}

function setButtonLoading(btn, isLoading) {
  if (isLoading) {
    if (!btn.dataset.originalText) btn.dataset.originalText = btn.innerHTML; // Store HTML to keep SVG icons if any
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Processing...`;
  } else {
    btn.innerHTML = btn.dataset.originalText;
    btn.disabled = false;
  }
}

function renderAll() {
  renderBooks();
  renderCalendar();
  renderStats();
}

function renderBooks() {
  elements.bookList.innerHTML = "";
  elements.bookSelect.innerHTML = '<option value="">Select a book...</option>';

  // Sort books by newest first if possible, or just keep order
  appData.books.forEach((book) => {
    // List Card
    const div = document.createElement("div");
    div.className =
      "premium-card p-4 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all duration-200";
    div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-1.5 h-8 bg-slate-800 rounded-full group-hover:bg-orange-500 transition-colors shrink-0"></div>
                <div class="min-w-0">
                    <h4 class="text-sm font-semibold text-white truncate pr-2">${book.title}</h4>
                    <p class="text-xs font-medium text-slate-500 mt-0.5">${book.units} Units</p>
                </div>
            </div>
            <button class="text-slate-600 hover:text-red-400 p-2 transition-colors active:scale-95 shrink-0" onclick="deleteBook('${book.id}')" title="Delete Book">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        `;
    elements.bookList.appendChild(div);

    // Select Option
    const opt = document.createElement("option");
    opt.value = book.id;
    opt.textContent = book.title;
    elements.bookSelect.appendChild(opt);
  });
}

function renderCalendar() {
  elements.calendar.innerHTML = "";
  const today = new Date();

  // Use local date formatting (YYYY-MM-DD) based on user's browser time (GMT+7)
  const getLocalISODate = (date) => {
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10);
  };

  const todayStr = getLocalISODate(today);
  const dayCount = 28;

  // Aggregate data by date
  const activityMap = {};
  appData.progress.forEach((p) => {
    // Parse the stored date string securely
    const dateObj = new Date(p.date);
    const dStr = getLocalISODate(dateObj); // Convert stored date to local context

    if (!activityMap[dStr]) activityMap[dStr] = [];

    // Find book title (handle potential case sensitivity in ID if needed)
    const book = appData.books.find((b) => String(b.id) === String(p.bookid));
    const title = book ? book.title : "Unknown Book";

    activityMap[dStr].push({ title, unit: p.unitnumber });
  });

  // Render last 35 days (5 weeks)
  for (let i = 34; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = getLocalISODate(d);

    const dayDiv = document.createElement("div");
    const activities = activityMap[dateStr] || [];
    const count = activities.length;

    // Heatmap Level
    let level = 0;
    if (count > 0) level = 1;
    if (count > 2) level = 2;
    if (count > 4) level = 3;

    dayDiv.className = "day-dot group";
    dayDiv.dataset.level = level;
    if (dateStr === todayStr) dayDiv.classList.add("today");

    // Touch Support: Toggle tooltip on click
    dayDiv.addEventListener("click", (e) => {
      e.stopPropagation();
      const isActive = dayDiv.classList.contains("active");
      document.querySelectorAll(".day-dot.active").forEach((el) => el.classList.remove("active"));
      if (!isActive) dayDiv.classList.add("active");
    });

    // Tooltip HTML
    let tooltipHTML = `<div class="font-bold border-b border-white/10 pb-1 mb-1">${dateStr}</div>`;
    if (count === 0) {
      tooltipHTML += `<div class="text-slate-400">No activity</div>`;
    } else {
      // Group by book for cleaner tooltip
      const countsByBook = {};
      activities.forEach((a) => {
        countsByBook[a.title] = (countsByBook[a.title] || 0) + 1;
      });

      Object.entries(countsByBook).forEach(([title, num]) => {
        tooltipHTML += `<div class="flex justify-between gap-3 text-slate-300"><span>${title}</span> <span class="text-orange-400 font-bold">${num}u</span></div>`;
      });
    }

    dayDiv.innerHTML = `<div class="tooltip">${tooltipHTML}</div>`;
    elements.calendar.appendChild(dayDiv);
  }
}

function renderStats() {
  elements.totalUnitsVal.textContent = appData.progress.length;
  elements.streakVal.textContent = calculateStreak(appData.progress);
}

function calculateStreak(progress) {
  if (!progress.length) return 0;

  // Helper to get consistent local date string YYYY-MM-DD
  const getLocalISODate = (dateInput) => {
    const date = new Date(dateInput);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 10);
  };

  // Get unique dates sorted descending
  const dates = [...new Set(progress.map((p) => getLocalISODate(p.date)))].sort().reverse();

  const today = new Date();
  const todayStr = getLocalISODate(today);

  // Calculate yesterday properly handling month/year boundaries
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalISODate(yesterday);

  // If no activity today or yesterday, streak is broken
  if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

  let streak = 0;
  // Check consecutive days backwards
  let checkDate = new Date(today);

  // If the streak starts from yesterday, adjust check pointer
  if (dates[0] === yesterdayStr) {
    checkDate = new Date(yesterday);
  }

  // Simple iteration: verify if "checkDate" exists in our data, then move back 1 day
  while (true) {
    const checkStr = getLocalISODate(checkDate);
    if (dates.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

window.deleteBook = async (id) => {
  if (confirm("DELETE_THIS_BOOK?")) {
    await sendRequest({ action: "delete_book", id });
    await fetchData();
  }
};

function toggleLoading(show) {
  elements.loader.classList.toggle("hidden", !show);
}
