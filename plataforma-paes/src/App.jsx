import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Layout from './components/Layout'
import { Cargando } from './components/ui'
import Admin from './pages/Admin'
import Asignatura from './pages/Asignatura'
import Clases from './pages/Clases'
import Evaluaciones from './pages/Evaluaciones'
import EstudianteInicio from './pages/EstudianteInicio'
import Login from './pages/Login'
import ProfesorMateriales from './pages/ProfesorMateriales'

function Protegida() {
  const { perfil, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!perfil) return <Navigate to="/login" replace />
  return <Layout />
}

// La pantalla de inicio depende del rol.
function Inicio() {
  const { perfil } = useAuth()
  if (perfil.rol === 'admin') return <Navigate to="/admin/estudiantes" replace />
  return perfil.rol === 'profesor' ? <ProfesorMateriales /> : <EstudianteInicio />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protegida />}>
            <Route index element={<Inicio />} />
            <Route path="asignatura/:id" element={<Asignatura />} />
            <Route path="clases" element={<Clases />} />
            <Route path="evaluaciones" element={<Evaluaciones />} />
            <Route path="admin/:seccion" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
