import type { ChartOptions, GridLineOptions, ScriptableContext } from 'chart.js';
import type { ChartFilter } from '../../../core/models/ui.model';
import { formatAxisTick } from '../../../core/utils/formatters';
import type { CategoryDatum, PaymentDatum, TrendDatum } from './chart-data';
import type { ChartTheme } from './chart-theme';
import { withAlpha } from './chart-theme';
import type { CustomTooltipPoint, TooltipPoint } from './tooltips';
import { customTooltipExternal, defaultTooltipExternal } from './tooltips';

const GRID_DASH = [3, 3] as const;

// chart.js honours grid.borderDash at runtime but omits it from the v4
// GridLineOptions type surface, so build the option through a bypassing cast.
export function dashedGrid(color: string): GridLineOptions {
  return { color, borderDash: [...GRID_DASH] } as unknown as GridLineOptions;
}

export type ChartSelectHandler = (value: string) => void;

export interface ChartVisualContext<T> {
  data: T[];
  filter: ChartFilter | null;
  theme: ChartTheme;
  colors: string[];
  onSelect: ChartSelectHandler;
}

const PIE_ANIMATION = { duration: 800, easing: 'easeOutQuart' } as const;

export function buildCategoryPieOptions(
  ctx: ChartVisualContext<CategoryDatum>,
): ChartOptions<'doughnut'> {
  const points: TooltipPoint[] = ctx.data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: ctx.colors[index],
  }));

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    radius: '90%',
    spacing: 3, // paddingAngle=3
    animation: { ...PIE_ANIMATION },
    onClick: (_event, elements) => {
      const index = elements[0]?.index;
      if (index !== undefined && index < ctx.data.length) {
        ctx.onSelect(ctx.data[index].name);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: defaultTooltipExternal((index) => points[index]),
      },
    },
  };
}

export function buildPaymentOptions(
  ctx: ChartVisualContext<PaymentDatum>,
): ChartOptions<'doughnut'> {
  const points: TooltipPoint[] = ctx.data.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: ctx.colors[index],
  }));

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    radius: '88%',
    spacing: 5, // paddingAngle=5
    animation: { ...PIE_ANIMATION },
    onClick: (_event, elements) => {
      const index = elements[0]?.index;
      if (index !== undefined && index < ctx.data.length) {
        ctx.onSelect(ctx.data[index].key);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: defaultTooltipExternal((index) => points[index]),
      },
    },
  };
}

interface NamedDatum {
  name: string;
  value: number;
}

function buildNamedBarOptions<T extends NamedDatum>(
  ctx: ChartVisualContext<T>,
  valueOf: (item: T) => string,
): ChartOptions<'bar'> {
  const points: CustomTooltipPoint[] = ctx.data.map((item) => ({
    label: item.name,
    value: item.value,
  }));

  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    animation: { ...PIE_ANIMATION },
    onClick: (_event, elements) => {
      const index = elements[0]?.index;
      if (index !== undefined && index < ctx.data.length) {
        ctx.onSelect(valueOf(ctx.data[index]));
      }
    },
    scales: {
      x: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: {
          color: ctx.theme.tickColor,
          font: { size: 12 },
          callback: (value) => formatAxisTick(Number(value)),
        },
        beginAtZero: true,
      },
      y: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: { color: ctx.theme.legendColor, font: { size: 12 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: customTooltipExternal(ctx.theme, (index) => points[index]),
      },
    },
  };
}

export function buildCategoryBarOptions(
  ctx: ChartVisualContext<CategoryDatum>,
): ChartOptions<'bar'> {
  return buildNamedBarOptions(ctx, (item) => item.name);
}

export function buildPaymentBarOptions(
  ctx: ChartVisualContext<PaymentDatum>,
): ChartOptions<'bar'> {
  return buildNamedBarOptions(ctx, (item) => item.key);
}

function buildNamedLineOptions<T extends NamedDatum>(
  ctx: ChartVisualContext<T>,
  valueOf: (item: T) => string,
): ChartOptions<'line'> {
  const points: CustomTooltipPoint[] = ctx.data.map((item) => ({
    label: item.name,
    value: item.value,
  }));

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { ...PIE_ANIMATION },
    onClick: (_event, elements) => {
      const index = elements[0]?.index;
      if (index !== undefined && index < ctx.data.length) {
        ctx.onSelect(valueOf(ctx.data[index]));
      }
    },
    scales: {
      x: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: { color: ctx.theme.tickColor, font: { size: 12 } },
      },
      y: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: {
          color: ctx.theme.tickColor,
          font: { size: 12 },
          callback: (value) => formatAxisTick(Number(value)),
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: customTooltipExternal(ctx.theme, (index) => points[index]),
      },
    },
  };
}

export function buildCategoryLineOptions(
  ctx: ChartVisualContext<CategoryDatum>,
): ChartOptions<'line'> {
  return buildNamedLineOptions(ctx, (item) => item.name);
}

export function buildPaymentLineOptions(
  ctx: ChartVisualContext<PaymentDatum>,
): ChartOptions<'line'> {
  return buildNamedLineOptions(ctx, (item) => item.key);
}

const AREA_STROKE = '#ef4444';

// Generates an area gradient beneath a given stroke colour (fades the top
// colour out toward the bottom), mirroring how areaGradient handles the
// red daily-trend fill.
export function areaGradientFrom(
  stroke: string,
): (context: ScriptableContext<'line'>) => CanvasGradient | string {
  return (context) => {
    const { ctx, chartArea } = context.chart;
    if (!chartArea) return stroke;
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, withAlpha(stroke, 0.25));
    gradient.addColorStop(1, withAlpha(stroke, 0));
    return gradient;
  };
}

// Matches the source <linearGradient id="colorAmt"> stops (5% at 30%
// opacity down to 0 at 95%) beneath the solid #ef4444 stroke.
export function areaGradient(context: ScriptableContext<'line'>): CanvasGradient | string {
  const { ctx, chartArea } = context.chart;
  if (!chartArea) return AREA_STROKE;
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
  gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
  return gradient;
}

export const TREND_STROKE = AREA_STROKE;

export function buildTrendOptions(ctx: ChartVisualContext<TrendDatum>): ChartOptions<'line'> {
  const points: { label: string; value: number }[] = ctx.data.map((item) => ({
    label: item.date,
    value: item.amount,
  }));

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: 'easeOutQuart' },
    scales: {
      x: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: { color: ctx.theme.tickColor, font: { size: 12 } },
      },
      y: {
        grid: dashedGrid(ctx.theme.gridColor),
        border: { display: false },
        ticks: {
          color: ctx.theme.tickColor,
          font: { size: 12 },
          callback: (value) => formatAxisTick(Number(value)),
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: customTooltipExternal(ctx.theme, (index) => points[index]),
      },
    },
  };
}