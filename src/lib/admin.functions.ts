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

async function ensureAdmin(userId: string, supabaseClient: any) {
  const { data, error } = await supabaseClient
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
    await ensureAdmin(context.userId, context.supabase);

    const { data: rpcResult, error: rpcError } = await (context.supabase as any).rpc("admin_create_staff_user", {
      p_email: data.email,
      p_password: data.password,
      p_full_name: data.full_name,
      p_role: data.role,
      p_specialty: data.specialty || null,
    });

    if (rpcError) throw new Error(rpcError.message);
    return rpcResult || { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("No puedes eliminarte a ti mismo");
    await ensureAdmin(context.userId, context.supabase);

    const { error: rpcError } = await (context.supabase as any).rpc("admin_delete_staff_user", {
      p_user_id: data.user_id,
    });

    if (rpcError) throw new Error(rpcError.message);
    return { ok: true };
  });
