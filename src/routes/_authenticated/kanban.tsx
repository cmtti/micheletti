import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CardDetailDialog } from "@/components/CardDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRIORIDADE_LABEL,
  brl,
  dataBR,
  deleteRow,
  fetchCards,
  fetchEtapas,
  fetchProfiles,
  fetchProjetos,
  insertRow,
  logAuditoria,
  situacaoPrazo,
  updateRow,
  type CardItem,
  type Etapa,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/kanban")({
  component: KanbanPage,
});

function KanbanPage() {
  const qc = useQueryClient();
  const { data: etapas = [] } = useQuery({ queryKey: ["etapas"], queryFn: fetchEtapas });
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: fetchCards });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const [projetoFiltro, setProjetoFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<CardItem | null>(null);
  const [novoTitulo, setNovoTitulo] = useState<Record<string, string>>({});

  const visiveis = useMemo(
    () =>
      cards.filter(
        (c) =>
          (projetoFiltro === "todos" || c.projeto_id === projetoFiltro) &&
          c.titulo.toLowerCase().includes(busca.toLowerCase()),
      ),
    [cards, projetoFiltro, busca],
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["cards"] });

  async function moverCard(cardId: string, etapaId: string) {
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.etapa_id === etapaId) return;
    await updateRow("cards", cardId, { etapa_id: etapaId });
    await logAuditoria(
      cardId,
      "Card movido",
      `${etapas.find((e) => e.id === card.etapa_id)?.nome ?? "—"} → ${
        etapas.find((e) => e.id === etapaId)?.nome
      }`,
    );
    refresh();
  }

  async function criarCard(etapa: Etapa) {
    const titulo = (novoTitulo[etapa.id] ?? "").trim();
    if (!titulo) return;
    const projetoId = projetoFiltro !== "todos" ? projetoFiltro : projetos[0]?.id;
    if (!projetoId) return toast.error("Cadastre um projeto antes de criar cards.");
    const card = await insertRow<CardItem>("cards", {
      titulo,
      projeto_id: projetoId,
      etapa_id: etapa.id,
    });
    await logAuditoria(card.id, "Card criado", etapa.nome);
    setNovoTitulo((s) => ({ ...s, [etapa.id]: "" }));
    refresh();
  }

  async function renomearEtapa(etapa: Etapa) {
    const nome = window.prompt("Novo nome da etapa", etapa.nome);
    if (!nome) return;
    await updateRow("etapas_kanban", etapa.id, { nome });
    qc.invalidateQueries({ queryKey: ["etapas"] });
  }

  async function moverEtapa(etapa: Etapa, dir: -1 | 1) {
    const idx = etapas.findIndex((e) => e.id === etapa.id);
    const alvo = etapas[idx + dir];
    if (!alvo) return;
    await updateRow("etapas_kanban", etapa.id, { ordem: alvo.ordem });
    await updateRow("etapas_kanban", alvo.id, { ordem: etapa.ordem });
    qc.invalidateQueries({ queryKey: ["etapas"] });
  }

  async function novaEtapa() {
    const nome = window.prompt("Nome da nova etapa");
    if (!nome) return;
    await insertRow("etapas_kanban", {
      nome,
      ordem: (etapas.at(-1)?.ordem ?? 0) + 1,
    });
    qc.invalidateQueries({ queryKey: ["etapas"] });
  }

  return (
    <AppShell
      title="Quadro Kanban"
      description="Arraste os cards entre as etapas do fluxo do projeto"
      actions={
        <>
          <Input
            className="w-48"
            placeholder="Buscar card..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Select value={projetoFiltro} onValueChange={setProjetoFiltro}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os projetos</SelectItem>
              {projetos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={novaEtapa}>
            <Plus className="h-4 w-4" /> Etapa
          </Button>
        </>
      }
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapas.map((etapa, i) => {
          const daEtapa = visiveis.filter((c) => c.etapa_id === etapa.id);
          return (
            <section
              key={etapa.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/card-id");
                if (id) moverCard(id, etapa.id);
              }}
              className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/50"
            >
              <header className="flex items-center justify-between gap-1 border-b border-border px-3 py-2.5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{etapa.nome}</h2>
                  <p className="text-xs text-muted-foreground">{daEtapa.length} card(s)</p>
                </div>
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={i === 0}
                    onClick={() => moverEtapa(etapa, -1)}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={i === etapas.length - 1}
                    onClick={() => moverEtapa(etapa, 1)}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => renomearEtapa(etapa)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </header>

              <div className="flex-1 space-y-2 p-2">
                {daEtapa.map((card) => {
                  const prazo = situacaoPrazo(card);
                  const projeto = projetos.find((p) => p.id === card.projeto_id);
                  const resp = profiles.find((p) => p.id === card.responsavel_id);
                  return (
                    <article
                      key={card.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/card-id", card.id)}
                      onClick={() => setAberto(card)}
                      className="cursor-pointer rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{card.titulo}</p>
                        <span
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            prazo === "atrasado"
                              ? "bg-danger"
                              : prazo === "atencao"
                                ? "bg-warning"
                                : "bg-success"
                          }`}
                        />
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {projeto?.nome ?? "Sem projeto"}
                      </p>
                      <Progress value={card.percentual} className="mt-2 h-1.5" />
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {PRIORIDADE_LABEL[card.prioridade]}
                        </Badge>
                        {card.tags.slice(0, 2).map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                        {prazo === "atrasado" && (
                          <Badge className="bg-danger text-[10px] text-danger-foreground">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Atrasado
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{resp?.nome ?? "Sem responsável"}</span>
                        <span>{dataBR(card.fim_previsto)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {brl(Number(card.custo_real))} / {brl(Number(card.custo_estimado))}
                      </p>
                    </article>
                  );
                })}
              </div>

              <footer className="border-t border-border p-2">
                <Input
                  placeholder="+ Novo card"
                  className="h-8 bg-card text-sm"
                  value={novoTitulo[etapa.id] ?? ""}
                  onChange={(e) =>
                    setNovoTitulo((s) => ({ ...s, [etapa.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && criarCard(etapa)}
                />
              </footer>
            </section>
          );
        })}
      </div>

      <CardDetailDialog
        card={aberto ? (cards.find((c) => c.id === aberto.id) ?? null) : null}
        onOpenChange={(o) => !o && setAberto(null)}
      />
      <span className="hidden">{deleteRow ? "" : ""}</span>
    </AppShell>
  );
}
