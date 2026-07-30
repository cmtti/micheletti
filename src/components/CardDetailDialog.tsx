import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, History, Paperclip, ListChecks, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-session";
import {
  ANEXO_STATUS_LABEL,
  PRIORIDADE_LABEL,
  brl,
  dataBR,
  deleteRow,
  diasAtraso,
  fetchAnexos,
  fetchAuditoria,
  fetchChecklist,
  fetchComentarios,
  fetchEtapas,
  fetchProfiles,
  fetchProjetos,
  insertRow,
  logAuditoria,
  situacaoPrazo,
  updateRow,
  type AnexoStatus,
  type CardItem,
  type Prioridade,
} from "@/lib/api";

const NORMAS_SUGERIDAS = ["NBR 5410", "NBR 5419", "NR-10", "NBR 14039"];

export function CardDetailDialog({
  card,
  onOpenChange,
}: {
  card: CardItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const cardId = card?.id ?? "";

  const { data: etapas = [] } = useQuery({ queryKey: ["etapas"], queryFn: fetchEtapas });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const { data: comentarios = [] } = useQuery({
    queryKey: ["comentarios", cardId],
    queryFn: () => fetchComentarios(cardId),
    enabled: !!cardId,
  });
  const { data: anexos = [] } = useQuery({
    queryKey: ["anexos", cardId],
    queryFn: () => fetchAnexos(cardId),
    enabled: !!cardId,
  });
  const { data: checklist = [] } = useQuery({
    queryKey: ["checklist", cardId],
    queryFn: () => fetchChecklist(cardId),
    enabled: !!cardId,
  });
  const { data: auditoria = [] } = useQuery({
    queryKey: ["auditoria", cardId],
    queryFn: () => fetchAuditoria(cardId),
    enabled: !!cardId,
  });

  const [novoComentario, setNovoComentario] = useState("");
  const [anexoNome, setAnexoNome] = useState("");
  const [anexoLink, setAnexoLink] = useState("");
  const [anexoStatus, setAnexoStatus] = useState<AnexoStatus>("rascunho");
  const [novaNorma, setNovaNorma] = useState("NBR 5410");

  const salvar = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      await updateRow("cards", cardId, values);
      await logAuditoria(cardId, "Card atualizado", Object.keys(values).join(", "));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards"] });
      qc.invalidateQueries({ queryKey: ["auditoria", cardId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!card) return null;
  const prazo = situacaoPrazo(card);
  const nome = (id: string | null) => profiles.find((p) => p.id === id)?.nome ?? "—";

  const field = (values: Record<string, unknown>) => salvar.mutate(values);

  return (
    <Dialog open={!!card} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-6 text-left">
            <Input
              className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
              defaultValue={card.titulo}
              onBlur={(e) =>
                e.target.value !== card.titulo && field({ titulo: e.target.value })
              }
            />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={
              prazo === "atrasado"
                ? "bg-danger text-danger-foreground"
                : prazo === "atencao"
                  ? "bg-warning text-warning-foreground"
                  : "bg-success text-success-foreground"
            }
          >
            {prazo === "atrasado"
              ? `Atrasado ${diasAtraso(card)} dia(s)`
              : prazo === "atencao"
                ? "Prazo próximo"
                : prazo === "concluido"
                  ? "Concluído no prazo"
                  : "No prazo"}
          </Badge>
          <Badge variant="secondary">{PRIORIDADE_LABEL[card.prioridade]}</Badge>
          <Badge variant="outline">{card.percentual}% concluído</Badge>
        </div>

        <Tabs defaultValue="detalhes" className="mt-2">
          <TabsList>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="comentarios">
              <MessageSquare className="h-3.5 w-3.5" /> {comentarios.length}
            </TabsTrigger>
            <TabsTrigger value="anexos">
              <Paperclip className="h-3.5 w-3.5" /> {anexos.length}
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <ListChecks className="h-3.5 w-3.5" /> Normas
            </TabsTrigger>
            <TabsTrigger value="auditoria">
              <History className="h-3.5 w-3.5" /> Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Projeto</Label>
                <Select
                  value={card.projeto_id ?? undefined}
                  onValueChange={(v) => v !== card.projeto_id && field({ projeto_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Etapa</Label>
                <Select
                  value={card.etapa_id ?? undefined}
                  onValueChange={(v) => field({ etapa_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select
                  value={card.responsavel_id ?? undefined}
                  onValueChange={(v) => field({ responsavel_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome || p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prioridade</Label>
                <Select
                  value={card.prioridade}
                  onValueChange={(v) => field({ prioridade: v as Prioridade })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Andamento (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={card.percentual}
                  onBlur={(e) => field({ percentual: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Início previsto</Label>
                <Input
                  type="date"
                  defaultValue={card.inicio_previsto ?? ""}
                  onBlur={(e) => field({ inicio_previsto: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Término previsto</Label>
                <Input
                  type="date"
                  defaultValue={card.fim_previsto ?? ""}
                  onBlur={(e) => field({ fim_previsto: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Início real</Label>
                <Input
                  type="date"
                  defaultValue={card.inicio_real ?? ""}
                  onBlur={(e) => field({ inicio_real: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Término real</Label>
                <Input
                  type="date"
                  defaultValue={card.fim_real ?? ""}
                  onBlur={(e) => field({ fim_real: e.target.value || null })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor do serviço ({brl(Number(card.custo_estimado))})</Label>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={card.custo_estimado}
                  onBlur={(e) => field({ custo_estimado: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Valor recebido ({brl(Number(card.custo_real))})</Label>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={card.custo_real}
                  onBlur={(e) => field({ custo_real: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                defaultValue={card.tags.join(", ")}
                onBlur={(e) =>
                  field({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                defaultValue={card.descricao ?? ""}
                onBlur={(e) => field({ descricao: e.target.value })}
              />
            </div>
          </TabsContent>

          <TabsContent value="comentarios" className="space-y-4 pt-4">
            <div className="space-y-3">
              {comentarios.map((c) => (
                <div key={c.id} className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {nome(c.autor_id)} · {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{c.texto}</p>
                </div>
              ))}
              {comentarios.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
              )}
            </div>
            <div className="space-y-2">
              <Textarea
                rows={3}
                placeholder="Escreva um comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
              />
              <Button
                size="sm"
                disabled={!novoComentario.trim()}
                onClick={async () => {
                  await insertRow("comentarios", {
                    card_id: cardId,
                    autor_id: user?.id,
                    texto: novoComentario.trim(),
                  });
                  await logAuditoria(cardId, "Comentário adicionado");
                  setNovoComentario("");
                  qc.invalidateQueries({ queryKey: ["comentarios", cardId] });
                  qc.invalidateQueries({ queryKey: ["auditoria", cardId] });
                }}
              >
                Comentar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="anexos" className="space-y-4 pt-4">
            <ul className="divide-y divide-border rounded-md border border-border">
              {anexos.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.nome_arquivo}{" "}
                      <span className="text-muted-foreground">rev. {a.revisao}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {nome(a.autor_id)} · {dataBR(a.created_at)}
                      {a.storage_path && (
                        <>
                          {" · "}
                          <a
                            className="underline"
                            href={a.storage_path}
                            target="_blank"
                            rel="noreferrer"
                          >
                            abrir
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        a.status === "final_aprovado"
                          ? "bg-success text-success-foreground"
                          : a.status === "em_revisao"
                            ? "bg-warning text-warning-foreground"
                            : ""
                      }
                      variant={a.status === "rascunho" ? "secondary" : "default"}
                    >
                      {ANEXO_STATUS_LABEL[a.status]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        await deleteRow("anexos_versao", a.id);
                        qc.invalidateQueries({ queryKey: ["anexos", cardId] });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {anexos.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Nenhuma versão registrada.</li>
              )}
            </ul>
            <div className="grid gap-2 sm:grid-cols-4">
              <Input
                className="sm:col-span-2"
                placeholder="Nome do arquivo"
                value={anexoNome}
                onChange={(e) => setAnexoNome(e.target.value)}
              />
              <Input
                placeholder="Link (opcional)"
                value={anexoLink}
                onChange={(e) => setAnexoLink(e.target.value)}
              />
              <Select value={anexoStatus} onValueChange={(v) => setAnexoStatus(v as AnexoStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ANEXO_STATUS_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              disabled={!anexoNome.trim()}
              onClick={async () => {
                const revisao =
                  Math.max(
                    0,
                    ...anexos
                      .filter((a) => a.nome_arquivo === anexoNome.trim())
                      .map((a) => a.revisao),
                  ) + 1;
                await insertRow("anexos_versao", {
                  card_id: cardId,
                  nome_arquivo: anexoNome.trim(),
                  revisao,
                  status: anexoStatus,
                  storage_path: anexoLink || null,
                  autor_id: user?.id,
                });
                await logAuditoria(cardId, "Nova versão de anexo", `${anexoNome} rev. ${revisao}`);
                setAnexoNome("");
                setAnexoLink("");
                qc.invalidateQueries({ queryKey: ["anexos", cardId] });
                qc.invalidateQueries({ queryKey: ["auditoria", cardId] });
              }}
            >
              <Plus className="h-4 w-4" /> Registrar versão
            </Button>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4 pt-4">
            <ul className="space-y-2">
              {checklist.map((i) => (
                <li key={i.id} className="flex items-center gap-3 rounded-md border border-border p-3">
                  <Checkbox
                    checked={i.concluido}
                    onCheckedChange={async (v) => {
                      await updateRow("checklist_itens", i.id, { concluido: !!v });
                      await logAuditoria(
                        cardId,
                        "Checklist atualizado",
                        `${i.norma}: ${v ? "concluído" : "pendente"}`,
                      );
                      qc.invalidateQueries({ queryKey: ["checklist", cardId] });
                      qc.invalidateQueries({ queryKey: ["auditoria", cardId] });
                    }}
                  />
                  <span className="flex-1 text-sm">{i.norma}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await deleteRow("checklist_itens", i.id);
                      qc.invalidateQueries({ queryKey: ["checklist", cardId] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
              {checklist.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhum item de conformidade.</li>
              )}
            </ul>
            <div className="flex gap-2">
              <Input
                list="normas"
                value={novaNorma}
                onChange={(e) => setNovaNorma(e.target.value)}
                placeholder="NBR 5410"
              />
              <datalist id="normas">
                {NORMAS_SUGERIDAS.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              <Button
                size="sm"
                disabled={!novaNorma.trim()}
                onClick={async () => {
                  await insertRow("checklist_itens", { card_id: cardId, norma: novaNorma.trim() });
                  qc.invalidateQueries({ queryKey: ["checklist", cardId] });
                }}
              >
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="auditoria" className="pt-4">
            <ul className="divide-y divide-border rounded-md border border-border">
              {auditoria.map((a) => (
                <li key={a.id} className="p-3">
                  <p className="text-sm">{a.acao}</p>
                  <p className="text-xs text-muted-foreground">
                    {nome(a.autor_id)} · {new Date(a.created_at).toLocaleString("pt-BR")}
                    {a.detalhe ? ` · ${a.detalhe}` : ""}
                  </p>
                </li>
              ))}
              {auditoria.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Sem registros.</li>
              )}
            </ul>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
