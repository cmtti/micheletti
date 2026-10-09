import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ChamadoConversa, StatusChamadoBadge } from "@/components/chamados/ChamadoConversa";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-session";
import { dataBR, fetchProfiles, fetchProjetos } from "@/lib/api";
import {
  CATEGORIA_LABEL,
  CHAMADO_STATUS,
  alterarStatusChamado,
  fetchChamados,
  type ChamadoStatus,
} from "@/lib/chamados";

export const Route = createFileRoute("/_authenticated/chamados")({
  validateSearch: (s: Record<string, unknown>) => ({
    projeto: typeof s.projeto === "string" ? s.projeto : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Chamados — Lenzee" },
      { name: "description", content: "Chamados abertos pelos clientes no portal." },
      { property: "og:title", content: "Chamados — Lenzee" },
      { property: "og:description", content: "Chamados abertos pelos clientes no portal." },
    ],
  }),
  component: ChamadosPage,
});

function ChamadosPage() {
  const qc = useQueryClient();
  const search = Route.useSearch();
  const { user } = useCurrentUser();
  const { data: chamados = [] } = useQuery({ queryKey: ["chamados"], queryFn: () => fetchChamados() });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const [fStatus, setFStatus] = useState<string>("ativos");
  const [fProjeto, setFProjeto] = useState<string>(search.projeto ?? "todos");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const lista = useMemo(
    () =>
      chamados.filter(
        (c) =>
          (fStatus === "todos" ||
            (fStatus === "ativos" ? c.status !== "fechado" : c.status === fStatus)) &&
          (fProjeto === "todos" || c.projeto_id === fProjeto),
      ),
    [chamados, fStatus, fProjeto],
  );
  const aberto = chamados.find((c) => c.id === abertoId) ?? null;
  const nomeAutor = (id: string | null) => profiles.find((p) => p.id === id)?.nome ?? "Cliente";

  async function mudarStatus(id: string, s: ChamadoStatus) {
    try {
      await alterarStatusChamado(id, s);
      qc.invalidateQueries({ queryKey: ["chamados"] });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <AppShell title="Chamados" description="Solicitações dos clientes pelo portal">
      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Não fechados</SelectItem>
            <SelectItem value="todos">Todos os status</SelectItem>
            {CHAMADO_STATUS.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fProjeto} onValueChange={setFProjeto}>
          <SelectTrigger className="w-60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os projetos</SelectItem>
            {projetos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Aberto em</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => setAbertoId(c.id)}>
                <TableCell className="font-medium">{c.titulo}</TableCell>
                <TableCell>{projetos.find((p) => p.id === c.projeto_id)?.nome ?? "—"}</TableCell>
                <TableCell>{CATEGORIA_LABEL[c.categoria]}</TableCell>
                <TableCell>{dataBR(c.created_at)}</TableCell>
                <TableCell><StatusChamadoBadge status={c.status} /></TableCell>
              </TableRow>
            ))}
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhum chamado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAbertoId(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {aberto && (
            <>
              <DialogHeader>
                <DialogTitle>{aberto.titulo}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {projetos.find((p) => p.id === aberto.projeto_id)?.nome}
                </span>
                <Select value={aberto.status} onValueChange={(v) => mudarStatus(aberto.id, v as ChamadoStatus)}>
                  <SelectTrigger className="ml-auto w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHAMADO_STATUS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ChamadoConversa chamado={aberto} meuId={user?.id} equipe nomeAutor={nomeAutor} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
