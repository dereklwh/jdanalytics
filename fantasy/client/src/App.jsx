import { useEffect, useMemo, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import Nav from './components/nav'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function App() {
  const [players, setPlayers] = useState([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // small debounce helper
  const debounce = useMemo(() => {
    let t
    return (fn, wait = 250) => {
      clearTimeout(t)
      t = setTimeout(fn, wait)
    }
  }, [])

  const fetchPlayers = async (q = '') => {
    try {
      setLoading(true)
      setError(null)
      const url = q
        ? `${API_BASE}/players?q=${encodeURIComponent(q)}`
        : `${API_BASE}/players`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setPlayers(data)
    } catch (e) {
      console.error('Error fetching players:', e)
      setError('Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlayers() }, [])

  // server side searching with debounce
  useEffect(() => {
    debounce(() => fetchPlayers(searchText), 250)
  }, [searchText, debounce])

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
      <Nav />
      <h1 className="mb-6">Players</h1>

      <div className="relative mt-4 w-full sm:w-2/3 lg:w-1/2">
        <input
          type="text"
          placeholder="Search players…"
          onChange={(e) => setSearchText(e.target.value)}
          value={searchText}
          className="border-b px-10 py-2 text-black w-full"
        />
        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
      </div>

      {loading && <p className="mt-4 text-gray-500">Loading…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6 w-full">
        {players.map((player) => (
          <div
            key={player.id ?? player['Player ID']}
            className="flex flex-col items-center rounded-lg border hover:bg-indigo-200 transition-colors duration-300"
          >
            <p className="p-2 font-medium">
              {player.firstName} {player.lastName}
            </p>

            {player.headshot && (
              <img
                src={player.headshot}
                alt={`${player.firstName} ${player.lastName}`}
                className="w-full object-cover"
                loading="lazy"
              />
            )}

            <div className="p-2 bg-gray-100 w-full rounded-b-lg text-sm text-gray-700">
              <p className="font-bold text-black">Career Stats</p>
              <p>Games Played: {player.gamesPlayed}</p>
              <p>Goals: {player.goals}</p>
              <p>Assists: {player.assists}</p>
              <p>Points: {player.points}</p>
              <p>Position: {player.position}</p>
              <p>Team: {player.teamAbbr}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
