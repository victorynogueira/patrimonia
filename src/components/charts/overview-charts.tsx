"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoneyCompact, formatMoney } from "@/lib/money";

type SeriesPoint = { label: string; income?: number; expense?: number; profit?: number; net?: number; value?: number };

const axis = { fontSize: 11, fill: "#94A3B8" };

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg dark:border-white/10 dark:bg-slate-900/95">
      <p className="mb-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center justify-between gap-6 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} /> {item.name}
          </span>
          <span className="font-semibold text-slate-800 dark:text-white">{formatMoney(Number(item.value ?? 0))}</span>
        </div>
      ))}
    </div>
  );
}

export function EvolutionChart({ data, variant = "balance" }: { data: SeriesPoint[]; variant?: "balance" | "flow" }) {
  const keys = variant === "balance"
    ? [{ key: "value", name: "Patrimônio", color: "#6366F1" }]
    : [{ key: "income", name: "Receitas", color: "#10B981" }, { key: "expense", name: "Despesas", color: "#F43F5E" }, { key: "profit", name: "Lucros", color: "#0EA5E9" }];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
        <defs>
          {keys.map((item) => (
            <linearGradient key={item.key} id={`grad-${item.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={item.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} dy={8} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(value: number) => formatMoneyCompact(value)} width={78} />
        <Tooltip content={<ChartTooltip />} />
        {keys.map((item) => (
          <Area key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2.5} fill={`url(#grad-${item.key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FlowBars({ data }: { data: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axis} axisLine={false} tickLine={false} dy={8} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(value: number) => formatMoneyCompact(value)} width={78} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(148,163,184,.08)" }} />
        <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[5, 5, 0, 0]} maxBarSize={16} />
        <Bar dataKey="expense" name="Despesas" fill="#F43F5E" radius={[5, 5, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const palette = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#0EA5E9", "#A855F7", "#14B8A6", "#94A3B8"];

export function AllocationDonut({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data.length) return <div className="flex h-full items-center justify-center text-xs text-slate-400">Sem dados no período</div>;
  return (
    <div className="flex h-full flex-col items-center gap-2 sm:flex-row">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={3} stroke="none">
            {data.map((item, index) => <Cell key={item.name} fill={palette[index % palette.length]} />)}
          </Pie>
          <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex w-full flex-wrap justify-center gap-x-3 gap-y-1.5 pb-2 sm:w-32 sm:flex-col">
        {data.slice(0, 5).map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: palette[index % palette.length] }} />
            <span className="truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
