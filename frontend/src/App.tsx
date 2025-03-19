import { useState } from 'react'
import './App.scss'
import SignInSide from './pages/Login/Sign-In/SignInSide.tsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <SignInSide></SignInSide>
    </>
  )
}

export default App
