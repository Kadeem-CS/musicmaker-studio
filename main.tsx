import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import './styles/index.css'
import './styles/tailwind.css'
import './styles/theme.css'

function Root() {
  const [signedIn, setSignedIn] = useState(false)

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-10 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white">MusicMaker Studio</h1>
          <p className="text-slate-400 text-center">
            Sign in to create, discover, and save your music.
          </p>

          <div className="w-full flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={async () => {
              const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null
              const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement | null

              const email = emailInput?.value ?? ''
              const password = passwordInput?.value ?? ''

              if (!email || !password) {
                alert('Please enter both email and password')
                return
              }

              try {
                const res = await fetch('http://localhost:5000/api/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email, password }),
                })

                const data = await res.json()

                if (res.ok) {
                  setSignedIn(true)
                  console.log('Logged in:', data)
                } else {
                  alert(data.message || 'Login failed')
                }
              } catch (error) {
                console.error('Login error:', error)
                alert('Could not connect to backend')
              }
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition"
          >
            Sign In
          </button>

          <p className="text-slate-500 text-sm">
            Don't have an account?{' '}
            <span className="text-purple-400 cursor-pointer hover:underline">Sign up</span>
          </p>
        </div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)