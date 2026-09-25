import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FileText, FolderKanban, HandCoins, Printer, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ToggleValoresButton,
  useValuesVisibility,
} from "@/components/ValuesVisibility";
import {
  brl,
  fetchCards,
  fetchEtapas,
  fetchProjetos,
  fetchTodosParceiros,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});


function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-danger"
      : tone === "success"
        ? "text-success"
        : "text-primary";
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Dashboard() {
  const { data: cards = [] } = useQuery({ queryKey: ["cards"], queryFn: fetchCards });
  const { data: etapas = [] } = useQuery({ queryKey: ["etapas"], queryFn: fetchEtapas });
  const { data: projetos = [] } = useQuery({ queryKey: ["projetos"], queryFn: fetchProjetos });
  const { data: parceiros = [] } = useQuery({
    queryKey: ["parceiros"],
    queryFn: fetchTodosParceiros,
  });

  const { valoresOcultos: ocultar, formatarValor: money } = useValuesVisibility();

  const etapaOrcamentoIds = new Set(
    etapas
      .filter((e) => e.nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("orcamento"))
      .map((e) => e.id),
  );
  const cardsOrcamento = cards.filter((c) => c.etapa_id && etapaOrcamentoIds.has(c.etapa_id));
  const cardsServico = cards.filter((c) => !(c.etapa_id && etapaOrcamentoIds.has(c.etapa_id)));
  const idsServico = new Set(cardsServico.map((c) => c.id));
  const emOrcamento = cardsOrcamento.reduce((s, c) => s + Number(c.custo_estimado), 0);
  const projetosOrcamento = new Set(cardsOrcamento.map((c) => c.projeto_id)).size;
  const estimado = cardsServico.reduce((s, c) => s + Number(c.custo_estimado), 0);
  const real = cardsServico.reduce((s, c) => s + Number(c.custo_real), 0);
  const pagoTerceiros = parceiros
    .filter((p) => idsServico.has(p.card_id))
    .reduce((s, p) => s + Number(p.valor || 0), 0);
  const liquido = real - pagoTerceiros;

  const porEtapa = etapas.map((e) => ({
    nome: e.nome.length > 14 ? e.nome.slice(0, 14) + "…" : e.nome,
    cards: cards.filter((c) => c.etapa_id === e.id).length,
  }));

  const porParceiro = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of parceiros) {
      const nome = (p.nome || "").trim() || "Sem nome";
      mapa.set(nome, (mapa.get(nome) ?? 0) + Number(p.valor || 0));
    }
    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [parceiros]);

  return (
    <AppShell
      title="Dashboard"
      description="Indicadores gerais da carteira de projetos elétricos"
      actions={
        <>
          <ToggleValoresButton />
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Exportar PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi
          label="Projetos ativos"
          value={String(projetos.filter((p) => p.status === "ativo").length)}
          hint={`${projetos.length} projetos no total`}
          icon={FolderKanban}
        />
        <Kpi
          label="Em orçamento"
          value={money(emOrcamento)}
          hint={`${projetosOrcamento} projeto(s) em orçamento`}
          icon={FileText}
        />
        <Kpi
          label="Valor do serviço x recebido"
          value={money(real)}
          hint={`Valor do serviço ${money(estimado)}`}
          icon={CheckCircle2}
          tone={real > estimado ? "danger" : "success"}
        />
        <Kpi
          label="Valor pago a terceiros/prestadores"
          value={money(pagoTerceiros)}
          hint={`${porParceiro.length} parceiro(s)`}
          icon={HandCoins}
        />
        <Kpi
          label="Valor líquido"
          value={money(liquido)}
          hint="Valor recebido − pago a terceiros"
          icon={Wallet}
          tone={liquido < 0 ? "danger" : "success"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Quantidade de cards por etapa</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porEtapa}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="nome" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="cards" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">
            Valor pago por parceiro/prestador de serviço
          </h2>
          <div className="mt-4 h-72">
            {porParceiro.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento a parceiros registrado.
              </p>
            ) : ocultar ? (
              <p className="text-sm text-muted-foreground">
                Valores ocultos. Clique em “Mostrar valores” para exibir o gráfico.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porParceiro}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="nome"
                    fontSize={11}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis fontSize={11} tickFormatter={(v) => brl(Number(v))} width={90} />
                  <Tooltip
                    formatter={(v) => brl(Number(v))}
                    cursor={{ fill: "var(--muted)" }}
                  />
                  <Bar dataKey="valor" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
