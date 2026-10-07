import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PortalShell } from "@/components/portal/PortalShell";
import { ChamadoConversa, StatusChamadoBadge } from "@/components/chamados/ChamadoConversa";
import { Button } from "@/components/ui/button";
import { exigirCliente } from "@/lib/portal";
import { fetchChamado, reabrirChamado } from "@/lib/chamados";

export const Route = createFileRoute("/portal/chamado/$id")({
  ssr: false,
  beforeLoad: () => exigirCliente(),
  head: () => ({
    meta: [
      { title: "Chamado — Portal do Cliente Lenzee" },
      { name: "description", content: "Acompanhe e responda seu chamado com a equipe Lenzee." },
      { property: "og:title", content: "Chamado — Portal do Cliente Lenzee" },
      { property: "og:description", content: "Acompanhe e responda seu chamado com a equipe Lenzee." },
    ],
  }),
  component: PortalChamadoPage,
});

function PortalChamadoPage() {
  const { id } = Route.useParams();
  const { nome, user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: c, isLoading } = useQuery({ queryKey: ["chamado", id], queryFn: () => fetchChamado(id) });

  async function reabrir() {
    try {
      await reabrirChamado(id);
      qc.invalidateQueries({ queryKey: ["chamado", id] });
      qc.invalidateQueries({ queryKey: ["chamados"] });
      toast.success("Chamado reaberto.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <PortalShell nome={nome}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !c ? (
        <p className="text-sm text-muted-foreground">Chamado não encontrado.</p>
      ) : (
        <>
          <Link
            to="/portal/projeto/$id"
            params={{ id: c.projeto_id }}
            className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao projeto
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-semibold">{c.titulo}</h1>
            <div className="flex items-center gap-2">
              <StatusChamadoBadge status={c.status} />
              {c.status === "respondido" && (
                <Button size="sm" variant="outline" onClick={reabrir}>
                  <RotateCcw className="h-4 w-4" /> Reabrir
                </Button>
              )}
            </div>
          </div>
          <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <ChamadoConversa
              chamado={c}
              meuId={user.id}
              equipe={false}
              nomeAutor={(a) => (a === user.id ? "Você" : "Equipe Lenzee")}
            />
          </section>
        </>
      )}
    </PortalShell>
  );
}
