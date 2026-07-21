import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  specialty: string | null;
  avatar_url: string | null;
  university?: string | null;
  mpps?: string | null;
  cmc?: string | null;
}

export interface ProfileWithRoles extends Profile {
  roles: ("admin" | "doctor" | "recepcionista")[];
}

const mapProfile = (u: any): Profile => {
  // Try to find if this user is a doctor
  const isDoctor = !!u.medicos;
  const docInfo = isDoctor ? (Array.isArray(u.medicos) ? u.medicos[0] : u.medicos) : null;

  return {
    id: u.auth_id || u.id_usuario?.toString(),
    full_name: docInfo ? `${docInfo.nombre} ${docInfo.apellido}` : u.nombre_usuario,
    email: docInfo?.email || `${u.nombre_usuario}@femesalud.com`,
    specialty: docInfo?.especialidades?.nombre || null,
    avatar_url: null,
    mpps: docInfo?.numero_licencia || null,
    university: docInfo?.universidad || null,
    cmc: docInfo?.cmc || null,
  };
};

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      // First try to match by auth_id (UUID from Supabase Auth)
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, medicos(nombre, apellido, email, numero_licencia, universidad, cmc, especialidades(nombre))")
        .eq("auth_id", userId!)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        // Fallback or handle cases where user is not yet synced in public.usuarios
        return null; 
      }
      return mapProfile(data);
    },
  });
}

// Doctors picker
export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("medicos")
        .select("id_medico, nombre, apellido, email, numero_licencia, especialidades(nombre), usuarios(auth_id, nombre_usuario)");
        
      if (error) throw error;
      
      return (data ?? []).map((m: any) => ({
        id: m.id_medico?.toString(),
        full_name: `${m.nombre} ${m.apellido}`,
        email: m.email || "",
        specialty: m.especialidades?.nombre || null,
        avatar_url: null,
        mpps: m.numero_licencia,
        university: m.universidad || null,
        cmc: m.cmc || null,
      }));
    },
  });
}

export function useAllProfilesWithRoles() {
  return useQuery({
    queryKey: ["profiles_with_roles"],
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*, roles(nombre_rol), medicos(nombre, apellido, email, numero_licencia, universidad, cmc, especialidades(nombre))");
        
      if (error) throw error;
      
      return (data ?? []).map((u: any) => ({
        ...mapProfile(u),
        roles: u.roles ? [u.roles.nombre_rol.toLowerCase() as "admin" | "doctor" | "recepcionista"] : [],
      }));
    },
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enable }: { userId: string; role: "admin" | "doctor"; enable: boolean }) => {
      // For this MVP adaptation, we won't fully implement role toggling since our schema expects predefined role IDs
      // A more robust implementation would lookup the id_rol in the Roles table.
      console.warn("Role toggling is mocked in the adapter.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, fullName, specialty, university, mpps, cmc }: { userId: string; fullName: string; specialty: string | null; university: string | null; mpps: string | null; cmc: string | null }) => {
      const parts = fullName.trim().split(" ");
      const nombre = parts[0] || "";
      const apellido = parts.slice(1).join(" ");
      
      const { data: usuario } = await supabase.from("usuarios").select("id_usuario, nombre_usuario").eq("auth_id", userId).maybeSingle();
      
      if (usuario) {
        await supabase.from("usuarios").update({ nombre_usuario: fullName }).eq("id_usuario", usuario.id_usuario);
        
        let id_especialidad = null;
        if (specialty) {
          const { data: esp } = await supabase.from("especialidades").select("id_especialidad").ilike("nombre", specialty).maybeSingle();
          if (esp) {
            id_especialidad = esp.id_especialidad;
          } else {
            const { data: newEsp } = await supabase.from("especialidades").insert({ nombre: specialty }).select("id_especialidad").single();
            if (newEsp) id_especialidad = newEsp.id_especialidad;
          }
        }

        const medicoUpdate = { 
            nombre, 
            apellido, 
            numero_licencia: mpps,
            universidad: university,
            cmc: cmc,
            ...(id_especialidad ? { id_especialidad } : {})
        };

        // Check if there is an associated medico
        const { data: medico } = await supabase.from("medicos").select("id_medico").eq("id_usuario", usuario.id_usuario).maybeSingle();
        if (medico) {
          const { error } = await supabase.from("medicos").update(medicoUpdate).eq("id_medico", medico.id_medico);
          if (error) throw error;
        } else {
          // Check by email as a fallback if the system was just installed
          const { data: mEmail } = await supabase.from("medicos").select("id_medico").eq("email", usuario.nombre_usuario).maybeSingle();
          if (mEmail) {
             const { error } = await supabase.from("medicos").update(medicoUpdate).eq("id_medico", mEmail.id_medico);
             if (error) throw error;
          }
        }
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["profile", variables.userId] });
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}
