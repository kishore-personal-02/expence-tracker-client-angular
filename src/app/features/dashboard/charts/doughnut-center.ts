import type { Chart, Plugin } from 'chart.js';

export interface DoughnutCenterState {
  label: string;
  value: string;
  labelColor: string;
  valueColor: string;
}

// Draws a muted caption above a bold amount in the middle of a doughnut,
// echoing the dashboard summary card layout (small label + strong value).
export function createDoughnutCenterPlugin(
  getState: () => DoughnutCenterState | null,
): Plugin<'doughnut'> {
  return {
    id: 'doughnutCenter',
    afterDraw(chart: Chart) {
      const state = getState();
      if (!state) return;
      const { ctx, chartArea } = chart;
      if (!chartArea || !chartArea.width || !chartArea.height) return;

      const cx = (chartArea.left + chartArea.right) / 2;
      const cy = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = '500 11px system-ui';
      ctx.fillStyle = state.labelColor;
      ctx.fillText(state.label, cx, cy - 12);

      ctx.font = '700 15px system-ui';
      ctx.fillStyle = state.valueColor;
      ctx.fillText(state.value, cx, cy + 10);

      ctx.restore();
    },
  };
}