import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Download, FileCheck2, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PortalShell } from "@/components/portal/PortalShell";
import { LinhaDoTempo } from "@/components/portal/LinhaDoTempo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ETAPAS_CLIENTE, dataBR } from "@/lib/api";
import { exigirCliente, fetchPortalProjeto, type PortalArquivo } from "@/lib/portal";

export const Route = createFileRoute("/portal/projeto/$id")({
  ssr: false,
  beforeLoad: () => exigirCliente(),
  head: () => ({
    meta: [
      { title: "Projeto — Portal do Cliente Lenzee" },
      { name: "description", content: "Status, prazo, pagamentos e arquivos do seu projeto." },
      { property: "og:title", content: "Projeto — Portal do Cliente Lenzee" },
      { property: "og:description", content: "Status, prazo, pagamentos e arquivos do seu projeto." },
    ],
  }),
  component: PortalProjetoPage,
});

const moeda = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

async function baixar(a: PortalArquivo) {
  if (!a.storage_path) return toast.error("Arquivo indisponível.");
  const { data, error } = await supabase.storage
    .from("anexos")
    .createSignedUrl(a.storage_path, 600, { download: a.nome_arquivo });
  if (error || !data) return toast.error("Não foi possível gerar o download.");
  window.location.href = data.signedUrl;
}

function PortalProjetoPage() {
  const { id } = Route.useParams();
  const { nome } = Route.useRouteContext();
  const { data: p, isLoading } = useQuery({
    queryKey: ["portal", "projeto", id],
    queryFn: () => fetchPortalProjeto(id),
  });

  if (isLoading) return <PortalShell nome={nome}><p className="text-sm text-muted-foreground">Carregando...</p></PortalShell>;
  if (!p)
    return (
      <PortalShell nome={nome}>
        <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
        <Link to="/portal" className="mt-3 inline-block text-sm text-primary">Voltar</Link>
      </PortalShell>
    );

  const finais = p.arquivos.filter((a) => a.status === "final_aprovado");
  const outros = p.arquivos.filter((a) => a.status !== "final_aprovado");
  const pago = p.parcelas.filter((x) => x.pago).reduce((s, x) => s + Number(x.valor), 0);

  return (
    <PortalShell nome={nome}>
      <Link to="/portal" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Meus projetos
      </Link>
      <h1 className="text-xl font-semibold">{p.nome}</h1>
      <p className="text-sm capitalize text-muted-foreground">{p.tipo}</p>

      <section className="mt-5 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Status</h2>
          <span className="text-sm font-medium text-primary">
            {ETAPAS_CLIENTE.find((e) => e.id === p.etapa)?.label ?? "Orçamento"}
          </span>
        </div>
        <div className="mt-4">
          <LinhaDoTempo etapa={p.etapa} />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm">
          <CalendarClock className="h-4 w-4 text-primary" />
          Prazo previsto de entrega: <strong>{dataBR(p.prazo_entrega)}</strong>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Valor do contrato</h2>
        <p className="mt-1 text-2xl font-semibold">{moeda(p.valor_contrato)}</p>
        {p.parcelas.length > 0 && (
          <p className="text-xs text-muted-foreground">Pago até agora: {moeda(pago)}</p>
        )}
        <ul className="mt-3 divide-y divide-border">
          {p.parcelas.map((x, i) => (
            <li key={x.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{x.descricao || `Parcela ${i + 1}`}</p>
                <p className="text-xs text-muted-foreground">Vencimento: {dataBR(x.vencimento)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{moeda(x.valor)}</p>
                <Badge variant={x.pago ? "default" : "secondary"} className="mt-0.5">
                  {x.pago ? "Pago" : "Pendente"}
                </Badge>
              </div>
            </li>
          ))}
          {p.parcelas.length === 0 && (
            <li className="py-2 text-sm text-muted-foreground">Parcelas ainda não informadas.</li>
          )}
        </ul>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Arquivos</h2>
        {finais.length > 0 && (
          <div className="mt-3 space-y-2">
            {finais.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border-2 border-primary bg-primary/5 p-3">
                <FileCheck2 className="h-6 w-6 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.nome_arquivo}</p>
                  <p className="text-xs text-primary">Versão final · rev. {a.revisao}</p>
                </div>
                <Button size="sm" onClick={() => baixar(a)}>
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>
            ))}
          </div>
        )}
        <ul className="mt-2 divide-y divide-border">
          {outros.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{a.nome_arquivo}</p>
                <p className="text-xs text-muted-foreground">rev. {a.revisao} · {dataBR(a.created_at)}</p>
              </div>
              <Button size="icon" variant="ghost" aria-label="Baixar" onClick={() => baixar(a)}>
                <Download className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
        {p.arquivos.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum arquivo disponível ainda.</p>
        )}
      </section>
    </PortalShell>
  );
}
