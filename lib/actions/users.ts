'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, is_active, created_at, roles(name)')
    .order('created_at', { ascending: false })
  if (error) return { success: false, error: error.message, data: null }
  return { success: true, data }
}

export async function createUser(formData: FormData) {
  const full_name = formData.get('full_name') as string
  const email     = formData.get('email') as string
  const password  = formData.get('password') as string
  const role_name = formData.get('role') as string
  const phone     = formData.get('phone') as string | null

  if (!full_name || !email || !password || !role_name) {
    return { success: false, error: 'Todos los campos obligatorios son requeridos' }
  }

  const serviceClient = await createServiceClient()

  // Get role id
  const { data: role } = await serviceClient
    .from('roles').select('id').eq('name', role_name).single()
  if (!role) return { success: false, error: 'Rol no encontrado' }

  // Create auth user
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (authError) {
    if (authError.message.includes('already')) return { success: false, error: 'Ya existe un usuario con este correo' }
    return { success: false, error: authError.message }
  }

  // Create profile (trigger handle_new_user may also do this, but we upsert to be safe)
  const { error: profileError } = await serviceClient
    .from('profiles')
    .upsert({
      id:        authData.user.id,
      full_name,
      email,
      phone:     phone || null,
      role_id:   role.id,
      is_active: true,
    })

  if (profileError) {
    // Rollback auth user
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return { success: false, error: profileError.message }
  }

  revalidatePath('/admin/users')
  return { success: true, userId: authData.user.id }
}

export async function updateUser(userId: string, formData: FormData) {
  const full_name = formData.get('full_name') as string
  const email     = formData.get('email') as string
  const role_name = formData.get('role') as string
  const phone     = formData.get('phone') as string | null
  const password  = formData.get('password') as string | null

  if (!full_name || !email || !role_name) {
    return { success: false, error: 'Nombre, correo y rol son requeridos' }
  }

  const serviceClient = await createServiceClient()

  const { data: role } = await serviceClient
    .from('roles').select('id').eq('name', role_name).single()
  if (!role) return { success: false, error: 'Rol no encontrado' }

  // Update auth user
  const authUpdate: Record<string, unknown> = { email, user_metadata: { full_name } }
  if (password && password.length >= 6) authUpdate.password = password

  const { error: authError } = await serviceClient.auth.admin.updateUserById(userId, authUpdate)
  if (authError) return { success: false, error: authError.message }

  // Update profile
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ full_name, email, phone: phone || null, role_id: role.id })
    .eq('id', userId)

  if (profileError) return { success: false, error: profileError.message }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  const serviceClient = await createServiceClient()

  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({ is_active: !isActive })
    .eq('id', userId)

  if (profileError) return { success: false, error: profileError.message }

  // Ban/unban in auth
  if (isActive) {
    await serviceClient.auth.admin.updateUserById(userId, { ban_duration: '876600h' }) // ~100 years
  } else {
    await serviceClient.auth.admin.updateUserById(userId, { ban_duration: 'none' })
  }

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}
