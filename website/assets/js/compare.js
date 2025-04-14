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

document.addEventListener("DOMContentLoaded", () => {
  const compareBtn = document.getElementById("compareBtn");
  const stock1Select = document.getElementById("stockList1");
  const stock2Select = document.getElementById("stockList2");
  const chartContainer = document.getElementById("chart");
  const rangeButtons = document.querySelectorAll(".time-range-buttons button");

  let stockChart;
  let fullLabels = [];
  let fullStock1Data = [];
  let fullStock2Data = [];

  compareBtn.addEventListener("click", async () => {
    const stock1 = stock1Select.value;
    const stock2 = stock2Select.value;
    chartContainer.innerHTML =
      '<canvas id="comparisonChart"></canvas><canvas id="histogramChart"></canvas>';

    if (
      !stock1 ||
      !stock2 ||
      stock1 === "Select a Stock" ||
      stock2 === "Select a Stock"
    ) {
      chartContainer.innerHTML =
        "<p class='error'>Please select two valid stocks to compare.</p>";
      return;
    }

    if (stock1 === stock2) {
      chartContainer.innerHTML =
        "<p class='error'>Please select two different stocks.</p>";
      return;
    }

    try {
      const [data1, data2] = await Promise.all([
        fetchCSV(`./stock-data-csv-files/${stock1}_processed.csv`),
        fetchCSV(`./stock-data-csv-files/${stock2}_processed.csv`),
      ]);

      fullLabels = data1.map((row) => row.Date);
      fullStock1Data = data1.map((row) => parseFloat(row.Close));
      fullStock2Data = data2.map((row) => parseFloat(row.Close));

      const { labels, stock1Data, stock2Data, sliceStart } =
        filterDataByRange("5Y");

      drawChart(labels, stock1Data, stock2Data, stock1, stock2);
      await drawHistogram(
        stock1,
        stock2,
        stock1Data,
        stock2Data,
        labels,
        sliceStart
      );
    } catch (error) {
      console.error(error);
      chartContainer.innerHTML =
        "<p class='error'>Error loading stock data. Please check console.</p>";
    }
  });

  rangeButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const range = button.getAttribute("data-range");
      if (fullLabels.length === 0) return;

      const { labels, stock1Data, stock2Data, sliceStart } =
        filterDataByRange(range);
      const stock1 = stock1Select.value;
      const stock2 = stock2Select.value;

      drawChart(labels, stock1Data, stock2Data, stock1, stock2);
      await drawHistogram(
        stock1,
        stock2,
        stock1Data,
        stock2Data,
        labels,
        sliceStart
      );
    });
  });

  function drawChart(labels, stock1Data, stock2Data, stock1, stock2) {
    if (stockChart) stockChart.destroy();

    const ctx = document.getElementById("comparisonChart").getContext("2d");

    stockChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${stock1} Closing Prices`,
            data: stock1Data,
            borderColor: "#00c896",
            backgroundColor: "rgba(0, 200, 150, 0.2)",
            fill: false,
            tension: 0.3,
          },
          {
            label: `${stock2} Closing Prices`,
            data: stock2Data,
            borderColor: "#f05454",
            backgroundColor: "rgba(240, 84, 84, 0.2)",
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: "#fff",
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#fff",
              maxTicksLimit: 10,
            },
          },
          y: {
            ticks: {
              color: "#fff",
            },
          },
        },
      },
    });
  }

  async function drawHistogram(
    stock1,
    stock2,
    stock1Data,
    stock2Data,
    labels,
    sliceStart
  ) {
    const allStockNames = [...stock1Select.options]
      .map((opt) => opt.value)
      .filter((name) => name !== "Select a Stock");
    const otherStocks = allStockNames.filter(
      (name) => name !== stock1 && name !== stock2
    );

    try {
      const otherDataArray = await Promise.all(
        otherStocks.map((name) =>
          fetchCSV(`./stock-data-csv-files/${name}_processed.csv`)
        )
      );

      const otherAvgArray = [];

      for (let i = 0; i < labels.length; i++) {
        let sum = 0;
        let count = 0;

        for (const stockData of otherDataArray) {
          const val = parseFloat(stockData[sliceStart + i]?.Close);
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        }

        otherAvgArray.push(count ? sum / count : 0);
      }

      const avg1 = average(stock1Data);
      const avg2 = average(stock2Data);
      const avgOthers = average(otherAvgArray);

      const ctx = document.getElementById("histogramChart").getContext("2d");
      if (window.histogram) window.histogram.destroy();

      window.histogram = new Chart(ctx, {
        type: "bar",
        data: {
          labels: [stock1, stock2, "Market Avg"],
          datasets: [
            {
              label: "Average Valuation",
              data: [avg1, avg2, avgOthers],
              backgroundColor: ["#00c896", "#f05454", "#7289da"],
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: {
              ticks: { color: "#fff" },
            },
            y: {
              ticks: { color: "#fff" },
            },
          },
          plugins: {
            legend: {
              labels: { color: "#fff" },
            },
          },
        },
      });
    } catch (error) {
      console.error("Failed to calculate histogram:", error);
    }
  }

  function average(arr) {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return arr.length ? sum / arr.length : 0;
  }

  function filterDataByRange(range) {
    const map = {
      "1D": 1,
      "1W": 7,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      "5Y": 1825,
    };

    const days = map[range] || fullLabels.length;
    const sliceStart = Math.max(0, fullLabels.length - days);

    return {
      labels: fullLabels.slice(sliceStart),
      stock1Data: fullStock1Data.slice(sliceStart),
      stock2Data: fullStock2Data.slice(sliceStart),
      sliceStart,
      sliceEnd: fullLabels.length,
    };
  }

  async function fetchCSV(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const text = await response.text();
    return parseCSV(text);
  }

  function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map((line) => {
      const values = line.split(",");
      const row = {};
      headers.forEach((header, i) => {
        row[header.trim()] = values[i].trim();
      });
      return row;
    });
  }
});
