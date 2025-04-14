const welcomeArea = document.getElementById("welcomeArea");
const logoutArea = document.getElementById("logoutArea");
const loggedInUser = localStorage.getItem("stockviz_loggedInUser");

if (loggedInUser) {
  welcomeArea.textContent = `Welcome, ${loggedInUser}`;
  logoutArea.innerHTML = `
    <button id="logoutBtn" style="
      background: var(--light-green);
      color: white;
      border: none;
      padding: 8px 16px;
      font-size: 0.95rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    ">Logout</button>
  `;

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("stockviz_loggedInUser");
    window.location.reload();
  });
} else {
  welcomeArea.innerHTML = `
    <a href="login.html" style="margin-right: 1rem; font-size: 0.95rem; color: white; text-decoration: none;">Login</a>
    <a href="signup.html" style="background: var(--light-green); padding: 8px 16px; border-radius: 6px; color: white; font-weight: 600; text-decoration: none;">Sign Up</a>
  `;
  logoutArea.innerHTML = ``; // Keep empty
}

document.addEventListener("DOMContentLoaded", function () {
  loadStockGrid();
  setupModal();
});

function loadStockGrid() {
  const gridContainer = document.getElementById("stockGrid");
  gridContainer.innerHTML = "";

  stocks.forEach((stock) => {
    const stockCard = document.createElement("div");
    stockCard.className = "stock-card";
    stockCard.innerHTML = `
        <div class="stock-symbol">${stock.symbol}</div>
        <div class="stock-name">${stock.name}</div>
        <div class="stock-price">$${stock.price.toFixed(2)}</div>
        <div class="stock-change ${
          stock.change >= 0 ? "positive" : "negative"
        }">
          ${stock.change >= 0 ? "+" : ""}${stock.change}%
        </div>
      `;

    stockCard.addEventListener("click", () => openChartModal(stock.symbol));
    gridContainer.appendChild(stockCard);
  });
}

function setupModal() {
  const modal = document.getElementById("chartModal");
  const closeBtn = document.querySelector(".close-btn");
  const timeFilterBtns = document.querySelectorAll(".time-filters button");

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  timeFilterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      timeFilterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");

      const range = this.getAttribute("data-range");
      updateChart(range);
    });
  });
}

function openChartModal(symbol) {
  const modal = document.getElementById("chartModal");
  const stockTitle = document.getElementById("stockTitle");
  stockTitle.textContent = symbol;
  modal.style.display = "flex";

  updateChart("1M", symbol);
}

function updateChart(range = "1M", symbol = null) {
  const currentSymbol =
    symbol || document.getElementById("stockTitle").textContent;

  fetchStockData(currentSymbol, range).then((data) => {
    if (!data.labels.length) {
      console.warn("No data found for", currentSymbol);
      return;
    }

    const ctx = document.getElementById("stockChart").getContext("2d");

    if (window.stockChart instanceof Chart) {
      window.stockChart.destroy();
    }

    window.stockChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Stock Price",
            data: data.prices,
            borderColor: "#4CAF50",
            backgroundColor: "rgba(76, 175, 80, 0.1)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: getChartOptions(),
    });
  });
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          callback: function (value) {
            return "$" + value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 30,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };
}

async function fetchStockData(symbol, range = "1M") {
  try {
    const response = await fetch(`/stock-data-csv-files/${symbol}_processed.csv`);
    if (!response.ok) {
      throw new Error(`Failed to load data for ${symbol}`);
    }

    const csvData = await response.text();
    const rows = csvData.split("\n").filter((row) => row.trim() !== "");
    const headers = rows[0].split(",").map((h) => h.trim());
    const data = rows
      .slice(1)
      .map((row) => {
        const values = row.split(",");
        const item = {};
        headers.forEach((header, index) => {
          if (header === "Date") {
            item[header] = values[index];
          } else {
            item[header] = parseFloat(values[index]);
          }
        });
        return item;
      })
      .filter((item) => !isNaN(item.Close));

    const filteredData = filterDataByRange(data, range);
    const labels = filteredData.map((item) => formatDate(item.Date, range));
    const prices = filteredData.map((item) => item.Close);

    return { labels, prices, rawData: filteredData };
  } catch (error) {
    console.error("Error loading stock data:", error);
    return { labels: [], prices: [], rawData: [] };
  }
}

function filterDataByRange(data, range) {
  if (!data || data.length === 0) return [];

  const latestDate = new Date(data[data.length - 1].Date);
  let cutoffDate;

  switch (range) {
    case "1M":
      cutoffDate = new Date(latestDate);
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
      break;
    case "1Y":
      cutoffDate = new Date(latestDate);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
      break;
    case "5Y":
      cutoffDate = new Date(latestDate);
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
      break;
    case "MAX":
      return data;
    default:
      cutoffDate = new Date(latestDate);
      cutoffDate.setMonth(cutoffDate.getMonth() - 1);
  }

  return data.filter((item) => {
    const itemDate = new Date(item.Date);
    return itemDate >= cutoffDate;
  });
}

function formatDate(dateString, range) {
  const date = new Date(dateString);

  switch (range) {
    case "1M":
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "1Y":
      return date.toLocaleDateString("en-US", { month: "short" });
    case "5Y":
    case "MAX":
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    default:
      return date.toLocaleDateString();
  }
}

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.37, change: 1.31 },
  { symbol: "ADBE", name: "Adobe Inc.", price: 329.43, change: 0.85 },
  {
    symbol: "BAC",
    name: "Bank of America Corp.",
    price: 135.21,
    change: -0.42,
  },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 128.45, change: -1.87 },
  { symbol: "CRM", name: "SalesForce Inc.", price: 156.78, change: 0.65 },
  { symbol: "CSCO", name: "Cisco Systems Inc.", price: 156.78, change: 0.65 },
  { symbol: "DIS", name: "Walt Disney Co.", price: 156.78, change: 0.65 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 156.78, change: 0.65 },
  { symbol: "HD", name: "Home Depot Inc.", price: 156.78, change: 0.65 },
  { symbol: "INTC", name: "Intel Corp.", price: 156.78, change: 0.65 },
  { symbol: "JNJ", name: "Johnson & Johnson", price: 156.78, change: 0.65 },
  { symbol: "JPM", name: "JPMorgan Chase", price: 156.78, change: 0.65 },
  { symbol: "KO", name: "Coca Cola Co.", price: 156.78, change: 0.65 },
  { symbol: "MA", name: "Mastercard Inc.", price: 156.78, change: 0.65 },
  { symbol: "META", name: "Meta Platforms", price: 287.34, change: -0.98 },
  { symbol: "MSFT", name: "Microsoft Corp", price: 287.34, change: -0.98 },
  { symbol: "NFLX", name: "Netflix Inc.", price: 287.34, change: -0.98 },
  { symbol: "NVDA", name: "NVIDIA Corp", price: 462.34, change: 3.45 },
  { symbol: "PFE", name: "Pfizer Inc.", price: 462.34, change: 3.45 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 245.18, change: 2.87 },
  {
    symbol: "UNH",
    name: "UnitedHealth Group Inc.",
    price: 156.78,
    change: 0.65,
  },
  { symbol: "V", name: "Visa Inc.", price: 462.34, change: 3.45 },
  { symbol: "WMT", name: "Walmart Inc.", price: 462.34, change: 3.45 },
  { symbol: "XOM", name: "Exxon Mobil Corp", price: 462.34, change: 3.45 },
  { symbol: "PG", name: "Procter & Gamble", price: 462.34, change: 3.45 },
];
