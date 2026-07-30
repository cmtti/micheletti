import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha — ElétricaFlow" },
      {
        name: "description",
        content: "Crie uma nova senha segura para acessar o painel de projetos elétricos.",
      },
      { property: "og:title", content: "Redefinir senha — ElétricaFlow" },
      {
        property: "og:description",
        content: "Crie uma nova senha segura para sua conta ElétricaFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RedefinirSenhaPage,
});

const forte = (s: string) => s.length >= 8 && /[a-zA-Z]/.test(s) && /[0-9]/.test(s);

function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setPronto(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!forte(senha))
      return toast.error("A senha deve ter ao menos 8 caracteres, com letras e números.");
    if (senha !== confirmar) return toast.error("As senhas não conferem.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha alterada com sucesso.");
    navigate({ to: "/dashboard" });
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

        <h1 className="text-lg font-semibold">Criar nova senha</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mínimo de 8 caracteres, contendo letras e números.
        </p>

        {!pronto ? (
          <p className="mt-6 rounded-md border border-border bg-secondary p-4 text-sm">
            Link inválido ou expirado. Solicite um novo link de redefinição.
          </p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={salvar}>
            <div className="space-y-1.5">
              <Label htmlFor="nova">Nova senha</Label>
              <Input
                id="nova"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conf">Repetir senha</Label>
              <Input
                id="conf"
                type="password"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            {senha && !forte(senha) && (
              <p className="text-sm text-danger">
                Use ao menos 8 caracteres, com letras e números.
              </p>
            )}
            {confirmar && senha !== confirmar && (
              <p className="text-sm text-danger">As senhas não conferem.</p>
            )}
            <Button className="w-full" disabled={loading}>
              Salvar nova senha
            </Button>
          </form>
        )}

        <Link
          to="/esqueci-senha"
          className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Solicitar novo link
        </Link>
      </div>
    </div>
  );
}
