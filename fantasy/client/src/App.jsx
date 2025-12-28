import { useEffect, useMemo, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import Nav from './components/nav'
import { Routes, Route } from 'react-router-dom'
import Players from './pages/Players'
import Teams from './pages/Teams'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Players />} />
        <Route path="/teams" element={<Teams />} />
      </Routes>
    </>
  )
}
