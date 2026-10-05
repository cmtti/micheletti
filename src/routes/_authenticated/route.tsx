import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const [{ data: perfil }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("aprovado").eq("id", data.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    ]);

    if (!perfil?.aprovado) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    // Clientes nunca acessam o sistema interno
    if ((roles ?? []).some((r) => r.role === "cliente")) throw redirect({ to: "/portal" });

    return { user: data.user };
  },
  component: () => <Outlet />,
});
