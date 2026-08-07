import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logoPositivo from "@/assets/lenzee-positivo.png.asset.json";
import logoNegativo from "@/assets/lenzee-negativo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Lenzee Engenharia Elétrica" },
      {
        name: "description",
        content:
          "Acesse o sistema de gestão de projetos elétricos da Lenzee Engenharia Elétrica e Consultoria.",
      },
      { property: "og:title", content: "Entrar — Lenzee Engenharia Elétrica" },
      {
        property: "og:description",
        content: "Acesse o sistema de gestão de projetos elétricos da Lenzee.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/dashboard" });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada. Aguarde a liberação de um administrador.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error("Não foi possível entrar com Google.");
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-2">
      {/* Painel da marca */}
      <aside className="relative hidden flex-col justify-between bg-brand-navy p-12 lg:flex">
        <img src={logoNegativo.url} alt="Lenzee Engenharia Elétrica e Consultoria" className="w-64" />
        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight text-white">
            Gestão de projetos elétricos, do orçamento à entrega.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Quadro Kanban, controle de valores, prazos, documentos e conformidade normativa em um
            único lugar.
          </p>
          <span className="mt-8 block h-1 w-24 rounded-full bg-primary" />
        </div>
        <a
          href="https://lenzee.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline"
        >
          lenzee.com.br
        </a>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <img
            src={logoPositivo.url}
            alt="Lenzee Engenharia Elétrica e Consultoria"
            className="mx-auto mb-8 w-56 lg:hidden"
          />

          <h2 className="text-2xl font-semibold tracking-tight">Acessar o sistema</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Entre com suas credenciais corporativas.
          </p>

          <Tabs defaultValue="entrar" className="mt-6">
            <TabsList className="w-full">
              <TabsTrigger className="flex-1" value="entrar">
                Entrar
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="criar">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form className="space-y-4 pt-4" onSubmit={entrar}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={loading}>
                  Entrar
                </Button>
                <Link
                  to="/esqueci-senha"
                  className="block text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Esqueci minha senha
                </Link>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form className="space-y-4 pt-4" onSubmit={cadastrar}>
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha2">Senha</Label>
                  <Input
                    id="senha2"
                    type="password"
                    required
                    minLength={6}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={loading}>
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continuar com Google
          </Button>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <a
              href="https://lenzee.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground hover:underline"
            >
              lenzee.com.br
            </a>{" "}
            · Lenzee Engenharia Elétrica e Consultoria
          </p>
        </div>
      </main>
    </div>
  );
}
