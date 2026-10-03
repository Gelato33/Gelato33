import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { marca } from './lib/marca'

document.documentElement.style.setProperty('--ac', marca.color)
document.title = marca.nombre

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
