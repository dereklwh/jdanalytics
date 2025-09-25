import { supabase } from './supabaseClient'
import { useState } from 'react'
import { FaSearch } from "react-icons/fa";

function App() {
  const [players, setPlayers] = useState([])
  const [searchText, setSearchText] = useState('')

  const fetchPlayers = async () => {
    const { data, error } = await supabase.from('test_database').select('*')
    if (error) {
      console.error('Error fetching players:', error)
    } else {
      setPlayers(data)
      console.log('Fetched players:', data)
    }
  }

  const handleSearch = (e) => {
    setSearchText(e.target.value.toLowerCase());
  }

  const filteredNames = players.filter((player) =>
    player.first_name.toLowerCase().includes(searchText)
  );

  return (
    <div className="flex flex-col items-center w-6xl mx-auto p-4">
      <h1 className='mb-6'>Players</h1>
      <button onClick={fetchPlayers}>Fetch Players</button>
      { players.length > 0 ? 
        <div className="relative mt-4 w-1/2">
          <input
            type="text"
            placeholder="Search Players..."
            onChange={handleSearch}
            value={searchText}
            className="border-b px-10 py-2 text-black w-full"
          />
          <FaSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
        </div> : null }
      {/* <input
          type="text"
          placeholder="Search Players..."
          onChange={handleSearch}
          value={searchText}
          className="border px-3 py-2 w-1/2 rounded-lg bg-gray-200 text-black"
      /> */}

      <div className='grid grid-cols-5 gap-4 mt-4'>
        {filteredNames.map((player) => (
          <div key={player.id} className='flex flex-col items-center border rounded hover:bg-indigo-200 duration-400'>
            <p>{player.first_name} {player['Last Name']}</p>
            <img src={player.Headshot} alt={`${player.first_name} ${player['Last Name']}`} />
            <div className='p-2 items-center bg-gray-300 w-full'>
              <p className='font-bold'>Career Stats</p>
              <p>Games Played: {player['Games Played']}</p>
              <p>Goals: {player.Goals}</p>
              <p>Assists: {player.Assists}</p>
              <p>Points: {player.Points}</p>
              <p>Position: {player.Position}</p>
              <p>Team: {player['Team Abbreviation']}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

export default App
