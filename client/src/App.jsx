import { supabase } from './supabaseClient'
import { useState } from 'react'

function App() {
  const [players, setPlayers] = useState([])

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('players').select('*')
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data)
    }
  }

  return (
    <div>
      <h1>Players</h1>
      <button onClick={fetchPlayers}>Fetch Players</button>
      <ul>
        {players.map((player) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
