import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteRow,
  fetchClientes,
  fetchProjetos,
  insertRow,
  updateRow,
  type Cliente,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/clientes")({
  component: ClientesPage,
});

function ClienteForm({ cliente, onDone }: { cliente?: Cliente; onDone: () => void }) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(cliente?.nome ?? "");
  const [contato, setContato] = useState(cliente?.contato ?? "");
  const [email, setEmail] = useState(cliente?.email ?? "");
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "");

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const values = { nome, contato, email, telefone };
    try {
      if (cliente) await updateRow("clientes", cliente.id, values);
      else await insertRow("clientes", values);
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente salvo.");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <form className="space-y-4" onSubmit={salvar}>
      <div className="space-y-1.5">
        <Label>Nome / Razão social</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Pessoa de contato</Label>
        <Input value={contato} onChange={(e) => setContato(e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Telefone</Label>
          <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
      </div>
      <Button className="w-full">Salvar cliente</Button>
    </form>
  );
}

function ClientesPage() {
  const qc = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const [novo, setNovo] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState("");

  const lista = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <AppShell
      title="Clientes"
      description="Cadastro de clientes e contatos vinculados aos projetos"
      actions={
        <Dialog open={novo} onOpenChange={setNovo}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo cliente</DialogTitle>
            </DialogHeader>
            <ClienteForm onDone={() => setNovo(false)} />
          </DialogContent>
        </Dialog>
      }
    >
      <Input
        className="mb-4 w-64"
        placeholder="Buscar cliente..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Projetos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.contato || "—"}</TableCell>
                <TableCell>{c.email || "—"}</TableCell>
                <TableCell>{c.telefone || "—"}</TableCell>
                <TableCell>{projetos.filter((p) => p.cliente_id === c.id).length}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditando(c)}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (!window.confirm("Excluir este cliente?")) return;
                      await deleteRow("clientes", c.id);
                      qc.invalidateQueries({ queryKey: ["clientes"] });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
          </DialogHeader>
          {editando && <ClienteForm cliente={editando} onDone={() => setEditando(null)} />}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
