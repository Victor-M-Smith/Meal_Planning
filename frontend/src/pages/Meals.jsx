import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeals, deleteMeal } from '../api'

const PROTEIN_COLORS = {
  Vegetarian: 'bg-green-100 text-green-700',
  Chicken:    'bg-yellow-100 text-yellow-700',
  Beef:       'bg-red-100 text-red-700',
  Lamb:       'bg-purple-100 text-purple-700',
  Fish:       'bg-blue-100 text-blue-700',
  Pork:       'bg-orange-100 text-orange-700',
  Other:      'bg-gray-100 text-gray-600',
}

function StarRating({ value, max = 10 }) {
  const filled = Math.round((value / max) * 5)
  return (
    <span className="text-yellow-400 text-sm" title={`${value}/10`}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  )
}

export default function Meals() {
  const [meals, setMeals] = useState([])
  const [search, setSearch] = useState('')
  const [filterProtein, setFilterProtein] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    try {
      setLoading(true)
      setMeals(await getMeals())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await deleteMeal(id)
      setMeals(m => m.filter(x => x.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  const proteins = [...new Set(meals.map(m => m.protein_type))].sort()

  const filtered = meals.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchProtein = !filterProtein || m.protein_type === filterProtein
    return matchSearch && matchProtein
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{meals.length} meal{meals.length !== 1 ? 's' : ''} in your collection</p>
        </div>
        <Link to="/meals/new" className="btn-primary">
          + Add Meal
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input
          className="input max-w-xs"
          placeholder="Search meals…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input max-w-xs"
          value={filterProtein}
          onChange={e => setFilterProtein(e.target.value)}
        >
          <option value="">All proteins</option>
          {proteins.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {loading && <p className="text-gray-400">Loading…</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🍽</p>
          <p className="font-medium">No meals yet</p>
          <p className="text-sm mt-1">Add your first meal to get started</p>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map(meal => (
          <div key={meal.id} className="card p-4 flex items-center gap-4 hover:border-brand-200 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-gray-900">{meal.name}</h2>
                <span className={`badge ${PROTEIN_COLORS[meal.protein_type] || PROTEIN_COLORS.Other}`}>
                  {meal.protein_type}
                </span>
                <span className="badge bg-gray-100 text-gray-600">{meal.general_class}</span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                <StarRating value={meal.rating} />
                <span>Complexity {meal.complexity}/10</span>
                <span>Serves {meal.serves}</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to={`/meals/${meal.id}/edit`} className="btn-secondary btn-sm">Edit</Link>
              <button
                onClick={() => handleDelete(meal.id, meal.name)}
                className="btn-danger btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
