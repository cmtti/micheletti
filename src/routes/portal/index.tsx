import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronRight } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { LinhaDoTempo } from "@/components/portal/LinhaDoTempo";
import { ETAPAS_CLIENTE, dataBR } from "@/lib/api";
import { exigirCliente, fetchPortalProjetos } from "@/lib/portal";

export const Route = createFileRoute("/portal/")({
  ssr: false,
  beforeLoad: () => exigirCliente(),
  head: () => ({
    meta: [
      { title: "Meus projetos — Portal do Cliente Lenzee" },
      { name: "description", content: "Lista dos seus projetos com a Lenzee." },
      { property: "og:title", content: "Meus projetos — Portal do Cliente Lenzee" },
      { property: "og:description", content: "Lista dos seus projetos com a Lenzee." },
    ],
  }),
  component: PortalHome,
});

function PortalHome() {
  const { nome } = Route.useRouteContext();
  const { data: projetos = [], isLoading } = useQuery({
    queryKey: ["portal", "projetos"],
    queryFn: fetchPortalProjetos,
  });
  return (
    <PortalShell nome={nome}>
      <h1 className="text-xl font-semibold">Olá, {nome?.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Acompanhe aqui seus projetos.</p>
      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && projetos.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum projeto vinculado ainda.
          </div>
        )}
        {projetos.map((p) => (
          <Link
            key={p.id}
            to="/portal/projeto/$id"
            params={{ id: p.id }}
            className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{p.nome}</h2>
                <p className="text-xs capitalize text-muted-foreground">{p.tipo}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <LinhaDoTempo etapa={p.etapa} compacta />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-medium text-primary">
                {ETAPAS_CLIENTE.find((e) => e.id === p.etapa)?.label ?? "Orçamento"}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" /> Entrega: {dataBR(p.prazo_entrega)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}
