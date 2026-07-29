import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Printer, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TIPOS_DOCUMENTO,
  TIPOS_PROJETO,
  brl,
  dataBR,
  deleteRow,
  fetchApoios,
  fetchCards,
  fetchClientes,
  fetchProfiles,
  fetchProjetos,
  insertRow,
  situacaoPrazo,
  updateRow,
  type Projeto,
  type ProjetoStatus,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/projetos")({
  component: ProjetosPage,
});

const STATUS_LABEL: Record<ProjetoStatus, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

function ProjetoForm({
  projeto,
  onDone,
}: {
  projeto?: Projeto;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const [nome, setNome] = useState(projeto?.nome ?? "");
  const [clienteId, setClienteId] = useState(projeto?.cliente_id ?? "");
  const [tipo, setTipo] = useState(projeto?.tipo ?? TIPOS_PROJETO[0]);
  const [status, setStatus] = useState<ProjetoStatus>(projeto?.status ?? "ativo");
  const [descricao, setDescricao] = useState(projeto?.descricao ?? "");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const values = {
      nome,
      cliente_id: clienteId || null,
      tipo,
      status,
      descricao: descricao || null,
    };
    try {
      if (projeto) await updateRow("projetos", projeto.id, values);
      else await insertRow("projetos", values);
      qc.invalidateQueries({ queryKey: ["projetos"] });
      toast.success("Projeto salvo.");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={salvar}>
      <div className="space-y-1.5">
        <Label>Nome do projeto</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PROJETO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjetoStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <Button className="w-full">Salvar projeto</Button>
    </form>
  );
}

function ApoiosDialog({ projeto }: { projeto: Projeto }) {
  const qc = useQueryClient();
  const { data: apoios = [] } = useQuery({
    queryKey: ["apoios", projeto.id],
    queryFn: () => fetchApoios(projeto.id),
  });
  const [tipo, setTipo] = useState(TIPOS_DOCUMENTO[0]);
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileText className="h-4 w-4" /> Apoio ({apoios.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Projetos de apoio — {projeto.nome}</DialogTitle>
        </DialogHeader>
        <ul className="divide-y divide-border rounded-md border border-border">
          {apoios.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {a.tipo_documento}
                  {a.link_referencia && (
                    <>
                      {" · "}
                      <a
                        className="underline"
                        href={a.link_referencia}
                        target="_blank"
                        rel="noreferrer"
                      >
                        abrir
                      </a>
                    </>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await deleteRow("projetos_apoio", a.id);
                  qc.invalidateQueries({ queryKey: ["apoios", projeto.id] });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
          {apoios.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">Nenhum documento vinculado.</li>
          )}
        </ul>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_DOCUMENTO.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Link" value={link} onChange={(e) => setLink(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={!nome.trim()}
          onClick={async () => {
            await insertRow("projetos_apoio", {
              projeto_id: projeto.id,
              tipo_documento: tipo,
              nome: nome.trim(),
              link_referencia: link || null,
            });
            setNome("");
            setLink("");
            qc.invalidateQueries({ queryKey: ["apoios", projeto.id] });
          }}
        >
          <Plus className="h-4 w-4" /> Vincular documento
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ProjetosPage() {
  const qc = useQueryClient();
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: fetchCards });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });

  const [busca, setBusca] = useState("");
  const [fCliente, setFCliente] = useState("todos");
  const [fTipo, setFTipo] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");
  const [fResp, setFResp] = useState("todos");
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Projeto | null>(null);

  const lista = useMemo(
    () =>
      projetos.filter((p) => {
        const doProjeto = cards.filter((c) => c.projeto_id === p.id);
        return (
          p.nome.toLowerCase().includes(busca.toLowerCase()) &&
          (fCliente === "todos" || p.cliente_id === fCliente) &&
          (fTipo === "todos" || p.tipo === fTipo) &&
          (fStatus === "todos" || p.status === fStatus) &&
          (fResp === "todos" || doProjeto.some((c) => c.responsavel_id === fResp))
        );
      }),
    [projetos, cards, busca, fCliente, fTipo, fStatus, fResp],
  );

  return (
    <AppShell
      title="Projetos"
      description="Listagem completa com filtros, custos e documentos de apoio"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Exportar PDF
          </Button>
          <Dialog open={novo} onOpenChange={setNovo}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Novo projeto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo projeto</DialogTitle>
              </DialogHeader>
              <ProjetoForm onDone={() => setNovo(false)} />
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Input
          className="w-56"
          placeholder="Buscar projeto..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Select value={fCliente} onValueChange={setFCliente}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            {TIPOS_PROJETO.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fResp} onValueChange={setFResp}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome || p.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cards</TableHead>
              <TableHead>Valor serviço / recebido</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right print:hidden">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((p) => {
              const doProjeto = cards.filter((c) => c.projeto_id === p.id);
              const atrasados = doProjeto.filter((c) => situacaoPrazo(c) === "atrasado").length;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.nome}
                    {atrasados > 0 && (
                      <Badge className="ml-2 bg-danger text-danger-foreground">
                        {atrasados} atrasado(s)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{clientes.find((c) => c.id === p.cliente_id)?.nome ?? "—"}</TableCell>
                  <TableCell className="capitalize">{p.tipo}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === "ativo" ? "default" : "secondary"}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{doProjeto.length}</TableCell>
                  <TableCell className="text-sm">
                    {brl(doProjeto.reduce((s, c) => s + Number(c.custo_estimado), 0))} /{" "}
                    {brl(doProjeto.reduce((s, c) => s + Number(c.custo_real), 0))}
                  </TableCell>
                  <TableCell>{dataBR(p.created_at)}</TableCell>
                  <TableCell className="text-right print:hidden">
                    <ApoiosDialog projeto={p} />
                    <Button variant="ghost" size="sm" onClick={() => setEditando(p)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={async () => {
                        if (!window.confirm("Excluir este projeto e seus cards?")) return;
                        await deleteRow("projetos", p.id);
                        qc.invalidateQueries({ queryKey: ["projetos"] });
                        qc.invalidateQueries({ queryKey: ["cards"] });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar projeto</DialogTitle>
          </DialogHeader>
          {editando && <ProjetoForm projeto={editando} onDone={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
