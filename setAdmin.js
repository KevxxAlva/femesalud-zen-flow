import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://brsoghnsuqnfbiqujnid.supabase.co"
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyc29naG5zdXFuZmJpcXVqbmlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDIxMzc1NCwiZXhwIjoyMDk5Nzg5NzU0fQ.kDpjEoAMLJTfWel9adeF8rL0fQslH_LNLjWaGa1fVBE"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function makeAdmin(email) {
  console.log(`Buscando usuario con email ${email}...`)
  
  // Buscar en auth.users
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    console.error("Error al listar usuarios:", usersError)
    return
  }

  const user = usersData.users.find(u => u.email === email)
  if (!user) {
    console.error(`Usuario ${email} no encontrado en auth.`)
    // try to find in usuarios table maybe email is there?
    const { data: uData } = await supabase.from('usuarios').select('auth_id').eq('nombre_usuario', email).maybeSingle()
    if (uData && uData.auth_id) {
        console.log(`Encontrado auth_id en usuarios: ${uData.auth_id}`)
        await insertAdmin(uData.auth_id)
        return
    }
    return
  }

  console.log(`Usuario encontrado: ${user.id}`)
  await insertAdmin(user.id)
}

async function insertAdmin(userId) {
  // Check if role already exists
  const { data: roleData } = await supabase.from('user_roles').select('*').eq('user_id', userId).eq('role', 'admin').maybeSingle()
  
  if (roleData) {
    console.log("El usuario ya tiene rol de admin.")
  } else {
    const { error } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'admin'
    })
    if (error) console.error("Error asignando rol admin:", error)
    else console.log("Rol 'admin' asignado correctamente.")
  }
  
  // ALSO check if doctor role exists
  const { data: docRoleData } = await supabase.from('user_roles').select('*').eq('user_id', userId).eq('role', 'doctor').maybeSingle()
  if (!docRoleData) {
    await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'doctor'
    })
    console.log("Rol 'doctor' asignado también.")
  } else {
    console.log("El usuario ya tiene rol de doctor.")
  }

  // Ensure user is in 'medicos' table
  const { data: medicoData } = await supabase.from('medicos').select('*').eq('email', 'kevinja1406@gmail.com').maybeSingle()
  if (!medicoData) {
      console.log("Insertando en medicos...")
      const { data: mData, error: mErr } = await supabase.from('medicos').insert({
          nombre: "Kevin",
          apellido: "Álvarez",
          email: "kevinja1406@gmail.com",
          // id_usuario: userId // if needed
      }).select().maybeSingle()
      if (mErr) console.error("Error insertando medico:", mErr)
      else console.log("Médico insertado con ID:", mData?.id_medico)
  } else {
      console.log("Ya está en medicos")
  }
}

makeAdmin('kevinja1406@gmail.com')
