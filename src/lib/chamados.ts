import { supabase } from "@/integrations/supabase/client";

export type ChamadoStatus = "aberto" | "em_analise" | "respondido" | "fechado";
export type ChamadoCategoria = "duvida" | "alteracao" | "problema_obra";

export const CHAMADO_STATUS: { id: ChamadoStatus; label: string }[] = [
  { id: "aberto", label: "Aberto" },
  { id: "em_analise", label: "Em análise" },
  { id: "respondido", label: "Respondido" },
  { id: "fechado", label: "Fechado" },
];
export const STATUS_LABEL_CHAMADO = Object.fromEntries(
  CHAMADO_STATUS.map((s) => [s.id, s.label]),
) as Record<ChamadoStatus, string>;
export const CATEGORIA_LABEL: Record<ChamadoCategoria, string> = {
  duvida: "Dúvida",
  alteracao: "Alteração",
  problema_obra: "Problema na obra",
};

export interface Chamado {
  id: string;
  projeto_id: string;
  autor_id: string | null;
  titulo: string;
  categoria: ChamadoCategoria;
  descricao: string;
  status: ChamadoStatus;
  created_at: string;
  updated_at: string;
}
export interface ChamadoMensagem {
  id: string;
  chamado_id: string;
  autor_id: string | null;
  texto: string;
  interna: boolean;
  created_at: string;
}
export interface ChamadoAnexo {
  id: string;
  chamado_id: string;
  nome_arquivo: string;
  storage_path: string;
  autor_id: string | null;
  created_at: string;
}

const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a?: object) => any };

async function run<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const fetchChamados = (projetoId?: string) =>
  run<Chamado[]>(
    projetoId
      ? db.from("chamados").select("*").eq("projeto_id", projetoId).order("created_at", { ascending: false })
      : db.from("chamados").select("*").order("created_at", { ascending: false }),
  );
export async function fetchChamado(id: string) {
  const { data, error } = await db.from("chamados").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Chamado | null;
}
export const fetchMensagens = (id: string) =>
  run<ChamadoMensagem[]>(db.from("chamado_mensagens").select("*").eq("chamado_id", id).order("created_at"));
export const fetchAnexosChamado = (id: string) =>
  run<ChamadoAnexo[]>(db.from("chamado_anexos").select("*").eq("chamado_id", id).order("created_at"));

async function meuId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada.");
  return data.user.id;
}

export async function enviarAnexos(chamadoId: string, files: File[]) {
  const uid = await meuId();
  for (const f of files) {
    const path = `${chamadoId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("chamados").upload(path, f);
    if (error) throw new Error(error.message);
    await run(
      db.from("chamado_anexos").insert({ chamado_id: chamadoId, nome_arquivo: f.name, storage_path: path, autor_id: uid }),
    );
  }
}

export async function abrirChamado(v: {
  projeto_id: string;
  titulo: string;
  categoria: ChamadoCategoria;
  descricao: string;
  files: File[];
}) {
  const uid = await meuId();
  const id = crypto.randomUUID();
  await run(
    db.from("chamados").insert({
      id,
      projeto_id: v.projeto_id,
      titulo: v.titulo,
      categoria: v.categoria,
      descricao: v.descricao,
      autor_id: uid,
      status: "aberto",
    }),
  );
  if (v.files.length) await enviarAnexos(id, v.files);
  return id;
}

export async function enviarMensagem(chamadoId: string, texto: string, interna = false) {
  const uid = await meuId();
  await run(db.from("chamado_mensagens").insert({ chamado_id: chamadoId, texto, interna, autor_id: uid }));
}

export async function alterarStatusChamado(id: string, status: ChamadoStatus) {
  await run(db.from("chamados").update({ status }).eq("id", id));
}

export async function reabrirChamado(id: string) {
  const { error } = await db.rpc("portal_reabrir_chamado", { _id: id });
  if (error) throw new Error(error.message);
}

export async function urlAnexoChamado(a: ChamadoAnexo) {
  const { data, error } = await supabase.storage
    .from("chamados")
    .createSignedUrl(a.storage_path, 600, { download: a.nome_arquivo });
  if (error || !data) throw new Error("Não foi possível gerar o download.");
  return data.signedUrl;
}
