import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMeal, createMeal, updateMeal, getIngredients } from '../api'

const PROTEIN_TYPES = ['Vegetarian', 'Chicken', 'Beef', 'Lamb', 'Fish', 'Pork', 'Other']
const GENERAL_CLASSES = ['Pasta', 'Curry', 'Salad', 'Burger', 'Soup', 'Stir-fry', 'Roast', 'Pizza', 'Tacos', 'Stew', 'Other']
const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'item', 'pinch', 'piece']

const empty = () => ({
  name: '',
  protein_type: 'Chicken',
  general_class: 'Other',
  serves: 4,
  complexity: 5,
  rating: 7,
  recipe: '',
  comments: '',
  ingredients: [],
})

const emptyIng = () => ({ ingredient_name: '', quantity: '', unit: 'g' })

export default function MealForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(empty())
  const [ingredients, setIngredients] = useState([emptyIng()])
  const [knownIngredients, setKnownIngredients] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getIngredients().then(setKnownIngredients).catch(() => {})
    if (isEdit) {
      getMeal(id).then(meal => {
        setForm({
          name: meal.name,
          protein_type: meal.protein_type,
          general_class: meal.general_class,
          serves: meal.serves,
          complexity: meal.complexity,
          rating: meal.rating,
          recipe: meal.recipe || '',
          comments: meal.comments || '',
        })
        setIngredients(
          meal.ingredients.length > 0
            ? meal.ingredients.map(mi => ({
                ingredient_name: mi.ingredient.name,
                quantity: mi.quantity,
                unit: mi.unit,
              }))
            : [emptyIng()]
        )
      }).catch(e => setError(e.message))
    }
  }, [id])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))
  const setNum = (field) => (e) => setForm(f => ({ ...f, [field]: Number(e.target.value) }))

  const updateIng = (i, field, value) => {
    setIngredients(ings => ings.map((ing, idx) => idx === i ? { ...ing, [field]: value } : ing))
  }
  const addIng = () => setIngredients(i => [...i, emptyIng()])
  const removeIng = (i) => setIngredients(ings => ings.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        serves: Number(form.serves),
        complexity: Number(form.complexity),
        rating: Number(form.rating),
        ingredients: ingredients
          .filter(i => i.ingredient_name.trim() && i.quantity)
          .map(i => ({
            ingredient_name: i.ingredient_name.trim().toLowerCase(),
            quantity: Number(i.quantity),
            unit: i.unit,
          })),
      }
      if (isEdit) {
        await updateMeal(id, payload)
      } else {
        await createMeal(payload)
      }
      navigate('/meals')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Meal' : 'Add New Meal'}</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Basic Info</h2>

          <div>
            <label className="label">Meal Name *</label>
            <input className="input" value={form.name} onChange={set('name')} required placeholder="e.g. Spaghetti Bolognese" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Protein Type *</label>
              <select className="input" value={form.protein_type} onChange={set('protein_type')}>
                {PROTEIN_TYPES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">General Class *</label>
              <select className="input" value={form.general_class} onChange={set('general_class')}>
                {GENERAL_CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Serves</label>
              <input className="input" type="number" min="1" max="20" value={form.serves} onChange={setNum('serves')} />
            </div>
            <div>
              <label className="label">Complexity (1–10)</label>
              <input className="input" type="number" min="1" max="10" value={form.complexity} onChange={setNum('complexity')} />
            </div>
            <div>
              <label className="label">Rating (1–10)</label>
              <input className="input" type="number" min="1" max="10" value={form.rating} onChange={setNum('rating')} />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Ingredients</h2>
            <button type="button" onClick={addIng} className="btn-secondary btn-sm">+ Add Row</button>
          </div>

          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  className="input flex-1"
                  placeholder="Ingredient name"
                  list="known-ingredients"
                  value={ing.ingredient_name}
                  onChange={e => updateIng(i, 'ingredient_name', e.target.value)}
                />
                <datalist id="known-ingredients">
                  {knownIngredients.map(k => <option key={k.id} value={k.name} />)}
                </datalist>
                <input
                  className="input w-24"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={e => updateIng(i, 'quantity', e.target.value)}
                />
                <select className="input w-24" value={ing.unit} onChange={e => updateIng(i, 'unit', e.target.value)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => removeIng(i)}
                  className="text-red-400 hover:text-red-600 px-1 text-lg leading-none"
                  title="Remove"
                >×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Recipe & Comments */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">Recipe & Notes</h2>
          <div>
            <label className="label">Recipe</label>
            <textarea
              className="input min-h-[120px] resize-y"
              placeholder="Cooking steps…"
              value={form.recipe}
              onChange={set('recipe')}
            />
          </div>
          <div>
            <label className="label">Comments</label>
            <textarea
              className="input min-h-[60px] resize-y"
              placeholder="Optional notes…"
              value={form.comments}
              onChange={set('comments')}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Meal'}
          </button>
          <button type="button" onClick={() => navigate('/meals')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
