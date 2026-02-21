const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

// Meals
export const getMeals = () => request('GET', '/meals')
export const getMeal = (id) => request('GET', `/meals/${id}`)
export const createMeal = (data) => request('POST', '/meals', data)
export const updateMeal = (id, data) => request('PUT', `/meals/${id}`, data)
export const deleteMeal = (id) => request('DELETE', `/meals/${id}`)
export const getIngredients = () => request('GET', '/meals/ingredients/all')

// Weekly Plans
export const getWeeklyPlans = () => request('GET', '/weekly-plans')
export const getWeeklyPlan = (id) => request('GET', `/weekly-plans/${id}`)
export const generatePlan = (data) => request('POST', '/weekly-plans/generate', data)
export const deleteWeeklyPlan = (id) => request('DELETE', `/weekly-plans/${id}`)
export const replaceMeal = (planId, planMealId, data) =>
  request('PUT', `/weekly-plans/${planId}/meals/${planMealId}/replace`, data)
export const updateServings = (planId, planMealId, servings) =>
  request('PATCH', `/weekly-plans/${planId}/meals/${planMealId}/servings`, { servings })

// Shopping list
export const getShoppingList = (planId) => request('GET', `/shopping-list/${planId}`)
