// === DOM Elements ===
const stockGrid = document.getElementById("stockGrid");
const stockSymbolInput = document.getElementById("stock-symbol");
const orderTypeSelect = document.getElementById("order-type");
const limitPriceGroup = document.getElementById("limitPriceGroup");
const limitPriceInput = document.getElementById("limit-price");
const quantityInput = document.getElementById("quantity");
const priceInput = document.getElementById("price");
const totalInput = document.getElementById("total");
const pinInput = document.getElementById("pin");
const buyBtn = document.getElementById("buyBtn");
const sellBtn = document.getElementById("sellBtn");
const portfolioStocks = document.getElementById("portfolioStocks");
const portfolioValue = document.getElementById("portfolioValue");
const portfolioChange = document.getElementById("portfolioChange");

// === Stock Data ===
const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", price: 189.37, change: 2.34 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 420.72, change: -1.15 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 153.58, change: 0.89 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.75, change: -3.22 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 172.63, change: 5.67 },
  { symbol: "META", name: "Meta Platforms", price: 485.58, change: 1.45 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 903.63, change: 12.34 },
  { symbol: "JPM", name: "JPMorgan Chase", price: 198.34, change: -0.56 },
  { symbol: "V", name: "Visa Inc.", price: 275.91, change: 0.23 },
  { symbol: "WMT", name: "Walmart Inc.", price: 59.83, change: -1.12 },
];

// === User Data ===
let currentUserId = null;
let currentUser = null;
let selectedStock = null;

// === On Page Load ===
document.addEventListener("DOMContentLoaded", () => {
  verifySession();
  renderStockGrid();
  renderPortfolio();
  updatePortfolioSummary();

  orderTypeSelect.addEventListener("change", toggleLimitPrice);
  quantityInput.addEventListener("input", updateTotal);
  buyBtn.addEventListener("click", placeBuyOrder);
  sellBtn.addEventListener("click", placeSellOrder);
});

// === Session Functions ===
function verifySession() {
  currentUserId = localStorage.getItem("stockviz_loggedInUser");
  const allUsers = JSON.parse(localStorage.getItem("stockviz_users")) || {};

  if (!currentUserId || !allUsers[currentUserId]) {
    alert("You must be logged in to access Trade page.");
    window.location.href = "login.html";
    return;
  }

  const user = allUsers[currentUserId];
  const enteredPin = prompt("Enter your 4-digit Security PIN:");

  if (enteredPin === null) {
    window.location.href = "index.html";
    return;
  }

  if (enteredPin !== user.pin) {
    alert("Incorrect PIN. Redirecting to login page.");
    window.location.href = "login.html";
    return;
  }

  currentUser = {
    pin: user.pin,
    balance: user.balance !== undefined ? user.balance : 10000,
    portfolio: user.portfolio || {},
  };

  saveUserData();

  const welcomeArea = document.getElementById("welcomeArea");
  if (welcomeArea) {
    welcomeArea.innerHTML = `Welcome back, <strong>${currentUserId}</strong>`;
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("stockviz_loggedInUser");
      window.location.href = "login.html";
    });
  }
}

function saveUserData() {
  const allUsers = JSON.parse(localStorage.getItem("stockviz_users")) || {};
  allUsers[currentUserId] = {
    pin: currentUser.pin,
    balance: currentUser.balance,
    portfolio: currentUser.portfolio,
  };
  localStorage.setItem("stockviz_users", JSON.stringify(allUsers));
}

// === Stock Grid Functions ===
function renderStockGrid() {
  stockGrid.innerHTML = "";

  stocks.forEach((stock) => {
    const card = document.createElement("div");
    card.className = "stock-card";
    card.innerHTML = `
      <div class="stock-symbol">${stock.symbol}</div>
      <div class="stock-name">${stock.name}</div>
      <div class="stock-price">$${stock.price.toFixed(2)}</div>
      <div class="stock-change ${stock.change >= 0 ? "positive" : "negative"}">
        ${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%
      </div>
    `;
    card.addEventListener("click", () => selectStock(stock, card));
    stockGrid.appendChild(card);
  });
}

function selectStock(stock, cardElement) {
  document
    .querySelectorAll(".stock-card")
    .forEach((card) => card.classList.remove("selected"));
  cardElement.classList.add("selected");

  selectedStock = stock;
  stockSymbolInput.value = stock.symbol;
  priceInput.value = stock.price.toFixed(2);
  updateTotal();
}

// === Trade Form Functions ===
function toggleLimitPrice() {
  if (orderTypeSelect.value === "limit") {
    limitPriceGroup.style.display = "block";
    limitPriceInput.value = selectedStock ? selectedStock.price.toFixed(2) : "";
  } else {
    limitPriceGroup.style.display = "none";
    limitPriceInput.value = "";
  }
  updateTotal();
}

function updateTotal() {
  if (!selectedStock) return;

  const quantity = parseInt(quantityInput.value) || 0;
  const price =
    orderTypeSelect.value === "limit" && limitPriceInput.value
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;

  totalInput.value = (quantity * price).toFixed(2);
}

// === Trade Actions ===
function placeBuyOrder() {
  if (!validateTrade()) return;

  const quantity = parseInt(quantityInput.value);
  const price =
    orderTypeSelect.value === "limit"
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;
  const totalCost = quantity * price;

  if (currentUser.balance < totalCost) {
    alert("Insufficient balance to complete this purchase.");
    return;
  }

  const holding = currentUser.portfolio[selectedStock.symbol] || {
    shares: 0,
    avgPrice: 0,
  };
  const newTotalShares = holding.shares + quantity;
  const newAvgPrice =
    (holding.shares * holding.avgPrice + quantity * price) / newTotalShares;

  currentUser.portfolio[selectedStock.symbol] = {
    shares: newTotalShares,
    avgPrice: newAvgPrice,
  };

  currentUser.balance -= totalCost;

  saveUserData();
  renderPortfolio();
  updatePortfolioSummary();
  resetTradeForm();

  alert(
    `Bought ${quantity} shares of ${selectedStock.symbol} at $${price.toFixed(
      2
    )} each.`
  );
}

function placeSellOrder() {
  if (!validateTrade()) return;

  const quantity = parseInt(quantityInput.value);
  const price =
    orderTypeSelect.value === "limit"
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;
  const totalValue = quantity * price;

  const holding = currentUser.portfolio[selectedStock.symbol];

  if (!holding || holding.shares < quantity) {
    alert(`You don't have enough shares of ${selectedStock.symbol} to sell.`);
    return;
  }

  holding.shares -= quantity;
  if (holding.shares === 0) {
    delete currentUser.portfolio[selectedStock.symbol];
  }

  currentUser.balance += totalValue;

  saveUserData();
  renderPortfolio();
  updatePortfolioSummary();
  resetTradeForm();

  alert(
    `Sold ${quantity} shares of ${selectedStock.symbol} at $${price.toFixed(
      2
    )} each.`
  );
}

function validateTrade() {
  if (!selectedStock) {
    alert("Please select a stock first.");
    return false;
  }

  const quantity = parseInt(quantityInput.value);
  if (!quantity || quantity <= 0) {
    alert("Please enter a valid quantity (minimum 1 share).");
    return false;
  }

  if (
    orderTypeSelect.value === "limit" &&
    (!limitPriceInput.value || parseFloat(limitPriceInput.value) <= 0)
  ) {
    alert("Please enter a valid limit price.");
    return false;
  }

  if (pinInput.value !== currentUser.pin) {
    alert("Incorrect PIN entered!");
    return false;
  }

  return true;
}

// === Portfolio Functions ===
function renderPortfolio() {
  portfolioStocks.innerHTML = "";

  if (
    !currentUser.portfolio ||
    Object.keys(currentUser.portfolio).length === 0
  ) {
    portfolioStocks.innerHTML = `<p class="empty-portfolio">No holdings yet. Start trading!</p>`;
    return;
  }

  Object.entries(currentUser.portfolio).forEach(([symbol, holding]) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    const currentPrice = stock ? stock.price : holding.avgPrice;
    const currentValue = holding.shares * currentPrice;
    const profitLoss = currentValue - holding.shares * holding.avgPrice;

    const item = document.createElement("div");
    item.className = "portfolio-item";
    item.innerHTML = `
      <div>
        <div class="portfolio-symbol">${symbol}</div>
        <div class="portfolio-shares">${holding.shares} shares</div>
      </div>
      <div>
        <div class="portfolio-amount">$${currentValue.toFixed(2)}</div>
        <div class="portfolio-pl ${profitLoss >= 0 ? "positive" : "negative"}">
          ${profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
        </div>
      </div>
    `;
    portfolioStocks.appendChild(item);
  });
}

function updatePortfolioSummary() {
  let total = 0;
  let originalInvestment = 0;

  Object.entries(currentUser.portfolio || {}).forEach(([symbol, holding]) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    const currentPrice = stock ? stock.price : holding.avgPrice;
    total += holding.shares * currentPrice;
    originalInvestment += holding.shares * holding.avgPrice;
  });

  const change = total - originalInvestment;

  portfolioValue.innerText = `$${total.toFixed(2)}`;
  portfolioChange.innerText = `${change >= 0 ? "+" : ""}${change.toFixed(2)}`;
  portfolioChange.className = change >= 0 ? "positive" : "negative";
}

function resetTradeForm() {
  quantityInput.value = "";
  limitPriceInput.value = "";
  totalInput.value = "";
  pinInput.value = "";
}
