import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import './App.css'

// 1. Define la estructura de tu tabla 'usuarios'
// Ajusta los campos y tipos (string, number, boolean) según tu base de datos real
interface Usuario {
  id: string | number;
  nombre_usuario?: string;
  email?: string;
  created_at?: string;
}

const supabaseUrl = "https://nqcdobxnmeemuompjlwi.supabase.co" 
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xY2RvYnhubWVlbXVvbXBqbHdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjU3NDQsImV4cCI6MjEwNTYwMTc0NH0.n6mHK8HZe-89RZx6KpwGfu5ZRTyYy5VYNatElrUbbls"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

function App() {
  // 2. Tipamos los estados explícitamente
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function obtenerUsuarios() {
      // Supabase infiere el tipo 'any' por defecto si no le pasamos los tipos generados,
      // pero nuestro useState ya protege la variable de estado.
      const { data, error } = await supabase
        .from('usuarios')
        .select()

      if (error) {
        console.error("Error consultando la base de datos:", error.message)
      } else if (data) {
        console.log("Datos obtenidos:", data)
        // Forzamos el tipado de los datos entrantes a nuestro array de usuarios
        setUsuarios(data as Usuario[])
      }
      
      setLoading(false)
    }

    obtenerUsuarios()
  }, [])

  return (
    <>
      <h1>Lista de Usuarios</h1>
      
      {loading ? (
        <p>Cargando datos...</p>
      ) : (
        <ul>
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              {usuario.nombre_usuario ? `Usuario ID: ${usuario.id} Nombre Usuario: ${usuario.nombre_usuario} Email Usuario: ${usuario.email}` : `No hay usuarios.`}
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => alert("¡Botón presionado!")}>
        Presióname
      </button>
    </>
  )
}

export default App