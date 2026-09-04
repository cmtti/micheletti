import {
  AlignmentType,
  BorderStyle,
  Document,
  Header,
  ImageRun,
  LevelFormat,
  Packer,
  PageBreak,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import logoAsset from "@/assets/lenzee-logo-header.png.asset.json";
import assinaturaAsset from "@/assets/lenzee-assinatura.png.asset.json";
import type { EmpresaConfig, Orcamento, OrcamentoItem } from "./api";
import { brl } from "./api";

const NAVY = "0A0A46";
const CINZA = "7A7A7A";
const CONTENT_WIDTH = 9638;

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const dataBR = (iso?: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "";

/** Parágrafo com label em negrito no início e o restante em texto normal. */
function linhaLabel(label: string, valor: string, opts: { after?: number } = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160 },
    alignment: AlignmentType.JUSTIFIED,
    children: [
      new TextRun({ text: label, bold: true }),
      new TextRun({ text: valor ? ` ${valor}` : "" }),
    ],
  });
}

function tituloSecao(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: NAVY, space: 2 } },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 24 })],
  });
}

function paragrafo(text: string, after = 160) {
  return new Paragraph({
    spacing: { after },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun(text)],
  });
}

async function carregarImagem(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const borda = { style: BorderStyle.SINGLE, size: 4, color: "9A9A9A" };
const bordas = { top: borda, bottom: borda, left: borda, right: borda };
const margens = { top: 100, bottom: 100, left: 140, right: 140 };

function celula(children: Paragraph[], width: number, columnSpan?: number) {
  return new TableCell({
    borders: bordas,
    margins: margens,
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: "FFFFFF", type: ShadingType.CLEAR, color: "auto" },
    ...(columnSpan ? { columnSpan } : {}),
    children,
  });
}

export async function gerarOrcamentoDocx(
  orcamento: Orcamento,
  itens: OrcamentoItem[],
  empresa: EmpresaConfig | null,
) {
  const normas = itens.filter((i) => i.tipo === "norma");
  const atividades = itens.filter((i) => i.tipo === "atividade");
  const parcelas = itens.filter((i) => i.tipo === "parcela");
  const [logo, assinatura] = await Promise.all([
    carregarImagem(logoAsset.url),
    carregarImagem(assinaturaAsset.url),
  ]);

  const emissao = new Date(orcamento.created_at);
  const cidade = empresa?.cidade_emissao ?? "";

  const logoParagraph = (width: number) =>
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: logo
        ? [
            new ImageRun({
              type: "png",
              data: logo,
              transformation: { width, height: Math.round((width * 314) / 1700) },
              altText: {
                title: "Lenzee",
                description: "Logotipo Lenzee Engenharia Elétrica",
                name: "Lenzee",
              },
            }),
          ]
        : [new TextRun({ text: "LENZEE", bold: true, color: NAVY, size: 32 })],
    });

  const children: (Paragraph | Table)[] = [];

  /* ---------- Capa ---------- */
  children.push(
    logoParagraph(420),
    new Paragraph({ spacing: { before: 2400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `Proposta comercial ${orcamento.numero}`, size: 30, color: NAVY }),
      ],
    }),
    new Paragraph({ spacing: { before: 3200 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun(
          `${cidade}, ${MESES[emissao.getMonth()]} de ${emissao.getFullYear()}.`,
        ),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  /* ---------- Identificação da empresa ---------- */
  if (empresa) {
    children.push(
      paragrafo(`${empresa.razao_social}.`, 0),
      paragrafo(`CNPJ: ${empresa.cnpj}.`, 0),
      paragrafo(`Reg. CREA-SP: ${empresa.crea}.`, 240),
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: "Engenheiro responsável:", bold: true })],
      }),
      paragrafo(
        `${empresa.engenheiro_titulo}: ${empresa.engenheiro_nome}. Reg. CREA: ${empresa.engenheiro_crea}`,
        280,
      ),
    );
  }

  /* ---------- Dados do cliente ---------- */
  children.push(linhaLabel("Att.:", `${orcamento.cliente_nome}.`, { after: 240 }));
  if (orcamento.cliente_cnpj) children.push(linhaLabel("CNPJ:", `${orcamento.cliente_cnpj}.`));
  children.push(linhaLabel("Atividade:", `${orcamento.atividade}.`));
  if (orcamento.condicao) children.push(linhaLabel("Condição:", `${orcamento.condicao}.`));
  if (orcamento.local_obra) children.push(linhaLabel("Local:", `${orcamento.local_obra}.`));

  /* ---------- Escopo ---------- */
  if (orcamento.escopo || normas.length) {
    children.push(tituloSecao("Escopo da proposta:"));
    if (orcamento.escopo) children.push(paragrafo(orcamento.escopo));
    if (normas.length) {
      children.push(paragrafo("Normas técnicas aplicáveis:", 80));
      normas.forEach((n) =>
        children.push(
          new Paragraph({
            numbering: { reference: "quadrados", level: 0 },
            spacing: { after: 80 },
            children: [new TextRun(n.texto)],
          }),
        ),
      );
    }
  }

  /* ---------- Atividades ---------- */
  if (atividades.length) {
    children.push(tituloSecao("Atividades para o projeto das instalações elétricas:"));
    atividades.forEach((a) =>
      children.push(
        new Paragraph({
          numbering: { reference: "quadrados", level: 0 },
          spacing: { after: 100 },
          children: [new TextRun(a.texto)],
        }),
      ),
    );
  }

  /* ---------- Caixa de validade + investimento ---------- */
  const colEsq = Math.round(CONTENT_WIDTH * 0.65);
  const colDir = CONTENT_WIDTH - colEsq;
  const linhas: TableRow[] = [];

  if (orcamento.validade) {
    linhas.push(
      new TableRow({
        children: [
          celula(
            [
              new Paragraph({
                children: [
                  new TextRun({ text: "Validade da proposta: ", bold: true }),
                  new TextRun(`${dataBR(orcamento.validade)}.`),
                ],
              }),
            ],
            CONTENT_WIDTH,
            2,
          ),
        ],
      }),
    );
  }

  linhas.push(
    new TableRow({
      children: [
        celula(
          [
            new Paragraph({
              children: [new TextRun({ text: `${orcamento.valor_descricao}.`, bold: true })],
            }),
          ],
          colEsq,
        ),
        celula(
          [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: brl(Number(orcamento.valor)), bold: true })],
            }),
          ],
          colDir,
        ),
      ],
    }),
  );

  parcelas.forEach((p, i) =>
    linhas.push(
      new TableRow({
        children: [
          celula([new Paragraph(`Parcela ${i + 1}`)], colEsq),
          celula(
            [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: brl(Number(p.valor)), bold: true })],
              }),
            ],
            colDir,
          ),
        ],
      }),
    ),
  );

  children.push(
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    new Table({
      width: { size: CONTENT_WIDTH, type: WidthType.DXA },
      columnWidths: [colEsq, colDir],
      rows: linhas,
    }),
    new Paragraph({ spacing: { after: 240 }, children: [] }),
  );

  /* ---------- Pagamento / prazo / observação ---------- */
  const textoPagamento =
    orcamento.condicao_pagamento ||
    (orcamento.parcelas > 1
      ? `o valor de investimento poderá ser parcelado em até ${orcamento.parcelas} vezes.`
      : "pagamento à vista.");
  children.push(linhaLabel("Proposta de pagamento:", textoPagamento));

  if (orcamento.prazo_entrega) {
    children.push(linhaLabel("Prazo para entrega do material:", orcamento.prazo_entrega));
  }
  if (orcamento.observacoes) {
    children.push(linhaLabel("Observação:", orcamento.observacoes));
  }

  /* ---------- Fechamento ---------- */
  children.push(
    paragrafo("Em caso de dúvidas, por favor nos consulte.", 200),
    paragrafo("Sem mais, por ora;", 320),
  );

  /* ---------- Assinatura ---------- */
  if (assinatura) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            type: "png",
            data: assinatura,
            transformation: { width: 300, height: Math.round((300 * 270) / 1452) },
            altText: {
              title: "Assinatura",
              description: "Assinatura do engenheiro responsável",
              name: "Assinatura",
            },
          }),
        ],
      }),
    );
  } else if (empresa) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: empresa.engenheiro_nome, bold: true, color: NAVY, size: 30 })],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: empresa.engenheiro_titulo, italics: true, color: CINZA, size: 18 }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: `CREA ${empresa.engenheiro_crea}`, color: CINZA, size: 18 }),
        ],
      }),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22, color: "1A1A1A" } } } },
    numbering: {
      config: [
        {
          reference: "quadrados",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "▪",
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
            margin: { top: 1500, right: 1134, bottom: 1134, left: 1134, header: 400 },
          },
          titlePage: true,
        },
        headers: {
          default: new Header({ children: [logoParagraph(300)] }),
          first: new Header({ children: [] }),
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
