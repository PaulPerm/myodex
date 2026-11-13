import { createContext, useContext, useEffect, useState } from 'react'

const KEY = 'myodex.theme'

// The body map is an SVG library that needs real hex colors, not CSS variables.
const MAP_COLORS = {
  light: { body: '#c5dde6', highlight: ['#fd6e6e', '#f45b5b'] },
  dark:  { body: '#48484f', highlight: ['#e35335', '#ff6a4d'] },
}

const BAR_COLORS = { light: '#eaf5f9', dark: '#18181b' }

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage unavailable */ }
  // first visit: follow the phone's setting
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // keep the phone's browser bar the same color as the app
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR_COLORS[theme])
    try { localStorage.setItem(KEY, theme) } catch { /* storage unavailable */ }
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, mapColors: MAP_COLORS[theme] }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)