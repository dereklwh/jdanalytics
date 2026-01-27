import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Nav from '../components/nav'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function PlayerDetail() {
  const { id } = useParams()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/players/${id}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Player not found')
          }
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        setPlayer(data.player)
      } catch (e) {
        console.error('Error fetching player:', e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayer()
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center max-w-4xl mx-auto p-4">
        <Nav />
        <p className="mt-8 text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center max-w-4xl mx-auto p-4">
        <Nav />
        <div className="mt-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            &larr; Back to Players
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-4">
      <Nav />

      <Link
        to="/"
        className="self-start mt-4 text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        &larr; Back to Players
      </Link>

      {/* Hero Section */}
      <div className="w-full mt-6 rounded-xl bg-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {player.headshot && (
            <img
              src={player.headshot}
              alt={`${player.firstName} ${player.lastName}`}
              className="w-40 h-40 object-cover rounded-lg shadow-md"
            />
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold text-white">
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-200">
                {player.position}
              </span>
              <span className="bg-slate-700 px-3 py-1 rounded-full text-sm text-slate-200">
                {player.teamAbbr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="w-full mt-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Career Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Games Played" value={player.gamesPlayed} />
          <StatCard label="Points" value={player.points} />
          <StatCard label="Goals" value={player.goals} />
          <StatCard label="Assists" value={player.assists} />
        </div>
      </div>

      {/* Placeholder for future season stats */}
      <div className="w-full mt-8 p-6 border border-dashed border-gray-300 rounded-lg text-center text-gray-400">
        <p>Season-by-season stats coming soon</p>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
      <p className="text-2xl font-bold text-indigo-600">{value ?? 0}</p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  )
}
