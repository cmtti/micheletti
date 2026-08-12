import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "engenheiro" | "comercial" | "aprovador";
export type Prioridade = "baixa" | "media" | "alta" | "urgente";
export type ProjetoStatus = "ativo" | "concluido" | "cancelado";
export type AnexoStatus = "rascunho" | "em_revisao" | "final_aprovado";

export interface Profile {
  id: string;
  nome: string;
  email: string | null;
  aprovado: boolean;
}
export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}
export interface Cliente {
  id: string;
  nome: string;
  contato: string | null;
  email: string | null;
  telefone: string | null;
}
export interface Etapa {
  id: string;
  nome: string;
  ordem: number;
  cor: string;
}
export interface Projeto {
  id: string;
  nome: string;
  cliente_id: string | null;
  tipo: string;
  status: ProjetoStatus;
  descricao: string | null;
  created_at: string;
}
export interface CardItem {
  id: string;
  projeto_id: string;
  etapa_id: string | null;
  titulo: string;
  descricao: string | null;
  inicio_previsto: string | null;
  fim_previsto: string | null;
  inicio_real: string | null;
  fim_real: string | null;
  percentual: number;
  prioridade: Prioridade;
  responsavel_id: string | null;
  custo_estimado: number;
  custo_real: number;
  tags: string[];
  ordem: number;
  created_at: string;
}
export interface Comentario {
  id: string;
  card_id: string;
  autor_id: string | null;
  texto: string;
  created_at: string;
}
export interface AnexoVersao {
  id: string;
  card_id: string;
  nome_arquivo: string;
  revisao: number;
  status: AnexoStatus;
  storage_path: string | null;
  autor_id: string | null;
  created_at: string;
}
export interface ChecklistItem {
  id: string;
  card_id: string;
  norma: string;
  descricao: string | null;
  concluido: boolean;
}
export interface ProjetoApoio {
  id: string;
  projeto_id: string;
  tipo_documento: string;
  nome: string;
  link_referencia: string | null;
  created_at: string;
}
export interface CardParceiro {
  id: string;
  card_id: string;
  nome: string;
  valor: number;
  created_at: string;
}
export interface Auditoria {
  id: string;
  card_id: string;
  autor_id: string | null;
  acao: string;
  detalhe: string | null;
  created_at: string;
}

const db = supabase as unknown as {
  from: (t: string) => any;
};

async function run<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export const TIPOS_PROJETO = [
  "residencial",
  "comercial",
  "industrial",
  "subestação",
  "iluminação",
  "automação",
];

export const TIPOS_DOCUMENTO = [
  "Memorial descritivo",
  "ART/RRT",
  "Planta baixa",
  "Laudo técnico",
  "Lista de materiais",
];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: "Administrador",
  engenheiro: "Engenheiro/Projetista",
  comercial: "Comercial",
  aprovador: "Aprovador",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

export const ANEXO_STATUS_LABEL: Record<AnexoStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  final_aprovado: "Final aprovado",
};

export const fetchProfiles = () =>
  run<Profile[]>(db.from("profiles").select("id, nome, email, aprovado").order("nome"));
export const fetchRoles = () => run<UserRole[]>(db.from("user_roles").select("*"));
export const fetchClientes = () => run<Cliente[]>(db.from("clientes").select("*").order("nome"));
export const fetchEtapas = () =>
  run<Etapa[]>(db.from("etapas_kanban").select("*").order("ordem"));
export const fetchProjetos = () =>
  run<Projeto[]>(db.from("projetos").select("*").order("created_at", { ascending: false }));
export const fetchCards = () =>
  run<CardItem[]>(db.from("cards").select("*").order("ordem"));
export const fetchComentarios = (cardId: string) =>
  run<Comentario[]>(
    db.from("comentarios").select("*").eq("card_id", cardId).order("created_at"),
  );
export const fetchAnexos = (cardId: string) =>
  run<AnexoVersao[]>(
    db.from("anexos_versao").select("*").eq("card_id", cardId).order("revisao"),
  );
export const fetchChecklist = (cardId: string) =>
  run<ChecklistItem[]>(
    db.from("checklist_itens").select("*").eq("card_id", cardId).order("created_at"),
  );
export const fetchAuditoria = (cardId: string) =>
  run<Auditoria[]>(
    db
      .from("card_auditoria")
      .select("*")
      .eq("card_id", cardId)
      .order("created_at", { ascending: false }),
  );
export const fetchParceiros = (cardId: string) =>
  run<CardParceiro[]>(
    db.from("card_parceiros").select("*").eq("card_id", cardId).order("created_at"),
  );
export const fetchTodosParceiros = () =>
  run<CardParceiro[]>(db.from("card_parceiros").select("*").order("created_at"));
export const fetchApoios = (projetoId?: string) =>
  run<ProjetoApoio[]>(
    projetoId
      ? db.from("projetos_apoio").select("*").eq("projeto_id", projetoId).order("created_at")
      : db.from("projetos_apoio").select("*").order("created_at"),
  );

export async function insertRow<T>(table: string, values: Record<string, unknown>) {
  const { data, error } = await db.from(table).insert(values).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}
export async function updateRow<T>(table: string, id: string, values: Record<string, unknown>) {
  const { data, error } = await db.from(table).update(values).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as T;
}
export async function deleteRow(table: string, id: string) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function logAuditoria(cardId: string, acao: string, detalhe?: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await db
    .from("card_auditoria")
    .insert({ card_id: cardId, autor_id: data.user.id, acao, detalhe: detalhe ?? null });
}

/** Situação de prazo de um card: no prazo, atenção (<=3 dias) ou atrasado. */
export function situacaoPrazo(card: CardItem): "no_prazo" | "atencao" | "atrasado" | "concluido" {
  if (card.fim_real) {
    if (card.fim_previsto && card.fim_real > card.fim_previsto) return "atrasado";
    return "concluido";
  }
  if (!card.fim_previsto) return "no_prazo";
  const hoje = new Date().toISOString().slice(0, 10);
  if (card.fim_previsto < hoje) return "atrasado";
  const diff =
    (new Date(card.fim_previsto).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24);
  return diff <= 3 ? "atencao" : "no_prazo";
}

export function diasAtraso(card: CardItem): number {
  if (!card.fim_previsto) return 0;
  const fim = card.fim_real ? new Date(card.fim_real) : new Date();
  const prev = new Date(card.fim_previsto);
  const diff = Math.floor((fim.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

export const dataBR = (v?: string | null) =>
  v ? new Date(v + (v.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR") : "—";
