import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PAPEIS = ["admin", "engenheiro", "visualizador"] as const;
type Ctx = { supabase: any; userId: string };

async function exigirAdmin(context: Ctx) {
  const { data: perfil } = await context.supabase
    .from("profiles")
    .select("aprovado")
    .eq("id", context.userId)
    .maybeSingle();
  const { data: role } = await context.supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!perfil?.aprovado || !role) throw new Error("Apenas administradores podem fazer isso.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function origem() {
  const req = getRequest();
  const o = req?.headers.get("origin");
  if (o) return o;
  const url = new URL(req!.url);
  return url.origin;
}

async function garantirOutroAdmin(admin: any, userId: string) {
  const { data } = await admin.from("user_roles").select("user_id").eq("role", "admin");
  const outros = (data ?? []).filter((r: { user_id: string }) => r.user_id !== userId);
  if (outros.length === 0) throw new Error("É necessário manter ao menos um administrador.");
}

export type UsuarioStatus = "ativo" | "pendente" | "expirado" | "desativado";
export interface UsuarioLinha {
  id: string;
  nome: string;
  email: string;
  papel: (typeof PAPEIS)[number] | null;
  status: UsuarioStatus;
  convidado_em: string | null;
}

export const listarUsuarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await exigirAdmin(context);
    const { data: lista, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw new Error(error.message);
    const { data: perfis } = await admin.from("profiles").select("id, nome, aprovado");
    const { data: roles } = await admin.from("user_roles").select("user_id, role");
    const agora = Date.now();
    return lista.users.map((u): UsuarioLinha => {
      const p = perfis?.find((x: any) => x.id === u.id);
      const r = roles?.find((x: any) => x.user_id === u.id);
      let status: UsuarioStatus = "ativo";
      if (p && !p.aprovado) status = "desativado";
      else if (!u.last_sign_in_at && !u.email_confirmed_at) {
        const enviado = u.invited_at ? new Date(u.invited_at).getTime() : 0;
        status = agora - enviado > 24 * 3600 * 1000 ? "expirado" : "pendente";
      }
      return {
        id: u.id,
        nome: p?.nome ?? u.email ?? "",
        email: u.email ?? "",
        papel: (r?.role as UsuarioLinha["papel"]) ?? null,
        status,
        convidado_em: u.invited_at ?? null,
      };
    });
  });

export const convidarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        nome: z.string().trim().max(120).optional(),
        papel: z.enum(PAPEIS),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await exigirAdmin(context);
    const { error } = await admin.auth.admin.inviteUserByEmail(data.email, {
      data: { nome: data.nome || data.email.split("@")[0], papel: data.papel },
      redirectTo: `${origem()}/redefinir-senha`,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reenviarConvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await exigirAdmin(context);
    const { data: u, error } = await admin.auth.admin.getUserById(data.userId);
    if (error || !u.user?.email) throw new Error("Usuário não encontrado.");
    if (u.user.last_sign_in_at) throw new Error("Este usuário já aceitou o convite.");
    const { error: e2 } = await admin.auth.admin.inviteUserByEmail(u.user.email, {
      data: u.user.user_metadata,
      redirectTo: `${origem()}/redefinir-senha`,
    });
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const alterarPapel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), papel: z.enum(PAPEIS) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const admin = await exigirAdmin(context);
    if (data.papel !== "admin") await garantirOutroAdmin(admin, data.userId);
    await admin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await admin.from("user_roles").insert({ user_id: data.userId, role: data.papel });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const definirAtivo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), ativo: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Você não pode desativar a própria conta.");
    const admin = await exigirAdmin(context);
    if (!data.ativo) await garantirOutroAdmin(admin, data.userId);
    const { error } = await admin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.ativo ? "none" : "876000h",
    });
    if (error) throw new Error(error.message);
    const { error: e2 } = await admin.from("profiles").update({ aprovado: data.ativo }).eq("id", data.userId);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const excluirUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const admin = await exigirAdmin(context);
    await garantirOutroAdmin(admin, data.userId);
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
