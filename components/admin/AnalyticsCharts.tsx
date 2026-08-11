'use client'

/**
 * GRÁFICOS PROFESIONALES PARA ANALYTICS (recharts)
 * ================================================
 * Sustituyen a los gráficos caseros de divs (sin ejes y con alturas
 * distorsionadas). Ejes reales, tooltips, medias y proporciones fieles.
 * Reutilizables en cualquier pestaña del panel de analytics.
 */

import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

// Paleta consistente
export const CHART_COLORS = ['#0284c7', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b']

// ---------------------------------------------------------------------------
// Contenedor de tarjeta con título/subtítulo/pie
// ---------------------------------------------------------------------------
export function ChartCard({
  titulo,
  subtitulo,
  children,
  footer,
}: {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">{titulo}</h3>
        {subtitulo && <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>}
      </div>
      <div className="p-4">{children}</div>
      {footer && <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60">{footer}</div>}
    </div>
  )
}

// Tooltip con estilo propio
function TooltipBox({ active, payload, label, unidades }: any) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-gray-900/95 text-white rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-bold">{Number(p.value).toLocaleString('es-ES')}</span>
          {unidades?.[p.dataKey] ? ` ${unidades[p.dataKey]}` : ''}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Serie diaria (área con degradado, media de referencia)
// ---------------------------------------------------------------------------
export function SerieDiaria({
  data,
  dataKey = 'count',
  nombre,
  color = '#0284c7',
  altura = 240,
}: {
  data: Array<Record<string, any>>
  dataKey?: string
  nombre: string
  color?: string
  altura?: number
}) {
  const total = data.reduce((s, d) => s + (Number(d[dataKey]) || 0), 0)
  const media = data.length > 0 ? total / data.length : 0
  const gradId = `grad-${nombre.replace(/\W/g, '')}`

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        <Tooltip content={<TooltipBox />} />
        {media > 0 && (
          <ReferenceLine
            y={media}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: `media ${media.toFixed(1)}`, position: 'insideTopRight', fontSize: 10, fill: '#64748b' }}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          name={nombre}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Barras mensuales con línea secundaria opcional (p.ej. rutas + km)
// ---------------------------------------------------------------------------
export function BarrasMensuales({
  data,
  barKey = 'count',
  barNombre,
  lineKey,
  lineNombre,
  barColor = '#0284c7',
  lineColor = '#10b981',
  unidades,
  altura = 260,
}: {
  data: Array<Record<string, any>>
  barKey?: string
  barNombre: string
  lineKey?: string
  lineNombre?: string
  barColor?: string
  lineColor?: string
  unidades?: Record<string, string>
  altura?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
        <YAxis
          yAxisId="izq"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={44}
        />
        {lineKey && (
          <YAxis
            yAxisId="der"
            orientation="right"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
        )}
        <Tooltip content={<TooltipBox unidades={unidades} />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="izq" dataKey={barKey} name={barNombre} fill={barColor} radius={[6, 6, 0, 0]} maxBarSize={38} />
        {lineKey && (
          <Line
            yAxisId="der"
            type="monotone"
            dataKey={lineKey}
            name={lineNombre || lineKey}
            stroke={lineColor}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// Donut de distribución (con etiquetas y porcentajes)
// ---------------------------------------------------------------------------
export function DonutDistribucion({
  data,
  nameKey,
  valueKey = 'count',
  altura = 240,
}: {
  data: Array<Record<string, any>>
  nameKey: string
  valueKey?: string
  altura?: number
}) {
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0)
  if (total === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">Sin datos todavía</p>
  }
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius="52%"
          outerRadius="80%"
          paddingAngle={2}
          label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false}
          fontSize={11}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<TooltipBox />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---------------------------------------------------------------------------
// KPI compacto para cabeceras de pestaña
// ---------------------------------------------------------------------------
export function KpiCard({
  etiqueta,
  valor,
  detalle,
  icono,
  color = 'text-sky-600',
}: {
  etiqueta: string
  valor: string | number
  detalle?: string
  icono?: string
  color?: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
        {icono && <span>{icono}</span>}
        {etiqueta}
      </p>
      <p className={`text-2xl font-bold mt-1 tabular-nums ${color}`}>
        {typeof valor === 'number' ? valor.toLocaleString('es-ES') : valor}
      </p>
      {detalle && <p className="text-[11px] text-gray-400 mt-0.5">{detalle}</p>}
    </div>
  )
}
