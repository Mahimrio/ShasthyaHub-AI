# Recharts — Medical Data Visualization

## Setup Rule

ALWAYS wrap Recharts in ResponsiveContainer. Never use fixed pixel widths.
ALWAYS use tabular-nums CSS class on number labels (prevents layout shift).

## Macronutrient Donut Chart (GlycoVision)

```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const MACRO_COLORS = {
  Carbohydrates: '#f59e0b', // amber — carbs are the main concern for diabetics
  Protein:       '#3b82f6', // blue — neutral
  Fat:           '#ef4444', // red — secondary concern
}

export function MacroDonutChart({ carbs, protein, fat }: Props) {
  const data = [
    { name: 'Carbohydrates', value: Math.round(carbs * 4) }, // Convert g to kcal
    { name: 'Protein',       value: Math.round(protein * 4) },
    { name: 'Fat',           value: Math.round(fat * 9) },
  ]
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
             paddingAngle={3} dataKey="value" strokeWidth={0}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [`${v} kcal`]} />
        <Legend iconType="circle" iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

## Calorie Trend Line Chart (Reports history)

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

export function CalorieTrendChart({ analyses }: Props) {
  const data = analyses.map(a => ({
    date: format(new Date(a.created_at), 'MMM d'),
    calories: a.total_calories,
    risk: a.risk_level, // 'Green' | 'Yellow' | 'Red'
  }))

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
        <ReferenceLine y={500} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Safe', position: 'right', fontSize: 10 }} />
        <ReferenceLine y={700} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'High', position: 'right', fontSize: 10 }} />
        <Tooltip formatter={(v: number) => [`${v} kcal`]} />
        <Line type="monotone" dataKey="calories" stroke="#0ea5e9" strokeWidth={2}
              dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Glycemic Load Bar (single value vs. limit)

```typescript
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'

export function GlycemicLoadBar({ glycemicLoad }: { glycemicLoad: number }) {
  const color = glycemicLoad < 10 ? '#10b981' : glycemicLoad < 20 ? '#f59e0b' : '#ef4444'
  const data = [{ name: 'Glycemic Load', value: Math.min(glycemicLoad, 30) }]

  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40 }}>
        <XAxis type="number" domain={[0, 30]} hide />
        <YAxis type="category" dataKey="name" hide />
        <ReferenceLine x={10} stroke="#10b981" strokeDasharray="3 3" />
        <ReferenceLine x={20} stroke="#ef4444" strokeDasharray="3 3" />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={24}>
          <Cell fill={color} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
```

## Health Score Circle (SVG, not Recharts)

Use SVG for the health score circle — more control:
```typescript
export function HealthScoreCircle({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score < 40 ? '#ef4444' : score < 70 ? '#f59e0b' : '#10b981'

  return (
    <div className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="10"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUp to={score} className="text-3xl font-black tabular-nums" style={{ color }} />
        <span className="text-xs text-gray-400 mt-0.5">স্কোর</span>
      </div>
    </div>
  )
}
```