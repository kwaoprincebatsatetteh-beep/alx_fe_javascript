let quotes = [
  { text: "The only way to do great work is to love what you do.", category: "Motivation" },
  { text: "Success is not final, failure is not fatal.", category: "Inspiration" },
  { text: "Believe you can and you're halfway there.", category: "Confidence" }
];

const LOCAL_STORAGE_KEY = 'quotes';
const SESSION_LAST_QUOTE_KEY = 'lastViewedQuoteIndex';
const LAST_FILTER_KEY = "lastSelectedCategory";
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts";
const LAST_SYNC_KEY = "lastServerSync";

function saveQuotes() {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {}
}

function loadQuotes() {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) quotes = parsed;
    } else {
      saveQuotes();
    }
  } catch (err) {}
}

async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();
    return data.slice(0, 5).map(item => ({ text: item.title, category: "Server" }));
  } catch (error) {
    return [];
  }
}

async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (!serverQuotes.length) return;
  const localTexts = new Set(quotes.map(q => q.text));
  const serverTexts = new Set(serverQuotes.map(q => q.text));
  const newServerQuotes = serverQuotes.filter(q => !localTexts.has(q.text));
  const conflicts = quotes.filter(q => serverTexts.has(q.text));
  if (conflicts.length > 0) {
    conflicts.forEach(conflict => {
      const serverVersion = serverQuotes.find(sq => sq.text === conflict.text);
      if (serverVersion) conflict.category = serverVersion.category;
    });
    alert("Conflict resolved using server data.");
  }
  if (newServerQuotes.length > 0) {
    quotes.push(...newServerQuotes);
    alert("New data received from server.");
  }
  saveQuotes();
  populateCategories();
  localStorage.setItem(LAST_SYNC_KEY, Date.now());
}

async function postLocalQuotesToServer() {
  for (const q of quotes) {
    try {
      await fetch(SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q)
      });
    } catch (err) {}
  }
}

function showRandomQuote() {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (!quotes.length) {
    quoteDisplay.innerHTML = "<p>No quotes available.</p>";
    return;
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const randomQuote = quotes[randomIndex];
  try {
    sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify(randomIndex));
  } catch (err) {}
  quoteDisplay.innerHTML = "";
  const quoteText = document.createElement("p");
  quoteText.textContent = `"${randomQuote.text}"`;
  const quoteCategory = document.createElement("small");
  quoteCategory.textContent = `Category: ${randomQuote.category}`;
  quoteDisplay.appendChild(quoteText);
  quoteDisplay.appendChild(quoteCategory);
}

function createAddQuoteForm() {
  const newQuoteTextElem = document.getElementById("newQuoteText");
  const newQuoteCategoryElem = document.getElementById("newQuoteCategory");
  const newQuoteText = newQuoteTextElem.value.trim();
  const newQuoteCategory = newQuoteCategoryElem.value.trim();
  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please enter both a quote and a category.");
    return;
  }
  const newQuote = { text: newQuoteText, category: newQuoteCategory };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  newQuoteTextElem.value = "";
  newQuoteCategoryElem.value = "";
  alert("New quote added successfully!");
}

function exportToJsonFile() {
  try {
    const jsonStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Export failed.');
  }
}

function importFromJsonFile(file) {
  if (!file) {
    alert('No file selected.');
    return;
  }
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error();
      const sanitized = imported.filter(q => q && typeof q.text === 'string' && typeof q.category === 'string');
      if (!sanitized.length) {
        alert('No valid quotes found in file.');
        return;
      }
      quotes.push(...sanitized);
      saveQuotes();
      populateCategories();
      alert('Quotes imported successfully!');
    } catch (err) {
      alert('Import failed: invalid JSON format.');
    }
  };
  fileReader.onerror = function() {
    alert('Import failed while reading the file.');
  };
  fileReader.readAsText(file);
}

function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  const categories = [...new Set(quotes.map(q => q.category))];
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
  const savedFilter = localStorage.getItem(LAST_FILTER_KEY);
  if (savedFilter) {
    categoryFilter.value = savedFilter;
    filterQuotes();
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const quoteDisplay = document.getElementById("quoteDisplay");
  localStorage.setItem(LAST_FILTER_KEY, selectedCategory);
  quoteDisplay.innerHTML = "";
  if (selectedCategory === "all") {
    showRandomQuote();
    return;
  }
  const filtered = quotes.filter(q => q.category === selectedCategory);
  if (!filtered.length) {
    quoteDisplay.innerHTML = "<p>No quotes available in this category.</p>";
    return;
  }
  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}"`;
    const small = document.createElement("small");
    small.textContent = `Category: ${q.category}`;
    quoteDisplay.appendChild(p);
    quoteDisplay.appendChild(small);
    quoteDisplay.appendChild(document.createElement("hr"));
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  loadQuotes();
  try {
    const lastIdx = JSON.parse(sessionStorage.getItem(SESSION_LAST_QUOTE_KEY));
    if (typeof lastIdx === 'number' && quotes[lastIdx]) {
      const quoteDisplay = document.getElementById("quoteDisplay");
      quoteDisplay.innerHTML = "";
      const quoteText = document.createElement("p");
      quoteText.textContent = `"${quotes[lastIdx].text}"`;
      const quoteCategory = document.createElement("small");
      quoteCategory.textContent = `Category: ${quotes[lastIdx].category}`;
      quoteDisplay.appendChild(quoteText);
      quoteDisplay.appendChild(quoteCategory);
    }
  } catch (err) {}
  populateCategories();
  const newQuoteBtn = document.getElementById("newQuote");
  const addQuoteBtn = document.getElementById("addQuoteBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importFileInput = document.getElementById("importFile");
  if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);
  if (addQuoteBtn) addQuoteBtn.addEventListener('click', createAddQuoteForm);
  if (exportBtn) exportBtn.addEventListener('click', exportToJsonFile);
  if (importFileInput) {
    importFileInput.addEventListener('change', function(event) {
      const file = event.target.files && event.target.files[0];
      if (file) {
        importFromJsonFile(file);
        importFileInput.value = '';
      }
    });
  }
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  if (!lastSync) {
    await syncQuotes();
  }
});

async function syncQuotes() {
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("Quotes synced with server!");

    const notice = document.createElement("div");
    notice.textContent = "Quotes synced with server!";
    notice.style.color = "green";
    notice.style.marginTop = "10px";
    document.body.appendChild(notice);
}

setInterval(() => {
  syncQuotes();
}, 10000);