import { createFileRoute, Link } from "@tanstack/react-router";
import { KanbanSquare, ShieldCheck, LineChart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ElétricaFlow — Gestão Kanban de Projetos Elétricos" },
      {
        name: "description",
        content:
          "Controle projetos elétricos do orçamento à entrega: quadro Kanban, custos, prazos, versões de documentos e conformidade normativa.",
      },
      { property: "og:title", content: "ElétricaFlow — Gestão Kanban de Projetos Elétricos" },
      {
        property: "og:description",
        content:
          "Quadro Kanban para equipes de engenharia elétrica: orçamento, desenvolvimento, revisão técnica e entrega.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Fluxo completo",
    text: "Do backlog ao projeto entregue, com etapas configuráveis e arrastar-e-soltar.",
  },
  {
    icon: LineChart,
    title: "Valores e prazos",
    text: "Valor do serviço x valor recebido, percentual de andamento e alerta automático de atraso.",
  },
  {
    icon: ShieldCheck,
    title: "Conformidade",
    text: "Checklist NBR 5410, NBR 5419, NR-10 e anexos com controle de revisão.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span className="font-semibold">ElétricaFlow</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="border-b border-border py-16">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Engenharia elétrica
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Gestão Kanban para projetos elétricos, do orçamento à entrega
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Organize solicitações, orçamentos, desenvolvimento, revisão técnica e aprovação do
            cliente em um único quadro — com custos, prazos, versões de documentos e conformidade
            normativa sob controle.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Acessar o sistema</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Criar conta da equipe</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-6 py-14 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
