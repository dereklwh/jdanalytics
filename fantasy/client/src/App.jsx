import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import Teams from './pages/Teams'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/teams" element={<Teams />} />
        {/* TODO(#5): Add `/compare` route after Compare page and selection flow are implemented. */}
      </Routes>
    </>
  )
}
