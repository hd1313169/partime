// src/components/MonthlyCharts.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList,
} from 'recharts';
import { JobType, WorkLog } from '../types';
import { computeDailyBreakdown, computeMonthlyReport, computeMonthlyTrend } from '../utils/monthly';

export type ChartTab = 'daily' | 'jobs' | 'trend';

export const CHART_TABS: { id: ChartTab; label: string }[] = [
  { id: 'daily', label: '每日收入' },
  { id: 'jobs', label: '各項工作' },
  { id: 'trend', label: '近 6 個月' },
];

interface MonthlyChartsProps {
  logs: WorkLog[];
  jobs: JobType[];
  year: number;
  month: number; // 1-based
  tab: ChartTab;
  onTabChange: (tab: ChartTab) => void;
}

type ChartDataProps = Omit<MonthlyChartsProps, 'tab' | 'onTabChange'>;

const CHART_HEIGHT = 240;
const CHART_COLOR = 'var(--color-accent)';
const AXIS = { fontSize: 13, fill: 'var(--color-muted)' };
const VALUE_LABEL = { fontSize: 11, fill: 'var(--color-ink-2)' };
const money = (v: number) => `NT$ ${v.toLocaleString()}`;
const shortMoney = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(v));
/** 圖上數值標籤：0 不顯示，避免空白日塞滿 0。 */
const valueLabel = (v: unknown) => (Number(v) > 0 ? shortMoney(Number(v)) : '');

/** 窄螢幕（手機）時每日圖的數值標籤改為直書，避免 30 個標籤互相重疊。 */
const useIsNarrow = () => {
  const query = '(max-width: 639px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return;
    const onChange = () => setNarrow(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return narrow;
};

/** 直書數值標籤（用於每日折線的資料點）。 */
const VerticalValueLabel = (props: any) => {
  const { x = 0, y = 0, width = 0, value } = props;
  const text = valueLabel(value);
  if (!text) return null;
  const cx = Number(x) + Number(width) / 2;
  const cy = Number(y) - 6;
  return (
    <text x={cx} y={cy} transform={`rotate(-90 ${cx} ${cy})`} textAnchor="start" dominantBaseline="central" {...VALUE_LABEL}>
      {text}
    </text>
  );
};

const dailyLabel = (narrow: boolean) =>
  narrow
    ? <LabelList dataKey="total" content={VerticalValueLabel} />
    : <LabelList dataKey="total" position="top" offset={8} formatter={valueLabel} style={VALUE_LABEL} />;

const tooltipStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-line)',
  borderRadius: 8,
  fontSize: 14,
};

const useDailyTotals = ({ logs, jobs, year, month }: ChartDataProps) =>
  useMemo(
    () => computeDailyBreakdown(logs, jobs, year, month).map(d => ({ day: d.day, total: d.total })),
    [logs, jobs, year, month]
  );

const dayTicks = (last: number) => [1, 5, 10, 15, 20, 25, last];

const DailyChart: React.FC<ChartDataProps> = (props) => {
  const data = useDailyTotals(props);
  const narrow = useIsNarrow();
  const top = narrow ? 36 : 20;

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <LineChart data={data} margin={{ top, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="day" type="number" domain={[1, data.length]} ticks={dayTicks(data.length)} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={shortMoney} />
        <Tooltip
          contentStyle={tooltipStyle}
          labelFormatter={(d) => `${props.month} 月 ${d} 日`}
          formatter={(v) => [money(Number(v)), '收入']}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke={CHART_COLOR}
          strokeWidth={2}
          dot={{ r: 2.5, fill: CHART_COLOR, strokeWidth: 0 }}
          isAnimationActive={false}
        >
          {dailyLabel(narrow)}
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
};

/** 圓餅圖固定配色（依切片順序循環），不使用工作項目自訂顏色。 */
const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#84cc16', '#f97316'];

const JobsChart: React.FC<ChartDataProps> = ({ logs, jobs, year, month }) => {
  const narrow = useIsNarrow();
  const { data, grandTotal } = useMemo(() => {
    const r = computeMonthlyReport(logs, jobs, year, month);
    return {
      data: r.stats.filter(s => s.totalAmount > 0).map(s => ({ name: s.job.name, total: s.totalAmount })),
      grandTotal: r.grandTotal,
    };
  }, [logs, jobs, year, month]);
  const pct = (v: number) => (grandTotal > 0 ? Math.round((v / grandTotal) * 100) : 0);

  // 桌機：切片外側標示「名稱 金額 (百分比)」；手機：切片內只標百分比，名稱與金額放在下方圖例。
  const renderOuterLabel = ({ x, y, textAnchor, payload }: any) => (
    <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fontSize={13} fill="var(--color-ink-2)">
      {payload.name} {shortMoney(payload.total)}（{pct(payload.total)}%）
    </text>
  );
  const renderInnerLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, payload }: any) => {
    const p = pct(payload.total);
    if (p < 5) return null;
    const r = (innerRadius + outerRadius) / 2;
    const rad = (-midAngle * Math.PI) / 180;
    return (
      <text x={cx + r * Math.cos(rad)} y={cy + r * Math.sin(rad)} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="#fff">
        {p}%
      </text>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${money(Number(v))}（${pct(Number(v))}%）`, String(name)]} />
          <Pie
            data={data}
            dataKey="total"
            nameKey="name"
            innerRadius={narrow ? 48 : 56}
            outerRadius={narrow ? 96 : 92}
            paddingAngle={1}
            startAngle={90}
            endAngle={-270}
            label={narrow ? renderInnerLabel : renderOuterLabel}
            labelLine={!narrow}
            isAnimationActive={false}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--color-surface)" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {narrow && (
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-2 pb-2 text-[13px]">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-ink-2 truncate">{d.name}</span>
              <span className="num text-muted ml-auto">{d.total.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const TrendChart: React.FC<Omit<MonthlyChartsProps, 'tab' | 'onTabChange'>> = ({ logs, jobs, year, month }) => {
  const data = useMemo(
    () => computeMonthlyTrend(logs, jobs, year, month).map(t => ({
      ...t,
      label: t.month === 1 ? `${t.year}/${t.month}` : `${t.month} 月`,
    })),
    [logs, jobs, year, month]
  );

  return (
    <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
      <BarChart data={data} margin={{ top: 20, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="var(--color-line)" />
        <XAxis dataKey="label" interval={0} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} tickFormatter={shortMoney} />
        <Tooltip
          cursor={{ fill: 'var(--color-sunken)' }}
          contentStyle={tooltipStyle}
          labelFormatter={(_, p) => {
            const t = p?.[0]?.payload as { year: number; month: number } | undefined;
            return t ? `${t.year} 年 ${t.month} 月` : '';
          }}
          formatter={(v) => [money(Number(v)), '總工資']}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList dataKey="total" position="top" formatter={valueLabel} style={VALUE_LABEL} />
          {data.map(t => (
            <Cell
              key={`${t.year}-${t.month}`}
              data-current={t.year === year && t.month === month ? 'true' : undefined}
              fill={t.year === year && t.month === month ? 'var(--color-accent)' : 'var(--color-line-strong)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ tab, onTabChange, ...data }) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + CHART_TABS.length) % CHART_TABS.length;
    onTabChange(CHART_TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <section aria-label="收入圖表" className="space-y-3">
      <div className="segmented" role="tablist" aria-label="圖表類型">
        {CHART_TABS.map((t, i) => (
          <button
            key={t.id}
            ref={el => { tabRefs.current[i] = el; }}
            id={`chart-tab-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-pressed={tab === t.id}
            aria-controls="chart-panel"
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => onTabChange(t.id)}
            onKeyDown={e => onKeyDown(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        id="chart-panel"
        role="tabpanel"
        aria-labelledby={`chart-tab-${tab}`}
        data-chart={tab}
        className="bg-surface border border-line rounded-[var(--radius-sheet)] px-2 pt-3 pb-1"
        style={{ minHeight: CHART_HEIGHT + 16 }}
      >
        {tab === 'daily' && <DailyChart {...data} />}
        {tab === 'jobs' && <JobsChart {...data} />}
        {tab === 'trend' && <TrendChart {...data} />}
      </div>
    </section>
  );
};
