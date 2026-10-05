import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoPositivo from "@/assets/lenzee-positivo.png.asset.json";

export const Route = createFileRoute("/portal/entrar")({
  head: () => ({
    meta: [
      { title: "Portal do Cliente — Lenzee" },
      { name: "description", content: "Acompanhe seus projetos elétricos com a Lenzee." },
      { property: "og:title", content: "Portal do Cliente — Lenzee" },
      { property: "og:description", content: "Acompanhe seus projetos elétricos com a Lenzee." },
    ],
  }),
  component: EntrarPortal,
});

function EntrarPortal() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/portal` },
    });
    setLoading(false);
    // Mensagem neutra: não revela se o e-mail está cadastrado
    if (error && !/signups not allowed|not found/i.test(error.message)) return toast.error(error.message);
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-1.5 bg-primary" />
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <img src={logoPositivo.url} alt="Lenzee Engenharia Elétrica" className="mx-auto mb-8 w-52" />
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {enviado ? (
              <div className="text-center">
                <MailCheck className="mx-auto h-10 w-10 text-primary" />
                <h1 className="mt-3 text-lg font-semibold">Confira seu e-mail</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Se <strong>{email}</strong> estiver cadastrado, você receberá um link de acesso.
                  Basta clicar nele para entrar.
                </p>
                <Button variant="ghost" className="mt-4" onClick={() => setEnviado(false)}>
                  Usar outro e-mail
                </Button>
              </div>
            ) : (
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <h1 className="text-xl font-semibold">Portal do Cliente</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Informe seu e-mail e enviaremos um link de acesso. Não é preciso senha.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Receber link de acesso"}
                </Button>
              </form>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Lenzee Engenharia Elétrica e Consultoria
          </p>
        </div>
      </main>
    </div>
  );
}
