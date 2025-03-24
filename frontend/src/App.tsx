import { useState } from 'react'
import './App.scss'
import SignInSide from './pages/Login/Sign-In/SignInSide.tsx'
import MiniDrawer from './pages/Home/HomePage.tsx'
import HomePage from './pages/Home/HomePage.tsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <HomePage></HomePage>
    </>
  )
}

export default App
