"use client";

import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { colors } from "../theme";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
          weight: "500",
        },
      },
    },
    tooltip: {
      backgroundColor: colors.neutral[900],
      padding: 12,
      titleFont: {
        size: 12,
        weight: "bold",
      },
      bodyFont: {
        size: 12,
      },
      cornerRadius: 6,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: colors.neutral[200],
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
  },
};

/**
 * LineChart Component
 */
export const LineChart = ({ data, title, options = {}, className = "" }) => {
  return (
    <div className={`app-card p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-bold text-[var(--color-text)]">
          {title}
        </h3>
      )}
      <div className="h-64">
        <Line data={data} options={{ ...chartOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * BarChart Component
 */
export const BarChart = ({ data, title, options = {}, className = "" }) => {
  return (
    <div className={`app-card p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-bold text-[var(--color-text)]">
          {title}
        </h3>
      )}
      <div className="h-64">
        <Bar data={data} options={{ ...chartOptions, ...options }} />
      </div>
    </div>
  );
};

/**
 * DoughnutChart Component
 */
export const DoughnutChart = ({ data, title, options = {}, className = "" }) => {
  return (
    <div className={`app-card p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-bold text-[var(--color-text)]">
          {title}
        </h3>
      )}
      <div className="flex justify-center">
        <div className="h-64 w-64">
          <Doughnut data={data} options={{ ...chartOptions, ...options }} />
        </div>
      </div>
    </div>
  );
};

/**
 * PieChart Component
 */
export const PieChart = ({ data, title, options = {}, className = "" }) => {
  return (
    <div className={`app-card p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-sm font-bold text-[var(--color-text)]">
          {title}
        </h3>
      )}
      <div className="flex justify-center">
        <div className="h-64 w-64">
          <Pie data={data} options={{ ...chartOptions, ...options }} />
        </div>
      </div>
    </div>
  );
};

/**
 * Sample data generator
 */
export const generateChartData = (type = "line") => {
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const datasets = {
    line: {
      labels,
      datasets: [
        {
          label: "Dataset 1",
          data: [65, 59, 80, 81, 56, 55],
          borderColor: colors.primary[600],
          backgroundColor: `${colors.primary[600]}20`,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    bar: {
      labels,
      datasets: [
        {
          label: "Dataset 1",
          data: [65, 59, 80, 81, 56, 55],
          backgroundColor: colors.primary[600],
        },
      ],
    },
    doughnut: {
      labels: ["Red", "Blue", "Yellow"],
      datasets: [
        {
          data: [30, 25, 20],
          backgroundColor: [
            colors.danger[600],
            colors.primary[600],
            colors.warning[600],
          ],
        },
      ],
    },
  };

  return datasets[type];
};

const chartComponents = {
  LineChart,
  BarChart,
  DoughnutChart,
  PieChart,
  generateChartData,
};

export default chartComponents;
