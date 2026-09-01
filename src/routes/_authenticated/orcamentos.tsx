import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  brl,
  dataBR,
  deleteRow,
  fetchClientes,
  fetchEmpresaConfig,
  fetchOrcamentoItens,
  fetchOrcamentos,
  formatNumeroOrcamento,
  insertRow,
  proximoSequencial,
  updateRow,
  OBSERVACOES_PADRAO,
  ORCAMENTO_STATUS_LABEL,
  type Orcamento,
  type OrcamentoItem,
  type OrcamentoStatus,
} from "@/lib/api";

export const Route = createFileRoute("/_authenticated/orcamentos")({
  head: () => ({
    meta: [
      { title: "Orçamentos — Lenzee Engenharia Elétrica" },
      {
        name: "description",
        content:
          "Geração e controle de propostas comerciais padronizadas da Lenzee Engenharia Elétrica.",
      },
      { property: "og:title", content: "Orçamentos — Lenzee Engenharia Elétrica" },
      {
        property: "og:description",
        content: "Propostas comerciais padronizadas e histórico de orçamentos.",
      },
    ],
  }),
  component: OrcamentosPage,
});

type Linha = { texto: string; valor: number };

interface FormState {
  cliente_id: string | null;
  cliente_nome: string;
  cliente_cnpj: string;
  atividade: string;
  condicao: string;
  local_obra: string;
  escopo: string;
  validade: string;
  valor: string;
  valor_descricao: string;
  parcelas: number;
  condicao_pagamento: string;
  prazo_entrega: string;
  observacoes: string;
  status: OrcamentoStatus;
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}
function maisDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function estadoInicial(): FormState {
  return {
    cliente_id: null,
    cliente_nome: "",
    cliente_cnpj: "",
    atividade: "",
    condicao: "Inicial",
    local_obra: "",
    escopo: "",
    validade: maisDias(30),
    valor: "0",
    valor_descricao: "Valor de Investimento do projeto das instalações elétricas",
    parcelas: 1,
    condicao_pagamento: "",
    prazo_entrega: "até 30 dias úteis após a coleta de todas as informações necessárias",
    observacoes: OBSERVACOES_PADRAO,
    status: "enviado",
  };
}

function ListaDinamica({
  titulo,
  itens,
  setItens,
  placeholder,
  reordenavel,
  rotuloBotao,
}: {
  titulo: string;
  itens: string[];
  setItens: (v: string[]) => void;
  placeholder: string;
  reordenavel?: boolean;
  rotuloBotao: string;
}) {
  function mover(i: number, delta: number) {
    const alvo = i + delta;
    if (alvo < 0 || alvo >= itens.length) return;
    const copia = [...itens];
    [copia[i], copia[alvo]] = [copia[alvo], copia[i]];
    setItens(copia);
  }
  return (
    <div className="space-y-2">
      <Label>{titulo}</Label>
      {itens.map((texto, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={texto}
            placeholder={placeholder}
            onChange={(e) => {
              const copia = [...itens];
              copia[i] = e.target.value;
              setItens(copia);
            }}
          />
          {reordenavel && (
            <>
              <Button type="button" variant="ghost" size="icon" onClick={() => mover(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => mover(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setItens(itens.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItens([...itens, ""])}>
        <Plus className="h-4 w-4" /> {rotuloBotao}
      </Button>
    </div>
  );
}

function OrcamentoForm({
  base,
  editando,
  onDone,
}: {
  base?: { form: FormState; normas: string[]; atividades: string[]; parcelasValores: Linha[] };
  editando?: Orcamento;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ["clientes"], queryFn: fetchClientes });
  const { data: empresa } = useQuery({ queryKey: ["empresa-config"], queryFn: fetchEmpresaConfig });

  const [form, setForm] = useState<FormState>(base?.form ?? estadoInicial());
  const [normas, setNormas] = useState<string[]>(base?.normas ?? []);
  const [atividades, setAtividades] = useState<string[]>(base?.atividades ?? []);
  const [parcelasValores, setParcelasValores] = useState<number[]>(
    base?.parcelasValores?.map((p) => p.valor) ?? [0],
  );
  const [parcelasManual, setParcelasManual] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const valorNum = Number(form.valor.replace(/\./g, "").replace(",", ".")) || 0;

  useEffect(() => {
    if (parcelasManual) return;
    const n = Math.max(1, form.parcelas || 1);
    setParcelasValores(Array.from({ length: n }, () => Number((valorNum / n).toFixed(2))));
  }, [form.parcelas, valorNum, parcelasManual]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      let orcamentoId = editando?.id;
      const valores = {
        cliente_id: form.cliente_id,
        cliente_nome: form.cliente_nome,
        cliente_cnpj: form.cliente_cnpj || null,
        atividade: form.atividade,
        condicao: form.condicao || null,
        local_obra: form.local_obra || null,
        escopo: form.escopo || null,
        validade: form.validade || null,
        valor: valorNum,
        valor_descricao: form.valor_descricao,
        parcelas: Math.max(1, form.parcelas || 1),
        condicao_pagamento: form.condicao_pagamento || null,
        prazo_entrega: form.prazo_entrega || null,
        observacoes: form.observacoes || null,
        status: form.status,
      };

      if (editando) {
        await updateRow("orcamentos", editando.id, valores);
        const antigos = await fetchOrcamentoItens(editando.id);
        await Promise.all(antigos.map((i) => deleteRow("orcamento_itens", i.id)));
      } else {
        const ano = new Date().getFullYear();
        const seq = await proximoSequencial(ano);
        const novo = await insertRow<Orcamento>("orcamentos", {
          ...valores,
          ano,
          sequencial: seq,
          numero: formatNumeroOrcamento(seq),
        });
        orcamentoId = novo.id;
      }

      const itens: Record<string, unknown>[] = [
        ...normas
          .filter((t) => t.trim())
          .map((texto, ordem) => ({ orcamento_id: orcamentoId, tipo: "norma", texto, ordem })),
        ...atividades
          .filter((t) => t.trim())
          .map((texto, ordem) => ({ orcamento_id: orcamentoId, tipo: "atividade", texto, ordem })),
        ...parcelasValores.map((valor, ordem) => ({
          orcamento_id: orcamentoId,
          tipo: "parcela",
          texto: `Parcela ${ordem + 1}`,
          valor,
          ordem,
        })),
      ];
      for (const item of itens) await insertRow("orcamento_itens", item);

      qc.invalidateQueries({ queryKey: ["orcamentos"] });
      toast.success("Orçamento salvo.");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={salvar}>
      <section className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">{empresa?.razao_social ?? "Lenzee Engenharia Elétrica e Consultoria"}</p>
        <p className="text-muted-foreground">
          CNPJ {empresa?.cnpj} · CREA-SP {empresa?.crea} · {empresa?.cidade_emissao}
        </p>
        <p className="text-muted-foreground">
          {empresa?.engenheiro_nome} — {empresa?.engenheiro_titulo} — Reg. CREA:{" "}
          {empresa?.engenheiro_crea}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Dados fixos da proposta. Alteráveis na tela de Configurações.
        </p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Dados do cliente</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cliente cadastrado</Label>
            <Select
              value={form.cliente_id ?? "avulso"}
              onValueChange={(v) => {
                if (v === "avulso") return set("cliente_id", null);
                const c = clientes.find((x) => x.id === v);
                setForm((f) => ({ ...f, cliente_id: v, cliente_nome: c?.nome ?? f.cliente_nome }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avulso">Cliente avulso (digitar abaixo)</SelectItem>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Att.: (nome / razão social)</Label>
            <Input
              required
              value={form.cliente_nome}
              onChange={(e) => set("cliente_nome", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ do cliente (opcional)</Label>
            <Input value={form.cliente_cnpj} onChange={(e) => set("cliente_cnpj", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Condição</Label>
            <Input
              value={form.condicao}
              placeholder="Inicial, Complementar, Revisão..."
              onChange={(e) => set("condicao", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Atividade / título do projeto</Label>
            <Input
              required
              value={form.atividade}
              onChange={(e) => set("atividade", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Local / endereço da obra</Label>
            <Input value={form.local_obra} onChange={(e) => set("local_obra", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-1.5">
        <Label>Escopo da proposta</Label>
        <Textarea
          rows={4}
          value={form.escopo}
          onChange={(e) => set("escopo", e.target.value)}
          placeholder="Descreva o escopo geral do projeto..."
        />
      </section>

      <ListaDinamica
        titulo="Normas técnicas aplicáveis (opcional)"
        itens={normas}
        setItens={setNormas}
        placeholder="ABNT NBR 5410 — Instalações elétricas de baixa tensão"
        rotuloBotao="Adicionar norma"
      />

      <ListaDinamica
        titulo="Atividades do projeto"
        itens={atividades}
        setItens={setAtividades}
        placeholder="Descrição da atividade / entrega"
        reordenavel
        rotuloBotao="Adicionar atividade"
      />

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Validade e valor</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Validade da proposta</Label>
            <Input
              type="date"
              value={form.validade}
              onChange={(e) => set("validade", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valor de investimento (R$)</Label>
            <Input
              inputMode="decimal"
              value={form.valor}
              onChange={(e) => set("valor", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{brl(valorNum)}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição do valor</Label>
            <Input
              value={form.valor_descricao}
              onChange={(e) => set("valor_descricao", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Condição de pagamento</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Número de parcelas</Label>
            <Input
              type="number"
              min={1}
              value={form.parcelas}
              onChange={(e) => {
                setParcelasManual(false);
                set("parcelas", Number(e.target.value));
              }}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {parcelasValores.map((v, i) => (
            <div key={i} className="space-y-1.5">
              <Label className="text-xs">Parcela {i + 1}</Label>
              <Input
                inputMode="decimal"
                value={v}
                onChange={(e) => {
                  setParcelasManual(true);
                  const copia = [...parcelasValores];
                  copia[i] = Number(e.target.value.replace(",", ".")) || 0;
                  setParcelasValores(copia);
                }}
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label>Condições adicionais</Label>
          <Textarea
            rows={3}
            value={form.condicao_pagamento}
            onChange={(e) => set("condicao_pagamento", e.target.value)}
          />
        </div>
      </section>

      <div className="space-y-1.5">
        <Label>Prazo de entrega</Label>
        <Input
          value={form.prazo_entrega}
          onChange={(e) => set("prazo_entrega", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={form.observacoes}
          onChange={(e) => set("observacoes", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v as OrcamentoStatus)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(ORCAMENTO_STATUS_LABEL) as OrcamentoStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {ORCAMENTO_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button className="w-full" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar orçamento"}
      </Button>
    </form>
  );
}

function OrcamentosPage() {
  const qc = useQueryClient();
  const { data: orcamentos = [] } = useQuery({ queryKey: ["orcamentos"], queryFn: fetchOrcamentos });
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Orcamento | null>(null);
  const [base, setBase] = useState<
    { form: FormState; normas: string[]; atividades: string[]; parcelasValores: Linha[] } | undefined
  >(undefined);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | OrcamentoStatus>("todos");

  const lista = useMemo(
    () =>
      orcamentos.filter(
        (o) =>
          (filtroStatus === "todos" || o.status === filtroStatus) &&
          (o.numero.includes(busca) ||
            o.cliente_nome.toLowerCase().includes(busca.toLowerCase()) ||
            o.atividade.toLowerCase().includes(busca.toLowerCase())),
      ),
    [orcamentos, busca, filtroStatus],
  );

  function paraForm(o: Orcamento): FormState {
    return {
      cliente_id: o.cliente_id,
      cliente_nome: o.cliente_nome,
      cliente_cnpj: o.cliente_cnpj ?? "",
      atividade: o.atividade,
      condicao: o.condicao ?? "",
      local_obra: o.local_obra ?? "",
      escopo: o.escopo ?? "",
      validade: o.validade ?? maisDias(30),
      valor: String(o.valor),
      valor_descricao: o.valor_descricao,
      parcelas: o.parcelas,
      condicao_pagamento: o.condicao_pagamento ?? "",
      prazo_entrega: o.prazo_entrega ?? "",
      observacoes: o.observacoes ?? OBSERVACOES_PADRAO,
      status: o.status,
    };
  }

  async function carregarBase(o: Orcamento, modo: "editar" | "duplicar") {
    const itens: OrcamentoItem[] = await fetchOrcamentoItens(o.id);
    setBase({
      form: modo === "duplicar" ? { ...paraForm(o), status: "enviado" } : paraForm(o),
      normas: itens.filter((i) => i.tipo === "norma").map((i) => i.texto),
      atividades: itens.filter((i) => i.tipo === "atividade").map((i) => i.texto),
      parcelasValores: itens
        .filter((i) => i.tipo === "parcela")
        .map((i) => ({ texto: i.texto, valor: Number(i.valor) })),
    });
    setEditando(modo === "editar" ? o : null);
    setAberto(true);
  }

  function novo() {
    setBase(undefined);
    setEditando(null);
    setAberto(true);
  }

  return (
    <AppShell
      title="Orçamentos"
      description="Propostas comerciais padronizadas da Lenzee Engenharia Elétrica"
      actions={
        <Button size="sm" onClick={novo}>
          <Plus className="h-4 w-4" /> Novo orçamento
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          className="w-72"
          placeholder="Buscar por número, cliente ou atividade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as typeof filtroStatus)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {(Object.keys(ORCAMENTO_STATUS_LABEL) as OrcamentoStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {ORCAMENTO_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Atividade</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.numero}</TableCell>
                <TableCell>{o.cliente_nome}</TableCell>
                <TableCell className="max-w-xs truncate">{o.atividade}</TableCell>
                <TableCell>{brl(Number(o.valor))}</TableCell>
                <TableCell>{dataBR(o.created_at)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      o.status === "aprovado"
                        ? "default"
                        : o.status === "recusado"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {ORCAMENTO_STATUS_LABEL[o.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => carregarBase(o, "editar")}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Gerar Word"
                    disabled={gerando === o.id}
                    onClick={async () => {
                      setGerando(o.id);
                      try {
                        const [itens, empresa] = await Promise.all([
                          fetchOrcamentoItens(o.id),
                          fetchEmpresaConfig(),
                        ]);
                        const { gerarOrcamentoDocx } = await import("@/lib/orcamento-docx");
                        await gerarOrcamentoDocx(o, itens, empresa);
                        toast.success("Documento Word gerado.");
                      } catch (err) {
                        toast.error((err as Error).message);
                      } finally {
                        setGerando(null);
                      }
                    }}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    title="Duplicar"
                    onClick={() => carregarBase(o, "duplicar")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Excluir"
                    onClick={async () => {
                      if (!window.confirm("Excluir este orçamento?")) return;
                      try {
                        await deleteRow("orcamentos", o.id);
                        qc.invalidateQueries({ queryKey: ["orcamentos"] });
                      } catch (err) {
                        toast.error((err as Error).message);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Nenhum orçamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editando ? `Editar orçamento ${editando.numero}` : "Novo orçamento"}
            </DialogTitle>
          </DialogHeader>
          {aberto && (
            <OrcamentoForm
              key={editando?.id ?? (base ? "duplicar" : "novo")}
              base={base}
              editando={editando ?? undefined}
              onDone={() => setAberto(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
