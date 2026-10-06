import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  brl,
  dataBR,
  deleteRow,
  fetchParcelas,
  fetchProfiles,
  fetchProjetoClientes,
  insertRow,
  updateRow,
  type Projeto,
} from "@/lib/api";
import { convidarCliente } from "@/lib/admin.functions";
import { useCurrentUser, useMyRoles } from "@/hooks/use-session";

export function PortalProjetoDialog({ projeto }: { projeto: Projeto }) {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { isAdmin } = useMyRoles(user?.id);
  const [open, setOpen] = useState(false);
  const convidar = useServerFn(convidarCliente);
  const { data: vinculos = [] } = useQuery({
    queryKey: ["projeto_clientes", projeto.id],
    queryFn: () => fetchProjetoClientes(projeto.id),
    enabled: open,
  });
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles, enabled: open });
  const { data: parcelas = [] } = useQuery({
    queryKey: ["parcelas", projeto.id],
    queryFn: () => fetchParcelas(projeto.id),
    enabled: open,
  });
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [venc, setVenc] = useState("");

  const refreshParcelas = () => qc.invalidateQueries({ queryKey: ["parcelas", projeto.id] });

  async function enviarConvite(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await convidar({ data: { projetoId: projeto.id, email, nome: nome || undefined } });
      toast.success(r.novo ? "Convite enviado por e-mail." : "Cliente vinculado ao projeto.");
      setEmail("");
      setNome("");
      qc.invalidateQueries({ queryKey: ["projeto_clientes", projeto.id] });
      qc.invalidateQueries({ queryKey: ["profiles"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function addParcela(e: React.FormEvent) {
    e.preventDefault();
    try {
      await insertRow("projeto_parcelas", {
        projeto_id: projeto.id,
        descricao: desc || `Parcela ${parcelas.length + 1}`,
        valor: Number(valor.replace(/\./g, "").replace(",", ".")) || 0,
        vencimento: venc || null,
        ordem: parcelas.length + 1,
      });
      setDesc("");
      setValor("");
      setVenc("");
      refreshParcelas();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="h-4 w-4" /> Portal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Portal do Cliente — {projeto.nome}</DialogTitle>
        </DialogHeader>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Clientes com acesso</h3>
          <ul className="divide-y divide-border rounded-md border border-border">
            {vinculos.map((v) => {
              const pf = profiles.find((p) => p.id === v.user_id);
              return (
                <li key={v.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{pf?.nome ?? "Cliente"}</p>
                    <p className="truncate text-xs text-muted-foreground">{pf?.email}</p>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover acesso"
                      onClick={async () => {
                        await deleteRow("projeto_clientes", v.id);
                        qc.invalidateQueries({ queryKey: ["projeto_clientes", projeto.id] });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              );
            })}
            {vinculos.length === 0 && (
              <li className="p-2.5 text-sm text-muted-foreground">Nenhum cliente vinculado.</li>
            )}
          </ul>
          {isAdmin ? (
            <form onSubmit={enviarConvite} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input type="email" required placeholder="E-mail do cliente" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Nome (opcional)" value={nome} onChange={(e) => setNome(e.target.value)} />
              <Button disabled={enviando}>
                <UserPlus className="h-4 w-4" /> Convidar
              </Button>
            </form>
          ) : (
            <p className="text-xs text-muted-foreground">Somente administradores convidam clientes.</p>
          )}
        </section>

        <section className="space-y-2 pt-2">
          <h3 className="text-sm font-semibold">Parcelas</h3>
          <ul className="divide-y divide-border rounded-md border border-border">
            {parcelas.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{x.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {brl(Number(x.valor))} · venc. {dataBR(x.vencimento)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      className="accent-primary"
                      checked={x.pago}
                      onChange={async (e) => {
                        await updateRow("projeto_parcelas", x.id, { pago: e.target.checked });
                        refreshParcelas();
                      }}
                    />
                    Pago
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir parcela"
                    onClick={async () => {
                      await deleteRow("projeto_parcelas", x.id);
                      refreshParcelas();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {parcelas.length === 0 && (
              <li className="p-2.5 text-sm text-muted-foreground">Nenhuma parcela cadastrada.</li>
            )}
          </ul>
          <form onSubmit={addParcela} className="grid gap-2 sm:grid-cols-[1fr_7rem_9rem_auto]">
            <Input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <Input required inputMode="decimal" placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} />
            <Input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} />
            <Button variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <Label className="text-xs font-normal text-muted-foreground">
            O valor do contrato e o prazo de entrega ficam em "Editar" do projeto.
          </Label>
        </section>
      </DialogContent>
    </Dialog>
  );
}
