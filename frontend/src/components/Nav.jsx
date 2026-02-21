import { NavLink } from 'react-router-dom'

const links = [
  { to: '/meals', label: '🍽  Meals' },
  { to: '/plan', label: '📅  Weekly Plan' },
  { to: '/shopping', label: '🛒  Shopping List' },
]

export default function Nav() {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-8 h-14">
        <span className="font-bold text-brand-600 text-lg tracking-tight">🥘 Meal Planner</span>
        <div className="flex gap-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
