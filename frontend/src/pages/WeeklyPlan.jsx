import { useState, useEffect, useCallback } from 'react'
import { generatePlan, getWeeklyPlans, getWeeklyPlan, deleteWeeklyPlan, getMeals, getMeal, replaceMeal, updateServings } from '../api'

const DAY_NAMES = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Monday']

const PROTEIN_TYPES = ['', 'Vegetarian', 'Chicken', 'Beef', 'Lamb', 'Fish', 'Pork', 'Other']
const GENERAL_CLASSES = ['', 'Pasta', 'Curry', 'Salad', 'Burger', 'Soup', 'Stir-fry', 'Roast', 'Pizza', 'Tacos', 'Stew', 'Other']

const PROTEIN_COLORS = {
  Vegetarian: 'bg-green-100 text-green-700',
  Chicken:    'bg-yellow-100 text-yellow-700',
  Beef:       'bg-red-100 text-red-700',
  Lamb:       'bg-purple-100 text-purple-700',
  Fish:       'bg-blue-100 text-blue-700',
  Pork:       'bg-orange-100 text-orange-700',
  Other:      'bg-gray-100 text-gray-600',
}

const STORAGE_KEY = 'meal-planner:day-constraints'

function nextWednesday() {
  const d = new Date()
  const day = d.getDay()
  const diff = (3 - day + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function emptyConstraints() {
  return DAY_NAMES.map(() => ({ protein_type: '', general_class: '' }))
}

function loadConstraintsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyConstraints()
    const parsed = JSON.parse(raw)
    return DAY_NAMES.map((_, i) => ({
      protein_type: parsed[i]?.protein_type ?? '',
      general_class: parsed[i]?.general_class ?? '',
    }))
  } catch {
    return emptyConstraints()
  }
}

// ── Meal Detail Modal ──────────────────────────────────────────────────────────

function MealDetailModal({ mealId, onClose }) {
  const [meal, setMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMeal(mealId)
      .then(setMeal)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [mealId])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          {loading ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : (
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{meal.name}</h2>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className={`badge ${PROTEIN_COLORS[meal.protein_type] || PROTEIN_COLORS.Other}`}>
                  {meal.protein_type}
                </span>
                <span className="badge bg-gray-100 text-gray-600">{meal.general_class}</span>
                <span className="badge bg-gray-100 text-gray-500">Serves {meal.serves}</span>
                <span className="badge bg-yellow-50 text-yellow-700">★ {meal.rating}/10</span>
                <span className="badge bg-blue-50 text-blue-700">Complexity {meal.complexity}/10</span>
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 shrink-0"
          >
            ×
          </button>
        </div>

        {/* Body */}
        {meal && (
          <div className="overflow-y-auto p-5 space-y-5">
            {/* Ingredients */}
            {meal.ingredients.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Ingredients</h3>
                <ul className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                  {meal.ingredients.map(mi => (
                    <li key={mi.id} className="flex justify-between px-3 py-2 text-sm bg-white">
                      <span className="text-gray-800 capitalize">{mi.ingredient.name}</span>
                      <span className="text-gray-500 font-mono">
                        {mi.quantity} {mi.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recipe */}
            {meal.recipe && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Recipe</h3>
                <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap leading-relaxed">
                  {meal.recipe}
                </div>
              </div>
            )}

            {/* Comments */}
            {meal.comments && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-amber-50 rounded-lg p-3 italic">{meal.comments}</p>
              </div>
            )}

            {!meal.recipe && !meal.comments && meal.ingredients.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No additional details added for this meal.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Day Constraints Editor ─────────────────────────────────────────────────────

function DayConstraintsEditor({ constraints, onChange }) {
  const hasAny = constraints.some(c => c.protein_type || c.general_class)

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Per-day constraints{' '}
          <span className="text-gray-400 font-normal normal-case">(leave blank = any)</span>
        </p>
        {hasAny && (
          <button
            type="button"
            onClick={() => onChange(emptyConstraints())}
            className="text-xs text-red-400 hover:text-red-600"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 overflow-hidden">
        {DAY_NAMES.map((day, i) => (
          <div key={day} className="flex items-center gap-2 px-3 py-2 bg-white">
            <span className="text-sm text-gray-600 w-24 shrink-0">{day}</span>
            <select
              className="input text-sm py-1 flex-1"
              value={constraints[i].protein_type}
              onChange={e => {
                const next = constraints.map((c, idx) =>
                  idx === i ? { ...c, protein_type: e.target.value } : c
                )
                onChange(next)
              }}
            >
              {PROTEIN_TYPES.map(p => (
                <option key={p} value={p}>{p || '— Any protein —'}</option>
              ))}
            </select>
            <select
              className="input text-sm py-1 flex-1"
              value={constraints[i].general_class}
              onChange={e => {
                const next = constraints.map((c, idx) =>
                  idx === i ? { ...c, general_class: e.target.value } : c
                )
                onChange(next)
              }}
            >
              {GENERAL_CLASSES.map(c => (
                <option key={c} value={c}>{c || '— Any class —'}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WeeklyPlan() {
  const [plans, setPlans] = useState([])
  const [activePlan, setActivePlan] = useState(null)
  const [allMeals, setAllMeals] = useState([])
  const [startDate, setStartDate] = useState(nextWednesday())
  const [defaultServings, setDefaultServings] = useState(4)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [swapTarget, setSwapTarget] = useState(null)
  const [editServings, setEditServings] = useState(null)
  const [viewMealId, setViewMealId] = useState(null)
  const [showConstraints, setShowConstraints] = useState(false)
  const [dayConstraints, setDayConstraints] = useState(() => loadConstraintsFromStorage())
  const [savedTooltip, setSavedTooltip] = useState(false)

  const load = useCallback(async () => {
    try {
      const [p, m] = await Promise.all([getWeeklyPlans(), getMeals()])
      setPlans(p)
      setAllMeals(m)
      if (p.length > 0) {
        setActivePlan(await getWeeklyPlan(p[0].id))
      }
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSaveDefaults = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dayConstraints))
    setSavedTooltip(true)
    setTimeout(() => setSavedTooltip(false), 2000)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const constraints = dayConstraints.map(c => ({
        protein_type: c.protein_type || null,
        general_class: c.general_class || null,
      }))
      const plan = await generatePlan({
        start_date: startDate,
        default_servings: defaultServings,
        day_constraints: constraints,
      })
      setActivePlan(plan)
      const p = await getWeeklyPlans()
      setPlans(p)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (planId) => {
    if (!confirm('Delete this weekly plan?')) return
    try {
      await deleteWeeklyPlan(planId)
      const p = await getWeeklyPlans()
      setPlans(p)
      setActivePlan(p.length > 0 ? await getWeeklyPlan(p[0].id) : null)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleSwap = async (newMealId) => {
    if (!swapTarget) return
    try {
      const updated = await replaceMeal(activePlan.id, swapTarget.planMealId, { meal_id: Number(newMealId) })
      setActivePlan(updated)
      setSwapTarget(null)
    } catch (e) {
      alert(e.message)
    }
  }

  const handleServingsSave = async () => {
    if (!editServings) return
    try {
      const updated = await updateServings(activePlan.id, editServings.planMealId, editServings.value)
      setActivePlan(updated)
      setEditServings(null)
    } catch (e) {
      alert(e.message)
    }
  }

  const sortedMeals = activePlan
    ? [...activePlan.meals].sort((a, b) => new Date(a.date) - new Date(b.date))
    : []

  const usedMealIds = new Set(sortedMeals.map(wpm => wpm.meal.id))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Meal Plan</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* ── Generate Controls ── */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Week starting (Wednesday)</label>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Default servings</label>
            <input
              className="input w-24"
              type="number"
              min="1"
              max="20"
              value={defaultServings}
              onChange={e => setDefaultServings(Number(e.target.value))}
            />
          </div>
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generating…' : '🎲 Generate Plan'}
          </button>
          <button
            type="button"
            onClick={() => setShowConstraints(v => !v)}
            className={`btn-secondary ml-auto ${showConstraints ? 'border-brand-300 text-brand-700 bg-brand-50' : ''}`}
          >
            ⚙ Day Constraints {showConstraints ? '▲' : '▼'}
          </button>
        </div>

        {showConstraints && (
          <>
            <DayConstraintsEditor constraints={dayConstraints} onChange={setDayConstraints} />
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
              <button onClick={handleSaveDefaults} className="btn-secondary btn-sm">
                💾 Save as default
              </button>
              {savedTooltip && (
                <span className="text-xs text-green-600 font-medium">✓ Saved!</span>
              )}
              <button
                onClick={() => setDayConstraints(emptyConstraints())}
                className="btn-secondary btn-sm text-gray-400"
              >
                Reset to blank
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Plan selector ── */}
      {plans.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {plans.map(p => (
            <button
              key={p.id}
              onClick={async () => setActivePlan(await getWeeklyPlan(p.id))}
              className={`btn-sm ${activePlan?.id === p.id ? 'btn-primary' : 'btn-secondary'}`}
            >
              {formatDate(p.start_date)} – {formatDate(p.end_date)}
            </button>
          ))}
        </div>
      )}

      {/* ── Active Plan ── */}
      {activePlan && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              Week of {formatDate(activePlan.start_date)} – {formatDate(activePlan.end_date)}
            </p>
            <button onClick={() => handleDelete(activePlan.id)} className="btn-danger btn-sm">
              Delete Plan
            </button>
          </div>

          <div className="grid gap-3">
            {sortedMeals.map(wpm => (
              <div key={wpm.id} className="card p-4">
                <div className="flex items-start gap-4">
                  {/* Day label */}
                  <div className="text-center w-20 shrink-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {new Date(wpm.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(wpm.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Meal info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{wpm.meal.name}</h3>
                      <span className={`badge ${PROTEIN_COLORS[wpm.meal.protein_type] || PROTEIN_COLORS.Other}`}>
                        {wpm.meal.protein_type}
                      </span>
                      <span className="badge bg-gray-100 text-gray-600">{wpm.meal.general_class}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Rating {wpm.meal.rating}/10 · Complexity {wpm.meal.complexity}/10
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {editServings?.planMealId === wpm.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          className="input w-16 text-center"
                          type="number"
                          min="1"
                          max="20"
                          value={editServings.value}
                          onChange={e => setEditServings(s => ({ ...s, value: Number(e.target.value) }))}
                        />
                        <button onClick={handleServingsSave} className="btn-primary btn-sm">✓</button>
                        <button onClick={() => setEditServings(null)} className="btn-secondary btn-sm">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditServings({ planMealId: wpm.id, value: wpm.servings })}
                        className="text-sm text-gray-500 hover:text-brand-600 px-2 py-1 rounded hover:bg-brand-50"
                      >
                        👥 {wpm.servings}
                      </button>
                    )}

                    <button
                      onClick={() => setViewMealId(wpm.meal.id)}
                      className="btn-secondary btn-sm"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setSwapTarget({ planMealId: wpm.id, currentMealId: wpm.meal.id })}
                      className="btn-secondary btn-sm"
                    >
                      Swap
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!activePlan && plans.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium">No plan yet</p>
          <p className="text-sm mt-1">Generate a plan above to get started</p>
        </div>
      )}

      {/* ── Meal Detail Modal ── */}
      {viewMealId && (
        <MealDetailModal mealId={viewMealId} onClose={() => setViewMealId(null)} />
      )}

      {/* ── Swap Modal ── */}
      {swapTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Choose a replacement</h2>
              <button onClick={() => setSwapTarget(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="overflow-y-auto space-y-2">
              {allMeals
                .filter(m => !usedMealIds.has(m.id) || m.id === swapTarget.currentMealId)
                .map(m => (
                  <button
                    key={m.id}
                    onClick={() => handleSwap(m.id)}
                    className="w-full text-left card p-3 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className={`badge ${PROTEIN_COLORS[m.protein_type] || PROTEIN_COLORS.Other}`}>
                        {m.protein_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{m.general_class} · Rating {m.rating}/10</p>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
