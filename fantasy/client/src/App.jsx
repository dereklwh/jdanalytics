import { Routes, Route } from 'react-router-dom'
import Players from './pages/Players'
import PlayerDetail from './pages/PlayerDetail'
import Teams from './pages/Teams'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Players />} />
        <Route path="/players/:id" element={<PlayerDetail />} />
        <Route path="/teams" element={<Teams />} />
      </Routes>
    </>
  )
}
