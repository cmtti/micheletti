import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  KanbanSquare,
  FolderKanban,
  Users,
  Contact,
  LogOut,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useMyRoles } from "@/hooks/use-session";
import { ROLE_LABEL } from "@/lib/api";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/kanban", label: "Quadro Kanban", icon: KanbanSquare },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/clientes", label: "Clientes", icon: Contact },
  { to: "/usuarios", label: "Usuários", icon: Users },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { roles, profile } = useMyRoles(user?.id);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex print:hidden">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">ElétricaFlow</p>
            <p className="text-xs text-muted-foreground">Gestão de projetos</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-3">
          <p className="truncate px-2 text-sm font-medium">{profile?.nome ?? user?.email}</p>
          <p className="truncate px-2 text-xs text-muted-foreground">
            {roles.map((r) => ROLE_LABEL[r]).join(", ") || "Sem perfil"}
          </p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={sair}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4 print:hidden">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 py-2 lg:hidden print:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {label}
            </Link>
          ))}
        </div>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
