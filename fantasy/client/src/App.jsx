import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

// Code-split the heavier routes so the landing page doesn't ship the player
// list, detail charts, or d3-force bubble view in the initial bundle.
const Players = lazy(() => import('./pages/Players'))
const PlayerDetail = lazy(() => import('./pages/PlayerDetail'))
const Teams = lazy(() => import('./pages/Teams'))

export default function App() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8 text-gray-500">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/teams" element={<Teams />} />
        {/* TODO(#5): Add `/compare` route after Compare page and selection flow are implemented. */}
      </Routes>
    </Suspense>
  )
}
