import { React, useEffect, useState } from 'react'
import Nav from '../components/nav'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function Teams() {
    const [standings, setStandings] = useState([])

    useEffect(() => {
        const fetchStandings = async () => {
          try {
    
            const res = await fetch(`${API_BASE}/standings`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
    
            const data = await res.json()
            setStandings(data.standings)
          } catch (e) {
            console.error(e)
          } finally {
          }
        }
    
        fetchStandings()
      }, [])

    return (
        <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
            <Nav />
            <h1 className="text-3xl font-bold mb-4">Teams Page</h1>
            <p>Teams </p>
            <table className="border-collapse w-full">
                <thead>
                    <tr className="border-b">
                        <th className="text-right py-2 pr-4">#</th>
                        <th className="text-left py-2">Team</th>
                        <th className="text-right">GP</th>
                        <th className="text-right">Pts</th>
                        <th className="text-right">Goals</th>
                        <th className="text-right">Faceoff</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((team, index) => (
                        <tr key={team.id} className="border-b hover:bg-gray-100">
                            <td className="text-right pr-4 text-gray-500">
                                {index + 1}
                            </td>
                            <td className="py-2 font-medium">{team.team_full_name}</td>
                            <td className="text-right">{team.games_played}</td>
                            <td className="text-right font-bold">{team.points}</td>
                            <td className="text-right">{team.goals_for}</td>
                            <td className="text-right">{(team.faceoff_win_pct * 100).toFixed(2)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

}