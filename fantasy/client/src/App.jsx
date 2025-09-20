import { supabase } from './supabaseClient'
import { useState } from 'react'

function App() {
  const [players, setPlayers] = useState([])

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('test_database').select('*')
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data)
      console.log('Fetched players:', data)
    }
  }

  return (
    <div className="flex flex-col items-center w-7xl mx-auto p-4">
      <h1 className='mb-6'>Players</h1>
      <button onClick={fetchPlayers}>Fetch Players</button>
      <div className='grid grid-cols-5 gap-4 mt-4'>
        {players.map((player) => (
          <div key={player.id} className='flex flex-col items-center border rounded hover:bg-indigo-500'>
            <p>{player.first_name} {player['Last Name']}</p>
            <img src={player.Headshot} alt={`${player.first_name} ${player['Last Name']}`} className='hover:-translate-y-1 transition-transform duration-200' />
          </div>
        ))}
      </div>

    </div>
  )
}

export default App
