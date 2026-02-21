import { useState, useEffect } from 'react'
import { getWeeklyPlans, getShoppingList } from '../api'

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function ShoppingList() {
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [items, setItems] = useState([])
  const [overrides, setOverrides] = useState({}) // key: ingredient_id+unit → quantity override
  const [checked, setChecked] = useState({})    // key: ingredient_id+unit → boolean
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getWeeklyPlans()
      .then(p => {
        setPlans(p)
        if (p.length > 0) setSelectedPlanId(p[0].id)
      })
      .catch(e => setError(e.message))
  }, [])

  useEffect(() => {
    if (!selectedPlanId) return
    setLoading(true)
    setOverrides({})
    setChecked({})
    getShoppingList(selectedPlanId)
      .then(data => setItems(data.items))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedPlanId])

  const key = (item) => `${item.ingredient_id}:${item.unit}`

  const displayQty = (item) => {
    const k = key(item)
    return overrides[k] !== undefined ? overrides[k] : item.total_quantity
  }

  const handleCopy = () => {
    const text = items
      .filter(i => !checked[key(i)])
      .map(i => `${displayQty(i)} ${i.unit}  ${i.ingredient_name}`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }

  const uncheckedCount = items.filter(i => !checked[key(i)]).length

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          {items.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {uncheckedCount} of {items.length} items remaining
            </p>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={handleCopy} className="btn-secondary">
            📋 Copy List
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Plan selector */}
      {plans.length > 0 && (
        <div className="mb-5">
          <label className="label">Select week</label>
          <select
            className="input max-w-xs"
            value={selectedPlanId || ''}
            onChange={e => setSelectedPlanId(Number(e.target.value))}
          >
            {plans.map(p => (
              <option key={p.id} value={p.id}>
                {formatDate(p.start_date)} – {formatDate(p.end_date)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading && <p className="text-gray-400">Loading…</p>}

      {!loading && plans.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-medium">No weekly plan yet</p>
          <p className="text-sm mt-1">Generate a weekly plan first to see your shopping list</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="card divide-y divide-gray-100">
          {items.map(item => {
            const k = key(item)
            const isChecked = !!checked[k]
            return (
              <div
                key={k}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${isChecked ? 'bg-gray-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={e => setChecked(c => ({ ...c, [k]: e.target.checked }))}
                  className="w-4 h-4 accent-brand-500 rounded"
                />
                <span className={`flex-1 capitalize ${isChecked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {item.ingredient_name}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={displayQty(item)}
                    onChange={e => setOverrides(o => ({ ...o, [k]: Number(e.target.value) }))}
                    className="w-20 text-right rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-300"
                    disabled={isChecked}
                  />
                  <span className="text-sm text-gray-400 w-8">{item.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && selectedPlanId && items.length === 0 && plans.length > 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p>No ingredients found — add ingredients to your meals first.</p>
        </div>
      )}
    </div>
  )
}
