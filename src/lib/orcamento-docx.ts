import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import logoUrl from "@/assets/lenzee-positivo.png";
import type { EmpresaConfig, Orcamento, OrcamentoItem } from "./api";
import { brl } from "./api";

const AZUL = "0093D3";
const NAVY = "12172B";

const dataBR = (iso?: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "";

function titulo(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: AZUL, space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, color: NAVY, size: 24 })],
  });
}

function texto(text: string, opts: { bold?: boolean } = {}) {
  return new Paragraph({
    spacing: { after: 100 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, bold: opts.bold })],
  });
}

async function carregarLogo() {
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export async function gerarOrcamentoDocx(
  orcamento: Orcamento,
  itens: OrcamentoItem[],
  empresa: EmpresaConfig | null,
) {
  const normas = itens.filter((i) => i.tipo === "norma");
  const atividades = itens.filter((i) => i.tipo === "atividade");
  const parcelas = itens.filter((i) => i.tipo === "parcela");
  const logo = await carregarLogo();

  const children: Paragraph[] = [];

  if (logo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            type: "png",
            data: logo,
            transformation: { width: 180, height: 60 },
            altText: { title: "Lenzee", description: "Logotipo Lenzee", name: "Lenzee" },
          }),
        ],
      }),
    );
  }

  if (empresa) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: empresa.razao_social, bold: true, color: NAVY, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `CNPJ: ${empresa.cnpj}  |  Reg. CREA-SP: ${empresa.crea}`,
            size: 18,
          }),
        ],
      }),
    );
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `${empresa?.cidade_emissao ?? ""}, ${new Date(orcamento.created_at).toLocaleDateString("pt-BR")}`,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [
        new TextRun({ text: `Proposta comercial nº ${orcamento.numero}`, bold: true, color: NAVY }),
      ],
    }),
    texto(`Att.: ${orcamento.cliente_nome}`, { bold: true }),
  );

  if (orcamento.cliente_cnpj) children.push(texto(`CNPJ: ${orcamento.cliente_cnpj}`));
  children.push(texto(`Atividade: ${orcamento.atividade}`));
  if (orcamento.condicao) children.push(texto(`Condição: ${orcamento.condicao}`));
  if (orcamento.local_obra) children.push(texto(`Local: ${orcamento.local_obra}`));

  if (orcamento.escopo) {
    children.push(titulo("Escopo da proposta"), texto(orcamento.escopo));
  }

  if (normas.length) {
    children.push(titulo("Normas técnicas aplicáveis"));
    normas.forEach((n) =>
      children.push(
        new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun(n.texto)] }),
      ),
    );
  }

  if (atividades.length) {
    children.push(titulo("Atividades do projeto"));
    atividades.forEach((a) =>
      children.push(
        new Paragraph({ numbering: { reference: "numeros", level: 0 }, children: [new TextRun(a.texto)] }),
      ),
    );
  }

  children.push(
    titulo("Investimento"),
    texto(`${orcamento.valor_descricao}: ${brl(Number(orcamento.valor))}`, { bold: true }),
  );
  if (orcamento.validade) children.push(texto(`Validade da proposta: ${dataBR(orcamento.validade)}`));

  children.push(titulo("Condição de pagamento"));
  if (parcelas.length) {
    parcelas.forEach((p, i) =>
      children.push(
        new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          children: [new TextRun(`Parcela ${i + 1}: ${brl(Number(p.valor))}`)],
        }),
      ),
    );
  } else {
    children.push(texto(`${orcamento.parcelas}x de ${brl(Number(orcamento.valor) / Math.max(1, orcamento.parcelas))}`));
  }
  if (orcamento.condicao_pagamento) children.push(texto(orcamento.condicao_pagamento));

  if (orcamento.prazo_entrega) {
    children.push(titulo("Prazo de entrega"), texto(orcamento.prazo_entrega));
  }
  if (orcamento.observacoes) {
    children.push(titulo("Observações"), texto(orcamento.observacoes));
  }

  if (empresa) {
    children.push(
      new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun("__________________________________")] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: empresa.engenheiro_nome, bold: true })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `${empresa.engenheiro_titulo} — Reg. CREA: ${empresa.engenheiro_crea}`,
            size: 18,
          }),
        ],
      }),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: "numeros",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Orcamento-${orcamento.numero}-${orcamento.cliente_nome.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
