import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Power, RotateCw, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser, useMyRoles } from "@/hooks/use-session";
import {
  alterarPapel,
  convidarUsuario,
  definirAtivo,
  excluirUsuario,
  listarUsuarios,
  reenviarConvite,
  type UsuarioLinha,
} from "@/lib/admin.functions";
import { ROLE_LABEL, type AppRole } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/usuarios")({
  head: () => ({ meta: [{ title: "Usuários — Lenzee" }] }),
  component: UsuariosPage,
});

const PAPEIS: AppRole[] = ["admin", "engenheiro", "visualizador"];
const STATUS: Record<UsuarioLinha["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ativo: { label: "Ativo", variant: "default" },
  pendente: { label: "Convite pendente", variant: "secondary" },
  expirado: { label: "Convite expirado", variant: "outline" },
  desativado: { label: "Desativado", variant: "destructive" },
};

function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { isAdmin } = useMyRoles(user?.id);
  const listar = useServerFn(listarUsuarios);
  const convidar = useServerFn(convidarUsuario);
  const reenviar = useServerFn(reenviarConvite);
  const mudarPapel = useServerFn(alterarPapel);
  const ativar = useServerFn(definirAtivo);
  const excluir = useServerFn(excluirUsuario);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: () => listar(),
    enabled: isAdmin,
  });

  const [convite, setConvite] = useState(false);
  const [form, setForm] = useState({ email: "", nome: "", papel: "engenheiro" as AppRole });
  const [enviando, setEnviando] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<UsuarioLinha | null>(null);

  const recarregar = () => qc.invalidateQueries({ queryKey: ["usuarios-admin"] });

  async function acao(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      await recarregar();
      toast.success(ok);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function enviarConvite(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await convidar({ data: form });
      toast.success(`Convite enviado para ${form.email}.`);
      setConvite(false);
      setForm({ email: "", nome: "", papel: "engenheiro" });
      await recarregar();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (!isAdmin) {
    return (
      <AppShell title="Usuários">
        <p className="text-muted-foreground">Somente administradores podem acessar esta tela.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Usuários e permissões"
      description="Acesso somente por convite"
      actions={
        <Button onClick={() => setConvite(true)}>
          <UserPlus className="h-4 w-4" /> Convidar usuário
        </Button>
      }
    >
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => {
              const eu = u.id === user?.id;
              const aguardando = u.status === "pendente" || u.status === "expirado";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.papel ?? undefined}
                      disabled={eu}
                      onValueChange={(v) =>
                        acao(
                          () => mudarPapel({ data: { userId: u.id, papel: v as "admin" } }),
                          "Papel atualizado.",
                        )
                      }
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sem papel" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAPEIS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {ROLE_LABEL[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge>
                  </TableCell>
                  <TableCell className="space-x-1 text-right whitespace-nowrap">
                    {aguardando && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          acao(() => reenviar({ data: { userId: u.id } }), "Convite reenviado.")
                        }
                      >
                        <RotateCw className="h-4 w-4" /> Reenviar
                      </Button>
                    )}
                    {!eu && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          acao(
                            () =>
                              ativar({ data: { userId: u.id, ativo: u.status === "desativado" } }),
                            u.status === "desativado" ? "Usuário reativado." : "Usuário desativado.",
                          )
                        }
                      >
                        <Power className="h-4 w-4" />
                        {u.status === "desativado" ? "Reativar" : "Desativar"}
                      </Button>
                    )}
                    {!eu && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${u.email}`}
                        onClick={() => setParaExcluir(u)}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && usuarios.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhum usuário.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Administrador: acesso total · Engenheiro/Projetista: edita projetos, orçamentos e anexos ·
        Visualizador: somente leitura, com valores sempre ocultos.
      </p>

      <Dialog open={convite} onOpenChange={setConvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar usuário</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={enviarConvite}>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">E-mail</Label>
              <Input
                id="c-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-nome">Nome (opcional)</Label>
              <Input
                id="c-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Papel</Label>
              <Select value={form.papel} onValueChange={(v) => setForm({ ...form, papel: v as AppRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPEIS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {ROLE_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              A pessoa recebe um e-mail com link de uso único para criar a senha. O link vale 24 horas.
            </p>
            <DialogFooter>
              <Button type="submit" disabled={enviando}>
                <Mail className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(o) => !o && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir?.email} perde o acesso e a conta é removida. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const alvo = paraExcluir;
                setParaExcluir(null);
                if (alvo) acao(() => excluir({ data: { userId: alvo.id } }), "Conta excluída.");
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
