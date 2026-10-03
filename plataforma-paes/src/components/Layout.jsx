import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { marca } from '../lib/marca'

const MENU = {
  estudiante: [
    { a: '/', t: 'Inicio', fin: true },
    { a: '/clases', t: 'Clases' },
    { a: '/evaluaciones', t: 'Evaluaciones' },
  ],
  profesor: [
    { a: '/', t: 'Materiales', fin: true },
    { a: '/clases', t: 'Clases' },
    { a: '/evaluaciones', t: 'Evaluaciones' },
  ],
  admin: [
    { a: '/admin/estudiantes', t: 'Estudiantes' },
    { a: '/admin/docentes', t: 'Docentes' },
    { a: '/admin/asignaturas', t: 'Asignaturas' },
    { a: '/admin/cursos', t: 'Cursos' },
    { a: '/clases', t: 'Clases' },
    { a: '/evaluaciones', t: 'Evaluaciones' },
  ],
}

const ETIQUETA_ROL = { estudiante: 'Estudiante', profesor: 'Docente', admin: 'Administrador' }

export default function Layout() {
  const { perfil, salir } = useAuth()
  return (
    <div className="app">
      <header className="barra">
        <div className="marca">
          <i aria-hidden="true">{marca.nombre.charAt(0)}</i>
          {marca.nombre}
        </div>
        <nav aria-label="Principal">
          {MENU[perfil.rol].map((l) => (
            <NavLink key={l.a} to={l.a} end={l.fin}>
              {l.t}
            </NavLink>
          ))}
        </nav>
        <span className="chip" title={ETIQUETA_ROL[perfil.rol]}>{perfil.nombre}</span>
        <button type="button" className="chip boton" onClick={salir}>
          Salir
        </button>
      </header>
      <main className="principal">
        <Outlet />
      </main>
    </div>
  )
}
