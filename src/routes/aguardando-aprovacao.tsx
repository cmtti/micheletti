import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/aguardando-aprovacao")({
  head: () => ({
    meta: [
      { title: "Aguardando aprovação — ElétricaFlow" },
      {
        name: "description",
        content:
          "Seu cadastro foi criado e aguarda liberação de acesso por um administrador do ElétricaFlow.",
      },
      { property: "og:title", content: "Aguardando aprovação — ElétricaFlow" },
      {
        property: "og:description",
        content: "Seu cadastro aguarda liberação de acesso por um administrador.",
      },
    ],
  }),
  component: AguardandoPage,
});

function AguardandoPage() {
  const navigate = useNavigate();

  async function sair() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold">Acesso aguardando aprovação</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta foi criada com sucesso, mas o acesso ao sistema precisa ser liberado por um
          administrador. Você será avisado assim que a liberação for feita.
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={sair}>
          Sair
        </Button>
      </div>
    </div>
  );
}
