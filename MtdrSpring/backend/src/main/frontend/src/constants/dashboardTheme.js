export const dashboardColors = {
  page: '#FFFFFF',
  surface: '#faf9f6',
  accent: '#c74634',
  text: '#2A1814',
  textMuted: '#6B6560',
  border: '#E8E2D9',
};

/** Cards del grid del dashboard: crema con borde y sombra suaves */
export const dashboardCardClassName =
  'flex flex-col rounded-2xl border border-[#2A1814]/[0.06] bg-[#faf9f6] shadow-[0_1px_2px_rgba(42,24,20,0.03)]';

/** Fila superior compartida: logo Lumen (sidebar) y saludo (header) */
export const dashboardTopRowClassName = 'flex min-h-10 items-center pt-6 lg:pt-7';

/** Scrollbar fina sin track oscuro (sidebar y contenido del dashboard) */
export const dashboardScrollbarClassName = 'dashboard-thin-scrollbar';
