import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfiles, fetchRoles, type AppRole } from "@/lib/api";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export function useMyRoles(userId?: string) {
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: fetchRoles });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const myRoles = roles.filter((r) => r.user_id === userId).map((r) => r.role as AppRole);
  const profile = profiles.find((p) => p.id === userId);
  return { roles: myRoles, isAdmin: myRoles.includes("admin"), profile, allRoles: roles, profiles };
}
