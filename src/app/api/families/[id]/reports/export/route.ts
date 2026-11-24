import { authHandler } from "@/lib/api";
import { requireFamilyContext } from "@/lib/auth";
import { ApiError } from "@/lib/errors";
import { formatMoney } from "@/lib/money";
import { getReportData } from "@/lib/queries";

type Params = { id: string };

function period(request: Request) {
  const url = new URL(request.url);
  const to = new Date(url.searchParams.get("to") ?? Date.now());
  const from = new Date(url.searchParams.get("from") ?? new Date(Date.now() - 365 * 86_400_000));
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new ApiError("Período inválido.", 400);
  return { from, to };
}

function csv(data: Awaited<ReturnType<typeof getReportData>>) {
  const rows = [
    ["Data", "Tipo", "Descrição", "Categoria", "Conta", "Valor"],
    ...data.transactions.map((tx) => [
      new Date(tx.date).toLocaleDateString("pt-BR"),
      tx.type,
      tx.description,
      tx.category?.name ?? "",
      tx.account?.name ?? "",
      formatMoney(tx.amountCents),
    ]),
  ];
  const content = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  return "\uFEFF" + content;
}

export const GET = authHandler<Params>(async ({ request, params }) => {
  await requireFamilyContext(params.id, "reports.view");
  const { from, to } = period(request);
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  const data = await getReportData(params.id, from, to);

  if (format === "csv") {
    return new Response(csv(data), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-${data.family.slug}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format === "xlsx") {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Movimentações");
    sheet.columns = [
      { header: "Data", key: "date", width: 14 },
      { header: "Tipo", key: "type", width: 14 },
      { header: "Descrição", key: "description", width: 36 },
      { header: "Categoria", key: "category", width: 22 },
      { header: "Conta", key: "account", width: 22 },
      { header: "Valor (R$)", key: "value", width: 16 },
    ];
    data.transactions.forEach((tx) =>
      sheet.addRow({
        date: new Date(tx.date).toLocaleDateString("pt-BR"),
        type: tx.type,
        description: tx.description,
        category: tx.category?.name ?? "",
        account: tx.account?.name ?? "",
        value: tx.amountCents / 100,
      }),
    );
    sheet.getColumn("value").numFmt = "#,##0.00";
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="relatorio-${data.family.slug}.xlsx"`,
      },
    });
  }

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Relatório — ${data.family.name}`, 14, 18);
    doc.setFontSize(9);
    doc.text(`Período: ${from.toLocaleDateString("pt-BR")} a ${to.toLocaleDateString("pt-BR")}`, 14, 25);
    doc.text(`Receitas: ${formatMoney(data.totals.income)}   Despesas: ${formatMoney(data.totals.expense)}   Lucros: ${formatMoney(data.totals.profit)}`, 14, 32);
    let y = 42;
    data.transactions.slice(0, 45).forEach((tx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${new Date(tx.date).toLocaleDateString("pt-BR")}  ${tx.type.padEnd(8)}  ${tx.description.slice(0, 48).padEnd(50)}  ${formatMoney(tx.amountCents)}`, 14, y);
      y += 5;
    });
    const buffer = Buffer.from(doc.output("arraybuffer"));
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="relatorio-${data.family.slug}.pdf"`,
      },
    });
  }

  throw new ApiError("Formato não suportado. Use csv, xlsx ou pdf.", 400);
});
