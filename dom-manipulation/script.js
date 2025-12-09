// ---------------------------
// INITIAL DATA + LOCAL STORAGE
// ---------------------------

let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "Believe in yourself", category: "Motivation" },
  { text: "Patience is power", category: "Wisdom" }
];

function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// ---------------------------
// POPULATE CATEGORIES
// ---------------------------
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;

  const categories = [...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  // Restore last saved category
  const savedCategory = localStorage.getItem("selectedCategory");
  if (savedCategory) {
    categoryFilter.value = savedCategory;
    filterQuotes();
  }
}

// ---------------------------
// RANDOM QUOTE
// ---------------------------
function showRandomQuote() {
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quoteDisplay").textContent =
    `"${random.text}" — (${random.category})`;

  sessionStorage.setItem("lastViewedQuote", JSON.stringify(random));
}

document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// ---------------------------
// ADD NEW QUOTE
// ---------------------------
function syncQuotes() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please fill both fields!");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  alert("Quote added!");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// ---------------------------
// FILTER QUOTES
// ---------------------------
function filterQuotes() {
  const selected = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selected);

  if (selected === "all") {
    document.getElementById("quoteDisplay").textContent = "Showing all quotes.";
    return;
  }

  const filtered = quotes.filter(q => q.category === selected);

  document.getElementById("quoteDisplay").textContent =
    filtered.length
      ? `"${filtered[0].text}" — (${filtered[0].category})`
      : "No quotes in this category.";
}

// ---------------------------
// JSON EXPORT
// ---------------------------
function exportToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "quotes.json";
  a.click();

  URL.revokeObjectURL(url);
}

// ---------------------------
// JSON IMPORT
// ---------------------------
function importFromJsonFile(event) {
  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    alert("Quotes imported successfully!");
  };

  fileReader.readAsText(event.target.files[0]);
}

// ---------------------------
// SERVER SYNC SIMULATION
// ---------------------------
async function postQuoteToServer(quote) {
  try {
    const res = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
      "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
});
  const data = await res.json();
    console.log("Quote posted to server:", data);
  } catch (err) {
  console.error("POST failed", err);
}
}

async function fetchQuotesFromServer() {
  try {
    const serverData = await fetch("https://jsonplaceholder.typicode.com/posts")
      .then(res => res.json());

    // Convert fake server data into quote objects
    const serverQuotes = serverData.slice(0, 5).map(post => ({
      text: post.title,
      category: "Server"
    }));

    // Server takes precedence
    quotes = [...serverQuotes, ...quotes];
    saveQuotes();
    populateCategories();

    alert("Quotes synced with server!");

  } catch (err) {
    console.log("Server sync failed:", err);
  }
}

// Sync every 30 seconds
setInterval(fetchQuotesFromServer, 30000);

// ---------------------------
// INITIAL SETUP
// ---------------------------
populateCategories();
showRandomQuote();



