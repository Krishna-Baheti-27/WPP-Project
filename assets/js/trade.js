// trade.js - Stock Trading System with Local Storage

// DOM Elements
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

// Sample stock data
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

// Current user data
let currentUser = null;
let selectedStock = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in (simplified for demo)
  currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please login first");
    window.location.href = "index.html";
    return;
  }

  // Initialize UI
  renderStockGrid();
  renderPortfolio();
  updatePortfolioSummary();

  // Event listeners
  orderTypeSelect.addEventListener("change", toggleLimitPrice);
  quantityInput.addEventListener("input", updateTotal);
  buyBtn.addEventListener("click", placeBuyOrder);
  sellBtn.addEventListener("click", placeSellOrder);
});

// Get current user from localStorage
function getCurrentUser() {
  const username = "john123"; // In a real app, this would come from login/session
  const users = JSON.parse(localStorage.getItem("users")) || {};

  if (!users[username]) {
    // Initialize new user if doesn't exist
    users[username] = {
      pin: "4567", // Default PIN for demo
      portfolio: {},
      balance: 10000, // Starting balance
    };
    localStorage.setItem("users", JSON.stringify(users));
  }

  return { username, ...users[username] };
}

// Save user data to localStorage
function saveUserData() {
  const users = JSON.parse(localStorage.getItem("users")) || {};
  users[currentUser.username] = {
    pin: currentUser.pin,
    portfolio: currentUser.portfolio,
    balance: currentUser.balance,
  };
  localStorage.setItem("users", JSON.stringify(users));
}

// Render stock grid
function renderStockGrid() {
  stockGrid.innerHTML = "";

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
                ${stock.change >= 0 ? "+" : ""}${stock.change.toFixed(2)}%
            </div>
        `;

    stockCard.addEventListener("click", () => selectStock(stock));
    stockGrid.appendChild(stockCard);
  });
}

// Select a stock for trading
function selectStock(stock) {
  // Remove selected class from all cards
  document.querySelectorAll(".stock-card").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selected class to clicked card
  event.currentTarget.classList.add("selected");

  selectedStock = stock;
  stockSymbolInput.value = stock.symbol;
  priceInput.value = stock.price.toFixed(2);
  updateTotal();
}

// Toggle limit price field based on order type
function toggleLimitPrice() {
  if (orderTypeSelect.value === "limit") {
    limitPriceGroup.style.display = "block";
    limitPriceInput.value = selectedStock ? selectedStock.price.toFixed(2) : "";
  } else {
    limitPriceGroup.style.display = "none";
  }
  updateTotal();
}

// Update total cost estimate
function updateTotal() {
  if (!selectedStock) return;

  const quantity = parseInt(quantityInput.value) || 0;
  const price =
    orderTypeSelect.value === "limit" && limitPriceInput.value
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;

  const total = quantity * price;
  totalInput.value = total.toFixed(2);
}

// Render portfolio holdings
function renderPortfolio() {
  portfolioStocks.innerHTML = "";

  if (
    !currentUser.portfolio ||
    Object.keys(currentUser.portfolio).length === 0
  ) {
    portfolioStocks.innerHTML =
      '<p class="empty-portfolio">No holdings yet. Start trading!</p>';
    return;
  }

  Object.entries(currentUser.portfolio).forEach(([symbol, holding]) => {
    const stock = stocks.find((s) => s.symbol === symbol);
    const currentValue = stock
      ? holding.shares * stock.price
      : holding.shares * holding.avgPrice;
    const profitLoss = currentValue - holding.shares * holding.avgPrice;

    const portfolioItem = document.createElement("div");
    portfolioItem.className = "portfolio-item";
    portfolioItem.innerHTML = `
            <div>
                <div class="portfolio-symbol">${symbol}</div>
                <div class="portfolio-shares">${holding.shares} shares</div>
            </div>
            <div>
                <div class="portfolio-amount">$${currentValue.toFixed(2)}</div>
                <div class="portfolio-pl ${
                  profitLoss >= 0 ? "positive" : "negative"
                }">
                    ${profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                </div>
            </div>
        `;
    portfolioStocks.appendChild(portfolioItem);
  });
}

// Update portfolio summary
function updatePortfolioSummary() {
  if (!currentUser) return;

  // Calculate total portfolio value
  let totalValue = currentUser.balance;
  let todayChange = 0;

  if (currentUser.portfolio) {
    Object.entries(currentUser.portfolio).forEach(([symbol, holding]) => {
      const stock = stocks.find((s) => s.symbol === symbol);
      if (stock) {
        totalValue += holding.shares * stock.price;
        todayChange += holding.shares * stock.change;
      }
    });
  }

  portfolioValue.textContent = `$${totalValue.toFixed(2)}`;

  // For demo, we'll just show a positive change
  const changePercent = (
    (todayChange / (totalValue - todayChange)) *
    100
  ).toFixed(2);
  portfolioChange.innerHTML = `
        <i class="fas fa-arrow-up"></i>
        <span>+$${Math.abs(todayChange).toFixed(
          2
        )} (${changePercent}%) Today</span>
    `;
}

// Place buy order
function placeBuyOrder() {
  if (!validateTrade()) return;

  const quantity = parseInt(quantityInput.value);
  const price =
    orderTypeSelect.value === "limit"
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;
  const totalCost = quantity * price;

  // Check if user has enough balance
  if (currentUser.balance < totalCost) {
    alert("Insufficient funds for this trade");
    return;
  }

  // Update user portfolio
  if (!currentUser.portfolio[selectedStock.symbol]) {
    currentUser.portfolio[selectedStock.symbol] = {
      shares: 0,
      avgPrice: 0,
    };
  }

  const holding = currentUser.portfolio[selectedStock.symbol];
  const newTotalShares = holding.shares + quantity;
  const newAvgPrice =
    (holding.shares * holding.avgPrice + quantity * price) / newTotalShares;

  holding.shares = newTotalShares;
  holding.avgPrice = newAvgPrice;

  // Update user balance
  currentUser.balance -= totalCost;

  // Save and update UI
  saveUserData();
  updatePortfolioSummary();
  renderPortfolio();

  alert(
    `Successfully bought ${quantity} shares of ${
      selectedStock.symbol
    } at $${price.toFixed(2)} each`
  );
  resetTradeForm();
}

// Place sell order
function placeSellOrder() {
  if (!validateTrade()) return;

  const quantity = parseInt(quantityInput.value);
  const price =
    orderTypeSelect.value === "limit"
      ? parseFloat(limitPriceInput.value)
      : selectedStock.price;
  const totalValue = quantity * price;

  // Check if user has enough shares
  if (
    !currentUser.portfolio[selectedStock.symbol] ||
    currentUser.portfolio[selectedStock.symbol].shares < quantity
  ) {
    alert(`You don't have enough shares of ${selectedStock.symbol} to sell`);
    return;
  }

  // Update user portfolio
  const holding = currentUser.portfolio[selectedStock.symbol];
  holding.shares -= quantity;

  // Remove from portfolio if shares reach 0
  if (holding.shares === 0) {
    delete currentUser.portfolio[selectedStock.symbol];
  }

  // Update user balance
  currentUser.balance += totalValue;

  // Save and update UI
  saveUserData();
  updatePortfolioSummary();
  renderPortfolio();

  alert(
    `Successfully sold ${quantity} shares of ${
      selectedStock.symbol
    } at $${price.toFixed(2)} each`
  );
  resetTradeForm();
}

// Validate trade (common for buy and sell)
function validateTrade() {
  // Check if stock is selected
  if (!selectedStock) {
    alert("Please select a stock to trade");
    return false;
  }

  // Check quantity
  const quantity = parseInt(quantityInput.value);
  if (isNaN(quantity) || quantity < 1) {
    alert("Please enter a valid quantity (minimum 1 share)");
    return false;
  }

  // Check limit price if limit order
  if (orderTypeSelect.value === "limit") {
    const limitPrice = parseFloat(limitPriceInput.value);
    if (isNaN(limitPrice)) {
      alert("Please enter a valid limit price");
      return false;
    }
  }

  // Verify PIN
  const enteredPin = pinInput.value;
  if (enteredPin !== currentUser.pin) {
    alert("Incorrect security PIN");
    return false;
  }

  return true;
}

// Reset trade form after successful trade
function resetTradeForm() {
  selectedStock = null;
  stockSymbolInput.value = "";
  priceInput.value = "";
  totalInput.value = "";
  quantityInput.value = "1";
  pinInput.value = "";
  limitPriceGroup.style.display = "none";
  orderTypeSelect.value = "market";

  // Remove selected class from all cards
  document.querySelectorAll(".stock-card").forEach((card) => {
    card.classList.remove("selected");
  });
}
