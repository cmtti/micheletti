import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, FolderKanban, HandCoins, Printer, Wallet } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  brl,
  dataBR,
  fetchCards,
  fetchEtapas,
  fetchProjetos,
  fetchTodosParceiros,
  situacaoPrazo,
  diasAtraso,
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

  const atrasados = useMemo(
    () => cards.filter((c) => situacaoPrazo(c) === "atrasado"),
    [cards],
  );
  const estimado = cards.reduce((s, c) => s + Number(c.custo_estimado), 0);
  const real = cards.reduce((s, c) => s + Number(c.custo_real), 0);
  const pagoTerceiros = parceiros.reduce((s, p) => s + Number(p.valor || 0), 0);
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
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Exportar PDF
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Projetos ativos"
          value={String(projetos.filter((p) => p.status === "ativo").length)}
          hint={`${projetos.length} projetos no total`}
          icon={FolderKanban}
        />
        <Kpi
          label="Valor do serviço x recebido"
          value={brl(real)}
          hint={`Valor do serviço ${brl(estimado)}`}
          icon={CheckCircle2}
          tone={real > estimado ? "danger" : "success"}
        />
        <Kpi
          label="Valor pago a terceiros/prestadores"
          value={brl(pagoTerceiros)}
          hint={`${porParceiro.length} parceiro(s)`}
          icon={HandCoins}
        />
        <Kpi
          label="Valor líquido"
          value={brl(liquido)}
          hint="Valor recebido − pago a terceiros"
          icon={Wallet}
          tone={liquido < 0 ? "danger" : "success"}
        />
      </div>


      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-3">
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

          <h2 className="mt-8 text-sm font-semibold">
            Valor pago por parceiro/prestador de serviço
          </h2>
          <div className="mt-4 h-72">
            {porParceiro.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento a parceiros registrado.
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


        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Cards em atraso</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/kanban">Ver quadro</Link>
            </Button>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {atrasados.slice(0, 8).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Previsto para {dataBR(c.fim_previsto)}
                  </p>
                </div>
                <Badge className="bg-danger text-danger-foreground">
                  {diasAtraso(c)}d
                </Badge>
              </li>
            ))}
            {atrasados.length === 0 && (
              <li className="py-6 text-sm text-muted-foreground">Nenhum card em atraso.</li>
            )}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
