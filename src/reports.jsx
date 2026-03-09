import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Download } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

const DEFAULT_COLORS = {
  'Food': '#e8c04a', 'Transport': '#60a5fa', 'Health': '#34d399',
  'Entertainment': '#f472b6', 'Housing': '#a78bfa', 'Others': '#94a3b8',
}

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const card = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: '1rem',
  padding: '1.5rem',
}

export default function Reports({ userId }) {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (!userId) return
    async function load() {
      const [{ data: txData }, { data: catData }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', userId).order('date'),
        supabase.from('categories').select('*').eq('user_id', userId),
      ])
      setTransactions(txData || [])
      setCategories(catData || [])
      setLoading(false)
    }
    load()
  }, [userId])

  function getCategoryColor(name) {
    const cat = categories.find(c => c.name === name)
    return cat?.color || DEFAULT_COLORS[name] || '#94a3b8'
  }

  const monthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear
  })

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()

  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const total = monthTx
      .filter(t => new Date(t.date + 'T12:00:00').getDate() === day)
      .reduce((s, t) => s + t.amount, 0)
    return { day: String(day), total }
  })

  const categoryTotals = monthTx.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount
    return acc
  }, {})
  const categoryData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  const monthlyData = MONTH_SHORT.map((month, i) => {
    const total = transactions
      .filter(t => { const d = new Date(t.date); return d.getMonth() === i && d.getFullYear() === selectedYear })
      .reduce((s, t) => s + t.amount, 0)
    return { month, total }
  })

  function exportCSV() {
    const headers = ['Date', 'Description', 'Category', 'Amount']
    const rows = monthTx.map(t => [
      new Date(t.date + 'T12:00:00').toLocaleDateString('en-US'),
      `"${t.description}"`,
      t.category,
      t.amount.toFixed(2),
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fintrack-${MONTH_NAMES[selectedMonth].toLowerCase()}-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
      <div style={{
        width: '2rem', height: '2rem',
        border: '2px solid #e8c04a', borderTopColor: 'transparent',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite'
      }} />
    </div>
  )

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 4vw, 1.875rem)', fontWeight: 600, color: '#fff', margin: 0 }}>Reports</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>Detailed spending analysis</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ background: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#fff', outline: 'none' }}
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <button onClick={exportCSV} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1rem', borderRadius: '0.75rem',
            fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1',
            background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer'
          }}>
            <Download style={{ width: '1rem', height: '1rem' }} />Export CSV
          </button>
        </div>
      </div>

      {/* Summary cards — responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total spent', value: fmt(monthTx.reduce((s, t) => s + t.amount, 0)) },
          { label: 'Transactions', value: monthTx.length },
          { label: 'Daily average', value: fmt(monthTx.reduce((s, t) => s + t.amount, 0) / (daysInMonth || 1)) },
        ].map(({ label, value }) => (
          <div key={label} style={card}>
            <p style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ color: '#fff', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', fontWeight: 600, wordBreak: 'break-word' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Daily line chart */}
      <div style={{ ...card, marginBottom: '1rem' }}>
        <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>
          Daily spending — {MONTH_NAMES[selectedMonth]}
        </h2>
        {monthTx.length === 0 ? (
          <div style={{ height: '13rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>No transactions this month</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={60} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#fff' }}
                formatter={v => [fmt(v), 'Spent']}
                labelFormatter={l => `Day ${l}`}
              />
              <Line type="monotone" dataKey="total" stroke="#e8c04a" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#e8c04a' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category + Monthly — responsive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Category bar chart */}
        <div style={card}>
          <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>By category</h2>
          {categoryData.length === 0 ? (
            <div style={{ height: '12rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>No data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#fff' }}
                  formatter={v => [fmt(v)]}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {categoryData.map(entry => (
                    <Cell key={entry.name} fill={getCategoryColor(entry.name)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly overview */}
        <div style={card}>
          <h2 style={{ color: '#fff', fontWeight: 600, marginBottom: '1.5rem', marginTop: 0 }}>
            Monthly overview — {selectedYear}
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={14}>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#fff' }}
                formatter={v => [fmt(v), 'Total']}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={i === selectedMonth ? '#e8c04a' : '#e8c04a33'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}