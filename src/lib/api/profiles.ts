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
  roles: ("admin" | "doctor")[];
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, specialty, avatar_url, university, mpps, cmc")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// Doctors picker — visible to admins (all profiles) and doctors (only doctors' profiles via RLS)
export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async (): Promise<Profile[]> => {
      const { data: roleData, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (roleErr) throw roleErr;
      const doctorIds = (roleData ?? []).filter((r) => r.role === "doctor").map((r) => r.user_id);
      if (doctorIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, specialty, avatar_url, university, mpps, cmc")
        .in("id", doctorIds);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllProfilesWithRoles() {
  return useQuery({
    queryKey: ["profiles_with_roles"],
    queryFn: async (): Promise<ProfileWithRoles[]> => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, email, specialty, avatar_url, university, mpps, cmc");
      if (pErr) throw pErr;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("user_id, role");
      if (rErr) throw rErr;
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as "admin" | "doctor"),
      }));
    },
  });
}

export function useToggleRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, enable }: { userId: string; role: "admin" | "doctor"; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error && !error.message.includes("duplicate")) throw error;
      } else {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, fullName, specialty, university, mpps, cmc }: { userId: string; fullName: string; specialty: string | null; university: string | null; mpps: string | null; cmc: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, specialty: specialty || null, university: university || null, mpps: mpps || null, cmc: cmc || null })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["profile", variables.userId] });
      qc.invalidateQueries({ queryKey: ["profiles_with_roles"] });
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}
