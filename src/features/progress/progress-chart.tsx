'use client';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useId } from 'react';
import { number, dateLabel } from '@/utils/workout';
import type { progressPoints } from './model';
type Point = ReturnType<typeof progressPoints>[number];
export function ProgressChart({
  points,
  metric,
  title,
  unit,
}: {
  points: Point[];
  metric: 'maxWeight' | 'volume' | 'oneRM' | 'seconds';
  title: string;
  unit: string;
}) {
  const id = useId().replaceAll(':', '');
  const values = points.map((p) => p[metric]);
  const last = values.at(-1) ?? 0;
  const best = Math.max(...values, 0);
  const change =
    last - (values.length > 1 ? values[Math.max(0, values.length - 5)] : last);
  return (
    <section className="chart-card">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{unit}</span>
      </div>
      <div className="chart-stats">
        <div>
          <strong>{number(last)}</strong>
          <span>Último</span>
        </div>
        <div>
          <strong>{number(best)}</strong>
          <span>Mejor</span>
        </div>
        <div>
          <strong className={change > 0 ? 'positive' : ''}>
            {change > 0 ? '+' : ''}
            {number(change)}
          </strong>
          <span>
            {values.length === 1
              ? 'Sin comparación aún'
              : `Últimas ${Math.min(5, values.length)} sesiones`}
          </span>
        </div>
      </div>
      <div
        className="chart"
        role="img"
        aria-label={`${title} por sesión. Último: ${number(last)} ${unit}. Mejor: ${number(best)} ${unit}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={points}
            margin={{ top: 10, right: 8, left: -22, bottom: 4 }}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#458969" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#458969" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#edf0ed" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  timeZone: 'Europe/Madrid',
                })
              }
              tick={{ fontSize: 11, fill: '#858c89' }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#858c89' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              labelFormatter={(value) =>
                new Date(String(value)).toLocaleString('es-ES', {
                  timeZone: 'Europe/Madrid',
                })
              }
              formatter={(value) => [`${number(Number(value))} ${unit}`, title]}
              contentStyle={{
                borderRadius: 14,
                border: '1px solid #e5e9e5',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#458969"
              strokeWidth={2.5}
              fill={`url(#${id})`}
              dot={{ r: 4, fill: '#458969', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="chart-data">
        <summary>Ver datos por sesión</summary>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>{title}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.id}>
                <td>{dateLabel(point.date)}</td>
                <td>
                  {number(point[metric])} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
