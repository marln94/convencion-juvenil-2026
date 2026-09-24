import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { configurarAutenticacion } from './lib/auth'
import './index.css'

configurarAutenticacion()

const contenedor = document.getElementById('root')
if (!contenedor) {
  throw new Error('No se encontró el nodo #root')
}

createRoot(contenedor).render(
  <StrictMode>
    <App />
  </StrictMode>
)