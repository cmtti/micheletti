import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser, useMyRoles } from "@/hooks/use-session";
import { fetchEmpresaConfig, insertRow, updateRow, type EmpresaConfig } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Lenzee Engenharia Elétrica" },
      {
        name: "description",
        content:
          "Dados fixos da empresa usados nas propostas comerciais: razão social, CNPJ, CREA e engenheiro responsável.",
      },
      { property: "og:title", content: "Configurações — Lenzee Engenharia Elétrica" },
      {
        property: "og:description",
        content: "Atualize os dados da empresa utilizados nos orçamentos.",
      },
    ],
  }),
  component: ConfiguracoesPage,
});

const CAMPOS: { key: keyof Omit<EmpresaConfig, "id">; label: string }[] = [
  { key: "razao_social", label: "Razão social" },
  { key: "cnpj", label: "CNPJ" },
  { key: "crea", label: "Reg. CREA-SP (empresa)" },
  { key: "engenheiro_nome", label: "Engenheiro responsável" },
  { key: "engenheiro_titulo", label: "Título do engenheiro" },
  { key: "engenheiro_crea", label: "Reg. CREA do engenheiro" },
  { key: "cidade_emissao", label: "Local / cidade de emissão" },
];

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { user } = useCurrentUser();
  const { isAdmin } = useMyRoles(user?.id);
  const { data: config } = useQuery({ queryKey: ["empresa_config"], queryFn: fetchEmpresaConfig });
  const [form, setForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (config) {
      const { id: _id, ...rest } = config;
      setForm(rest as unknown as Record<string, string>);
    }
  }, [config]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      if (config) await updateRow("empresa_config", config.id, form);
      else await insertRow("empresa_config", form);
      qc.invalidateQueries({ queryKey: ["empresa_config"] });
      toast.success("Dados da empresa atualizados.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppShell
      title="Configurações"
      description="Dados fixos da empresa utilizados nos orçamentos"
    >
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={salvar}>
            {CAMPOS.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input
                  disabled={!isAdmin}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={!isAdmin || salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </Button>
              {!isAdmin && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Apenas administradores podem alterar esses dados.
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}
