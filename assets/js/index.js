const welcomeArea = document.getElementById("welcomeArea");
const logoutArea = document.getElementById("logoutArea");
const loggedInUser = localStorage.getItem("stockviz_loggedInUser");

// Add this to your existing index.js (at the top or in the DOMContentLoaded event)

// Search form functionality
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const searchInput = this.querySelector('input[type="text"]');
    const searchTerm = searchInput.value.trim().toUpperCase();

    if (searchTerm) {
      // Check if the symbol exists in our stocks list
      const stocks = [
        { symbol: "AAPL" },
        { symbol: "ADBE" },
        { symbol: "BAC" },
        { symbol: "AMZN" },
        { symbol: "CRM" },
        { symbol: "CSCO" },
        { symbol: "DIS" },
        { symbol: "GOOGL" },
        { symbol: "HD" },
        { symbol: "INTC" },
        { symbol: "JNJ" },
        { symbol: "JPM" },
        { symbol: "KO" },
        { symbol: "MA" },
        { symbol: "META" },
        { symbol: "MSFT" },
        { symbol: "NFLX" },
        { symbol: "NVDA" },
        { symbol: "PFE" },
        { symbol: "TSLA" },
        { symbol: "UNH" },
        { symbol: "V" },
        { symbol: "WMT" },
        { symbol: "XOM" },
        { symbol: "PG" },
      ];

      const isValidSymbol = stocks.some((stock) => stock.symbol === searchTerm);

      if (isValidSymbol) {
        // Redirect to markets.html with the symbol as a query parameter
        window.location.href = `markets.html?symbol=${encodeURIComponent(
          searchTerm
        )}`;
      } else {
        alert("Please enter a valid stock symbol from our available list");
      }
    }
  });
}

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
  // Initialize Chart
  initMainChart();

  // Animate market indices
  animateIndexValues();

  // Mobile menu toggle
  setupMobileMenu();

  // Simulate stock price changes
  simulateStockChanges();
});

function initMainChart() {
  const ctx = document.getElementById("mainChart").getContext("2d");

  // Sample data for the chart
  const labels = [];
  const data = [];

  // Generate 30 data points
  for (let i = 0; i < 30; i++) {
    labels.push(`Day ${i + 1}`);
    const prevValue = data.length > 0 ? data[data.length - 1] : 100;
    data.push(prevValue + (Math.random() * 10 - 5));
  }

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Stock Price",
          data: data,
          borderColor: "#4CAF50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: "#BDBDBD",
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: "#BDBDBD",
          },
        },
      },
    },
  });
}

function animateIndexValues() {
  const indexElements = document.querySelectorAll(".index-value");

  // Initial animation after 1 second
  setTimeout(() => {
    indexElements.forEach((el) => {
      el.classList.add("changing");
    });

    setTimeout(() => {
      indexElements.forEach((el) => {
        el.classList.remove("changing");
      });
    }, 400);
  }, 1000);

  // Simulate market changes every 3-8 seconds
  setInterval(() => {
    indexElements.forEach((el) => {
      // Only animate about 70% of the time for more realism
      if (Math.random() > 0.3) {
        const currentValue = parseFloat(el.textContent.replace(/,/g, ""));
        const fluctuation = (Math.random() * 10 - 5) * (currentValue / 1000);
        const newValue = currentValue + fluctuation;

        // Format number with commas
        const formattedValue = newValue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        // Trigger animation
        el.classList.add("changing");
        setTimeout(() => {
          el.textContent = formattedValue;
          el.setAttribute("data-target", newValue.toFixed(2));
          el.classList.remove("changing");
        }, 200);
      }
    });
  }, 3000 + Math.random() * 5000);
}

function setupMobileMenu() {
  const mobileBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const searchBox = document.querySelector(".search-box");

  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener("click", () => {
      const isOpen = navLinks.style.display === "flex";

      navLinks.style.display = isOpen ? "none" : "flex";
      searchBox.style.display = isOpen ? "none" : "flex";

      if (!isOpen) {
        navLinks.style.flexDirection = "column";
        navLinks.style.position = "absolute";
        navLinks.style.top = "100%";
        navLinks.style.left = "0";
        navLinks.style.right = "0";
        navLinks.style.backgroundColor = "var(--black)";
        navLinks.style.padding = "20px";
        navLinks.style.gap = "15px";
        navLinks.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.2)";

        searchBox.style.position = "absolute";
        searchBox.style.top = `calc(100% + ${navLinks.offsetHeight + 20}px)`;
        searchBox.style.left = "20px";
        searchBox.style.right = "20px";
        searchBox.style.margin = "0";
      }
    });
  }
}

function simulateStockChanges() {
  const stockPriceEl = document.querySelector(".stock-price");
  const stockChangeEl = document.querySelector(".stock-change");

  if (!stockPriceEl || !stockChangeEl) return;

  setInterval(() => {
    const currentPrice = parseFloat(stockPriceEl.textContent.replace("$", ""));
    const change = Math.random() * 4 - 2;
    const newPrice = currentPrice + change;
    const percentChange = ((change / currentPrice) * 100).toFixed(2);

    stockPriceEl.textContent = `$${newPrice.toFixed(2)}`;

    if (change >= 0) {
      stockChangeEl.className = "stock-change positive";
      stockChangeEl.innerHTML = `+${change.toFixed(
        2
      )} (${percentChange}%) <i class="fas fa-caret-up"></i>`;
    } else {
      stockChangeEl.className = "stock-change negative";
      stockChangeEl.innerHTML = `${change.toFixed(
        2
      )} (${percentChange}%) <i class="fas fa-caret-down"></i>`;
    }
  }, 5000);
}

document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector("#navLinks");

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }
});
