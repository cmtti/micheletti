import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, Paperclip, Send, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL_CHAMADO,
  enviarAnexos,
  enviarMensagem,
  fetchAnexosChamado,
  fetchMensagens,
  urlAnexoChamado,
  type Chamado,
} from "@/lib/chamados";

export function StatusChamadoBadge({ status }: { status: Chamado["status"] }) {
  const cls =
    status === "aberto"
      ? "bg-warning text-warning-foreground"
      : status === "em_analise"
        ? "bg-primary text-primary-foreground"
        : status === "respondido"
          ? "bg-success text-success-foreground"
          : "bg-muted text-muted-foreground";
  return <Badge className={cls}>{STATUS_LABEL_CHAMADO[status]}</Badge>;
}

/** Conversa do chamado. `equipe` habilita notas internas (o banco esconde-as do cliente). */
export function ChamadoConversa({
  chamado,
  meuId,
  equipe,
  nomeAutor,
}: {
  chamado: Chamado;
  meuId?: string;
  equipe: boolean;
  nomeAutor: (id: string | null) => string;
}) {
  const qc = useQueryClient();
  const { data: msgs = [] } = useQuery({
    queryKey: ["chamado-msgs", chamado.id],
    queryFn: () => fetchMensagens(chamado.id),
  });
  const { data: anexos = [] } = useQuery({
    queryKey: ["chamado-anexos", chamado.id],
    queryFn: () => fetchAnexosChamado(chamado.id),
  });
  const [texto, setTexto] = useState("");
  const [interna, setInterna] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const fechado = chamado.status === "fechado";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() && files.length === 0) return;
    setEnviando(true);
    try {
      if (files.length && !interna) await enviarAnexos(chamado.id, files);
      if (texto.trim()) await enviarMensagem(chamado.id, texto.trim(), equipe && interna);
      setTexto("");
      setFiles([]);
      qc.invalidateQueries({ queryKey: ["chamado-msgs", chamado.id] });
      qc.invalidateQueries({ queryKey: ["chamado-anexos", chamado.id] });
      qc.invalidateQueries({ queryKey: ["chamados"] });
      qc.invalidateQueries({ queryKey: ["chamado", chamado.id] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function baixar(a: (typeof anexos)[number]) {
    try {
      window.location.href = await urlAnexoChamado(a);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-secondary/40 p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">{CATEGORIA_LABEL[chamado.categoria]}</Badge>
          <span>
            {nomeAutor(chamado.autor_id)} · {new Date(chamado.created_at).toLocaleString("pt-BR")}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm">{chamado.descricao}</p>
        {chamado.categoria === "alteracao" && equipe && (
          <p className="mt-2 text-xs text-muted-foreground">
            Pedido de alteração registrado. Nenhuma revisão é criada automaticamente.
          </p>
        )}
      </div>

      {anexos.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Fotos e anexos</p>
          <ul className="flex flex-wrap gap-2">
            {anexos.map((a) => (
              <li key={a.id}>
                <Button size="sm" variant="outline" onClick={() => baixar(a)}>
                  <Download className="h-3.5 w-3.5" /> {a.nome_arquivo}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {msgs.map((m) => {
          const minha = m.autor_id === meuId;
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.interna
                    ? "border border-dashed border-warning bg-warning/10"
                    : minha
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                }`}
              >
                <p className="mb-0.5 flex items-center gap-1 text-[11px] opacity-75">
                  {m.interna && <Lock className="h-3 w-3" />}
                  {m.interna ? "Nota interna · " : ""}
                  {minha ? "Você" : nomeAutor(m.autor_id)} ·{" "}
                  {new Date(m.created_at).toLocaleString("pt-BR")}
                </p>
                <p className="whitespace-pre-wrap">{m.texto}</p>
              </div>
            </div>
          );
        })}
        {msgs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda.</p>}
      </div>

      {fechado && !equipe ? (
        <p className="text-sm text-muted-foreground">Este chamado está fechado.</p>
      ) : (
        <form onSubmit={enviar} className="space-y-2">
          <Textarea
            rows={3}
            placeholder={interna ? "Nota interna (só a equipe vê)" : "Escreva uma mensagem"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {!interna && (
                <label className="inline-flex cursor-pointer items-center gap-1 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  {files.length ? `${files.length} arquivo(s)` : "Anexar"}
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.dwg"
                    className="hidden"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
              )}
              {equipe && (
                <label className="inline-flex items-center gap-2 text-sm">
                  <Checkbox checked={interna} onCheckedChange={(v) => setInterna(v === true)} />
                  Nota interna
                </label>
              )}
            </div>
            <Button size="sm" disabled={enviando}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
