import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — ElétricaFlow" },
      {
        name: "description",
        content:
          "Receba um link seguro por e-mail para redefinir a senha da sua conta ElétricaFlow.",
      },
      { property: "og:title", content: "Recuperar senha — ElétricaFlow" },
      {
        property: "og:description",
        content: "Receba um link seguro por e-mail para redefinir sua senha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EsqueciSenhaPage,
});

function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setEnviado(true);
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </span>
          <span className="font-semibold">ElétricaFlow</span>
        </div>

        <h1 className="text-lg font-semibold">Recuperar senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informe o e-mail cadastrado e enviaremos um link seguro, com prazo de expiração, para
          criar uma nova senha.
        </p>

        {enviado ? (
          <p className="mt-6 rounded-md border border-border bg-secondary p-4 text-sm">
            Se existir uma conta para <strong>{email}</strong>, o link de redefinição chegará em
            instantes. Verifique também a caixa de spam.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={enviar}>
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
            <Button className="w-full" disabled={loading}>
              Enviar link de redefinição
            </Button>
          </form>
        )}

        <Link
          to="/auth"
          className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
