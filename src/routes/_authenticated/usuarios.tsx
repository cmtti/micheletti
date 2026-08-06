import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  ROLE_LABEL,
  deleteRow,
  fetchProfiles,
  fetchRoles,
  insertRow,
  updateRow,
  type AppRole,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

const ROLES: AppRole[] = ["admin", "engenheiro", "comercial", "aprovador"];

function UsuariosPage() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { isAdmin } = useMyRoles(user?.id);
  const { data: profiles = [] } = useQuery({ queryKey: ["profiles"], queryFn: fetchProfiles });
  const { data: roles = [] } = useQuery({ queryKey: ["roles"], queryFn: fetchRoles });

  async function alternar(userId: string, role: AppRole, marcar: boolean) {
    try {
      if (!marcar && role === "admin") {
        const admins = roles.filter((r) => r.role === "admin");
        if (admins.length <= 1) {
          toast.error("É necessário manter ao menos um administrador no sistema.");
          return;
        }
      }
      if (marcar) await insertRow("user_roles", { user_id: userId, role });
      else {
        const atual = roles.find((r) => r.user_id === userId && r.role === role);
        if (atual) await deleteRow("user_roles", atual.id);
      }
      await qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success(
        marcar ? `Perfil ${ROLE_LABEL[role]} atribuído.` : `Perfil ${ROLE_LABEL[role]} removido.`,
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function alternarAcesso(userId: string, aprovar: boolean) {
    try {
      if (!aprovar && userId === user?.id) {
        toast.error("Você não pode revogar o próprio acesso.");
        return;
      }
      await updateRow("profiles", userId, { aprovado: aprovar });
      await qc.invalidateQueries({ queryKey: ["profiles"] });
      toast.success(aprovar ? "Acesso liberado." : "Acesso revogado.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const pendentes = profiles.filter((p) => !p.aprovado);

  return (
    <AppShell
      title="Usuários e permissões"
      description="Aprove novos acessos e defina os perfis da equipe de engenharia"
      actions={
        !isAdmin ? (
          <Badge variant="secondary">Somente administradores podem alterar perfis</Badge>
        ) : pendentes.length > 0 ? (
          <Badge>
            {pendentes.length} aguardando aprovação
          </Badge>
        ) : null
      }
    >
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Acesso liberado</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r}>{ROLE_LABEL[r]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  {p.nome || "—"}
                  {!p.aprovado && (
                    <Badge variant="secondary" className="ml-2">
                      Pendente
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{p.email}</TableCell>
                <TableCell>
                  <Switch
                    checked={p.aprovado}
                    disabled={!isAdmin}
                    onCheckedChange={(v) => alternarAcesso(p.id, v)}
                  />
                </TableCell>
                {ROLES.map((r) => {
                  const tem = roles.some((x) => x.user_id === p.id && x.role === r);
                  return (
                    <TableCell key={r}>
                      <Checkbox
                        checked={tem}
                        disabled={!isAdmin}
                        onCheckedChange={(v) => alternar(p.id, r, !!v)}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        Novos cadastros ficam bloqueados até que um administrador libere o acesso. Administrador:
        acesso total · Engenheiro/Projetista: cria e edita cards e versões · Comercial: orçamentos e
        clientes · Aprovador: aprova revisões técnicas e versões finais.
      </p>

    </AppShell>
  );
}
