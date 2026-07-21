import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
  full_name: z.string().min(1).max(120),
  specialty: z.string().max(120).optional().nullable(),
  role: z.enum(["admin", "doctor"]),
});

const DeleteUserSchema = z.object({
  user_id: z.string().uuid(),
});

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("roles(nombre_rol)")
    .eq("auth_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  
  const roleName = Array.isArray(data?.roles) ? data?.roles[0]?.nombre_rol : (data?.roles as any)?.nombre_rol;
  if (roleName?.toLowerCase() !== "admin") {
     throw new Error("Solo los administradores pueden realizar esta acción");
  }
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newId = created.user?.id;
    if (!newId) throw new Error("No se pudo crear el usuario");

    let { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("id_usuario")
      .eq("auth_id", newId)
      .maybeSingle();

    if (!usuario) {
      // Create the user explicitly
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from("usuarios")
        .insert({
          auth_id: newId,
          nombre_usuario: data.full_name,
          id_rol: data.role === "admin" ? 1 : 2,
          contrasena_hash: "auth" // Auth handled by Supabase
        })
        .select("id_usuario")
        .single();
      
      if (insertError) {
         throw new Error("Error al crear perfil de usuario: " + insertError.message);
      }
      usuario = newUser;
    } else {
      await supabaseAdmin
        .from("usuarios")
        .update({
          nombre_usuario: data.full_name,
          id_rol: data.role === "admin" ? 1 : 2
        })
        .eq("id_usuario", usuario.id_usuario);
    }

    if (usuario && data.role === "doctor") {
       const parts = data.full_name.trim().split(" ");
       const nombre = parts[0] || "";
       const apellido = parts.slice(1).join(" ") || "";
       
       await supabaseAdmin.from("medicos").insert({
         id_usuario: usuario.id_usuario,
         nombre,
         apellido,
         email: data.email
       });
    }

    return { id: newId };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("No puedes eliminarte a ti mismo");
    await ensureAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) {
      // Si el usuario no existe en Supabase Auth (ej. usuarios semilla insertados por SQL),
      // eliminamos sus registros públicos directamente para limpiar la base de datos y la interfaz.
      if (error.message.toLowerCase().includes("not found") || error.status === 404) {
        await supabaseAdmin.from("usuarios").delete().eq("auth_id", data.user_id);
        return { ok: true };
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });
