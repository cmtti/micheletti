import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchOrcamentoModelos,
  fetchTiposProjeto,
  insertRow,
  updateRow,
} from "@/lib/api";

const vazio = { escopo: "", normas: "", atividades: "", rotulo_valor: "", observacao: "" };

export function ModelosOrcamento({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { data: tipos = [] } = useQuery({ queryKey: ["tipos_projeto"], queryFn: fetchTiposProjeto });
  const { data: modelos = [] } = useQuery({
    queryKey: ["orcamento_modelos"],
    queryFn: fetchOrcamentoModelos,
  });
  const [tipo, setTipo] = useState("");
  const [form, setForm] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  const modelo = modelos.find((m) => m.tipo === tipo);

  useEffect(() => {
    if (!tipo && tipos.length) setTipo(tipos[0].nome);
  }, [tipos, tipo]);

  useEffect(() => {
    setForm(
      modelo
        ? {
            escopo: modelo.escopo,
            normas: modelo.normas.join("\n"),
            atividades: modelo.atividades.join("\n"),
            rotulo_valor: modelo.rotulo_valor,
            observacao: modelo.observacao,
          }
        : vazio,
    );
  }, [modelo, tipo]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const linhas = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
    const valores = {
      tipo,
      escopo: form.escopo,
      normas: linhas(form.normas),
      atividades: linhas(form.atividades),
      rotulo_valor: form.rotulo_valor,
      observacao: form.observacao,
    };
    try {
      if (modelo) await updateRow("orcamento_modelos", modelo.id, valores);
      else await insertRow("orcamento_modelos", valores);
      qc.invalidateQueries({ queryKey: ["orcamento_modelos"] });
      toast.success("Modelo salvo.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const campo = (k: keyof typeof vazio) => ({
    disabled: !isAdmin,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <Card className="mt-6 max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">Modelos de orçamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={salvar}>
          <div className="space-y-1.5">
            <Label>Tipo de projeto</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-64 capitalize">
                <SelectValue placeholder="Escolha o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.nome} className="capitalize">
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!modelo && tipo && (
              <p className="text-xs text-muted-foreground">Este tipo ainda não tem modelo.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Escopo (use [descrição] onde o texto do cliente entra)</Label>
            <Textarea rows={3} {...campo("escopo")} />
          </div>
          <div className="space-y-1.5">
            <Label>Normas (uma por linha)</Label>
            <Textarea rows={5} {...campo("normas")} />
          </div>
          <div className="space-y-1.5">
            <Label>Atividades (uma por linha)</Label>
            <Textarea rows={8} {...campo("atividades")} />
          </div>
          <div className="space-y-1.5">
            <Label>Rótulo do valor (ex.: "do projeto das instalações elétricas.")</Label>
            <Input {...campo("rotulo_valor")} />
          </div>
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea rows={4} {...campo("observacao")} />
          </div>
          <Button type="submit" disabled={!isAdmin || !tipo || salvando}>
            {salvando ? "Salvando..." : "Salvar modelo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
