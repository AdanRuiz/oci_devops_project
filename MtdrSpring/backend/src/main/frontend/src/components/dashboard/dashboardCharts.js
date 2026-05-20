export const CHART = {
  accent: '#c74634',
  accentLight: '#e07a5f',
  ideal: '#a39e96',
  text: '#6B6560',
  textDark: '#2A1814',
  grid: 'rgba(42, 24, 20, 0.06)',
  gridStrong: 'rgba(42, 24, 20, 0.1)',
  surface: '#faf9f6',
  tooltipBg: '#2A1814',
};

const fontFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function lineAreaGradient(context) {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(199, 70, 52, 0.12)';

  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(199, 70, 52, 0.28)');
  gradient.addColorStop(0.55, 'rgba(199, 70, 52, 0.08)');
  gradient.addColorStop(1, 'rgba(199, 70, 52, 0)');
  return gradient;
}

export function horizontalBarGradient(context) {
  const { chart } = context;
  const { ctx, chartArea } = chart;
  if (!chartArea) return CHART.accent;

  const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  gradient.addColorStop(0, CHART.accentLight);
  gradient.addColorStop(1, CHART.accent);
  return gradient;
}

const sharedTooltip = {
  enabled: true,
  backgroundColor: CHART.tooltipBg,
  titleColor: CHART.surface,
  bodyColor: CHART.surface,
  titleFont: { family: fontFamily, size: 12, weight: '600' },
  bodyFont: { family: fontFamily, size: 12 },
  padding: { top: 10, right: 12, bottom: 10, left: 12 },
  cornerRadius: 10,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 6,
  usePointStyle: true,
};

const sharedTicks = {
  color: CHART.text,
  font: { family: fontFamily, size: 11 },
  padding: 8,
};

const chartAnimation = {
  duration: 700,
  easing: 'easeOutQuart',
};

export const burndownChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: chartAnimation,
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { top: 8, right: 4, bottom: 0, left: 4 } },
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        color: CHART.text,
        font: { family: fontFamily, size: 12 },
        padding: 16,
      },
    },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} pts`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: sharedTicks,
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: CHART.grid,
        drawTicks: false,
      },
      ticks: {
        ...sharedTicks,
        stepSize: 10,
        callback: (value) => value,
      },
      border: { display: false },
    },
  },
};

export const memberBarChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: chartAnimation,
  indexAxis: 'y',
  interaction: { mode: 'nearest', axis: 'y', intersect: false },
  layout: { padding: { top: 4, right: 12, bottom: 4, left: 4 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        label: (ctx) => `${ctx.parsed.x} story points`,
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: {
        color: CHART.grid,
        drawTicks: false,
      },
      ticks: {
        ...sharedTicks,
        stepSize: 5,
      },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: {
        ...sharedTicks,
        font: { family: fontFamily, size: 12, weight: '500' },
        color: CHART.textDark,
      },
      border: { display: false },
    },
  },
};

export function buildBurndownDatasets(actual, ideal) {
  return [
    {
      label: 'Actual',
      data: actual,
      borderColor: CHART.accent,
      backgroundColor: lineAreaGradient,
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: CHART.accent,
      pointBorderColor: CHART.surface,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: CHART.accent,
    },
    {
      label: 'Ideal',
      data: ideal,
      borderColor: CHART.ideal,
      backgroundColor: 'transparent',
      fill: false,
      tension: 0.4,
      borderWidth: 2,
      borderDash: [7, 5],
      pointRadius: 0,
      pointHoverRadius: 0,
    },
  ];
}

export function buildMemberBarDataset(labels, data) {
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: horizontalBarGradient,
        hoverBackgroundColor: CHART.accent,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 16,
        maxBarThickness: 20,
      },
    ],
  };
}

const darkRed = '#7a2419';
const salmon = '#e07a5f';
const sand = '#e8dcc8';
const teal = '#0f766e';

/** Line + dashed horizontal cap (constant series). */
export function buildThresholdLineChartData(labels, actualValues, maxValue, actualLabel, maxLabel) {
  const cap = labels.map(() => maxValue);
  return {
    labels,
    datasets: [
      {
        label: actualLabel,
        data: actualValues,
        borderColor: darkRed,
        backgroundColor: lineAreaGradient,
        fill: true,
        tension: 0.45,
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: darkRed,
        pointBorderColor: CHART.surface,
        pointBorderWidth: 2,
      },
      {
        label: maxLabel,
        data: cap,
        borderColor: salmon,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };
}

export function projectThresholdLineOptions(suggestedMax) {
  const max = Math.max(suggestedMax || 8, 4);
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: chartAnimation,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 8, right: 4, bottom: 0, left: 4 } },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          color: CHART.text,
          font: { family: fontFamily, size: 12 },
          padding: 14,
        },
      },
      tooltip: {
        ...sharedTooltip,
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: sharedTicks,
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        suggestedMax: max,
        grid: { color: CHART.grid, drawTicks: false },
        ticks: {
          ...sharedTicks,
          stepSize: max <= 8 ? 2 : 3,
        },
        border: { display: false },
      },
    },
  };
}

export const projectDoughnutColors = {
  onTime: darkRed,
  extra: salmon,
  under: sand,
  teal,
};

export function buildTimeConsistencyDoughnutData(shares) {
  return {
    labels: ['On time', 'Extra hours', 'Under hours'],
    datasets: [
      {
        data: [shares.onTime, shares.extra, shares.under],
        backgroundColor: [darkRed, salmon, sand],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };
}

export const timeConsistencyDoughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  animation: chartAnimation,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: 'circle',
        color: CHART.text,
        font: { family: fontFamily, size: 11 },
        padding: 12,
      },
    },
    tooltip: {
      ...sharedTooltip,
      callbacks: {
        label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
      },
    },
  },
};
