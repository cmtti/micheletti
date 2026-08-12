import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Paperclip, Trash2, Upload, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import {
  brl,
  dataBR,
  deleteRow,
  diasAtraso,
  fetchAnexos,
  fetchComentarios,
  fetchEtapas,
  fetchProfiles,
  fetchProjetos,
  insertRow,
  logAuditoria,
  situacaoPrazo,
  updateRow,
  type AnexoVersao,
  type CardItem,
} from "@/lib/api";

const BUCKET = "anexos";
const EXTENSOES_PERMITIDAS = ["pdf", "jpg", "jpeg", "png", "dwg"];

function extensao(nomeArquivo: string) {
  return nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
}

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
  const fileRef = useRef<HTMLInputElement>(null);

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

  const [novoComentario, setNovoComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<AnexoVersao | null>(null);

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

  async function enviarArquivo(file: File) {
    const ext = extensao(file.name);
    if (!EXTENSOES_PERMITIDAS.includes(ext)) {
      toast.error("Formato não permitido. Envie apenas PDF, JPG, PNG ou DWG.");
      return;
    }
    setEnviando(true);
    try {
      const path = `${cardId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file);
      if (error) throw new Error(error.message);
      const revisao =
        Math.max(0, ...anexos.filter((a) => a.nome_arquivo === file.name).map((a) => a.revisao)) + 1;
      await insertRow("anexos_versao", {
        card_id: cardId,
        nome_arquivo: file.name,
        revisao,
        storage_path: path,
        autor_id: user?.id,
      });
      await logAuditoria(cardId, "Anexo enviado", `${file.name} rev. ${revisao}`);
      qc.invalidateQueries({ queryKey: ["anexos", cardId] });
      toast.success("Arquivo anexado.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setEnviando(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function baixar(a: AnexoVersao) {
    if (!a.storage_path) return toast.error("Arquivo indisponível.");
    if (/^https?:\/\//.test(a.storage_path)) {
      window.open(a.storage_path, "_blank", "noreferrer");
      return;
    }
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(a.storage_path, 60, { download: a.nome_arquivo });
    if (error || !data) return toast.error(error?.message ?? "Falha ao gerar link.");
    window.open(data.signedUrl, "_blank", "noreferrer");
  }

  async function excluirAnexo(a: AnexoVersao) {
    try {
      if (a.storage_path && !/^https?:\/\//.test(a.storage_path)) {
        await supabase.storage.from(BUCKET).remove([a.storage_path]);
      }
      await deleteRow("anexos_versao", a.id);
      await logAuditoria(cardId, "Anexo removido", a.nome_arquivo);
      qc.invalidateQueries({ queryKey: ["anexos", cardId] });
      toast.success("Anexo removido.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setParaExcluir(null);
    }
  }

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
        </div>

        <section className="mt-2 space-y-6">
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

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" /> Pagamento a Terceiros/Parceiros
              </h3>
              <span className="text-sm font-semibold text-primary">
                Total: {brl(totalParceiros)}
              </span>
            </div>
            <ul className="divide-y divide-border rounded-md border border-border">
              {parceiros.map((p) => (
                <li key={p.id} className="flex items-center gap-2 p-3">
                  <Input
                    className="flex-1"
                    defaultValue={p.nome}
                    placeholder="Nome do parceiro"
                    onBlur={(e) =>
                      e.target.value !== p.nome &&
                      salvarParceiro.mutate({ id: p.id, values: { nome: e.target.value } })
                    }
                  />
                  <Input
                    className="w-36"
                    type="number"
                    step="0.01"
                    defaultValue={p.valor}
                    onBlur={(e) =>
                      Number(e.target.value) !== Number(p.valor) &&
                      salvarParceiro.mutate({ id: p.id, values: { valor: Number(e.target.value) } })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParceiroExcluir(p)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
              {parceiros.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">
                  Nenhum parceiro vinculado a este card.
                </li>
              )}
            </ul>
            <Button size="sm" variant="outline" onClick={() => adicionarParceiro.mutate()}>
              <Plus className="h-4 w-4" /> Adicionar parceiro
            </Button>
          </div>

          <div className="space-y-3">

            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Paperclip className="h-4 w-4" /> Anexos ({anexos.length})
            </h3>
            <ul className="divide-y divide-border rounded-md border border-border">
              {anexos.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.nome_arquivo}</p>
                    <p className="text-xs text-muted-foreground">
                      {extensao(a.nome_arquivo).toUpperCase() || "Arquivo"} · {nome(a.autor_id)} ·{" "}
                      {dataBR(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => baixar(a)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setParaExcluir(a)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
              {anexos.length === 0 && (
                <li className="p-3 text-sm text-muted-foreground">Nenhum arquivo anexado.</li>
              )}
            </ul>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.dwg,application/pdf,image/jpeg,image/png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) enviarArquivo(f);
                }}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={enviando}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" /> {enviando ? "Enviando..." : "Anexar arquivo"}
              </Button>
              <span className="text-xs text-muted-foreground">PDF, JPG, PNG ou DWG</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" /> Comentários ({comentarios.length})
            </h3>
            <div className="space-y-3">
              {comentarios.map((c) => (
                <div key={c.id} className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    {nome(c.autor_id)} · {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{c.texto}</p>
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
          </div>
        </section>
      </DialogContent>

      <AlertDialog open={!!paraExcluir} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo "{paraExcluir?.nome_arquivo}" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => paraExcluir && excluirAnexo(paraExcluir)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
