import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Nav from './components/Nav'
import Meals from './pages/Meals'
import MealForm from './pages/MealForm'
import WeeklyPlan from './pages/WeeklyPlan'
import ShoppingList from './pages/ShoppingList'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/plan" replace />} />
            <Route path="/meals" element={<Meals />} />
            <Route path="/meals/new" element={<MealForm />} />
            <Route path="/meals/:id/edit" element={<MealForm />} />
            <Route path="/plan" element={<WeeklyPlan />} />
            <Route path="/shopping" element={<ShoppingList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
