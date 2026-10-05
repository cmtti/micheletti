import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { EtapaCliente } from "@/lib/api";

/** Gate do portal: exige usuário cliente ativo; equipe interna vai para o sistema. */
export async function exigirCliente() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/portal/entrar" });
  const [{ data: perfil }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("aprovado, nome").eq("id", data.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
  ]);
  if (!perfil?.aprovado) {
    await supabase.auth.signOut();
    throw redirect({ to: "/portal/entrar" });
  }
  if (!(roles ?? []).some((r) => r.role === "cliente")) throw redirect({ to: "/dashboard" });
  return { user: data.user, nome: perfil.nome as string };
}

export interface PortalProjetoResumo {
  id: string;
  nome: string;
  tipo: string;
  prazo_entrega: string | null;
  etapa: EtapaCliente | null;
}
export interface PortalArquivo {
  id: string;
  nome_arquivo: string;
  revisao: number;
  status: "rascunho" | "em_revisao" | "final_aprovado";
  storage_path: string | null;
  created_at: string;
}
export interface PortalProjeto extends PortalProjetoResumo {
  valor_contrato: number;
  parcelas: { id: string; descricao: string; valor: number; vencimento: string | null; pago: boolean }[];
  arquivos: PortalArquivo[];
}

const rpc = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function fetchPortalProjetos() {
  const { data, error } = await rpc.rpc("portal_meus_projetos");
  if (error) throw new Error(error.message);
  return (data ?? []) as PortalProjetoResumo[];
}
export async function fetchPortalProjeto(id: string) {
  const { data, error } = await rpc.rpc("portal_projeto", { _id: id });
  if (error) throw new Error(error.message);
  return data as PortalProjeto | null;
}
