import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoNegativo from "@/assets/lenzee-negativo.png.asset.json";

export function PortalShell({ nome, children }: { nome?: string; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  async function sair() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/portal/entrar", replace: true });
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-brand-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/portal" aria-label="Meus projetos">
            <img src={logoNegativo.url} alt="Lenzee" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            {nome && <span className="hidden text-sm text-white/80 sm:inline">{nome}</span>}
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={sair}
            >
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
