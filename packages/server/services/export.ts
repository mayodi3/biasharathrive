import PDFDocument from "pdfkit";
import Papa from "papaparse";
import { format } from "date-fns";

type ExportOptions = {
  dataType: "expenses" | "debts" | "sales" | "stock";
  format: "csv" | "pdf";
  dateRange?: { from: Date; to: Date };
};

type ExportResult =
  | {
      status: "success";
      fileContent: string;
      fileName: string;
      mimeType: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function generateExportFile(
  options: ExportOptions
): Promise<ExportResult> {
  const { dataType, format: fileFormat, dateRange } = options;

  try {
    let data: any[] = [];
    let columns: { id: string; header: string }[] = [];
    let title = "";

    switch (dataType) {
      case "expenses":
        if (!dateRange)
          throw new Error("Date range is required for expenses export.");
        data = await getExpenses(dateRange);
        title = "Expense Report";
        columns = [
          { id: "expenseDate", header: "Date" },
          { id: "description", header: "Description" },
          { id: "category", header: "Category" },
          { id: "amount", header: "Amount" },
        ];
        break;

      case "debts":
        if (!dateRange)
          throw new Error("Date range is required for debts export.");
        const allDebts = await getDebts();
        data = allDebts.filter(
          (d: any) =>
            new Date(d.debtDate) >= dateRange.from &&
            new Date(d.debtDate) <= dateRange.to
        );
        title = "Debts Report";
        columns = [
          { id: "debtorName", header: "Debtor" },
          { id: "debtAmount", header: "Total Debt" },
          { id: "amountPaid", header: "Paid" },
          { id: "status", header: "Status" },
          { id: "dueDate", header: "Due Date" },
        ];
        break;

      case "sales":
        if (!dateRange)
          throw new Error("Date range is required for sales export.");
        data = await getSales(dateRange);
        title = "Sales Report";
        columns = [
          { id: "soldAt", header: "Date" },
          { id: "itemName", header: "Item" },
          { id: "quantity", header: "Quantity" },
          { id: "price", header: "Price" },
          { id: "paymentMethod", header: "Payment Method" },
          { id: "salesType", header: "Sales Type" },
        ];
        break;

      case "stock":
        data = await getStockItems();
        title = "Current Stock Report";
        columns = [
          { id: "itemName", header: "Item Name" },
          { id: "buyingPrice", header: "Buying Price" },
          { id: "sellingPrice", header: "Selling Price" },
          { id: "wholesalePrice", header: "Wholesale Price" },
          { id: "quantity", header: "Quantity" },
          { id: "itemCode", header: "Item Code" },
        ];
        break;

      default:
        throw new Error("Invalid data type for export.");
    }

    // Format date fields consistently
    const dateFields = ["expenseDate", "debtDate", "dueDate", "soldAt"];
    data = data.map((item) => {
      const newItem = { ...item };
      for (const field of dateFields) {
        if (newItem[field]) {
          newItem[field] = format(new Date(newItem[field]), "yyyy-MM-dd");
        }
      }
      return newItem;
    });

    // CSV export
    if (fileFormat === "csv") {
      const csv = Papa.unparse(data, {
        header: true,
        columns: columns.map((c) => c.id),
      });
      return {
        status: "success",
        fileContent: csv,
        fileName: `${dataType}_report.csv`,
        mimeType: "text/csv",
      };
    }

    // PDF export
    if (fileFormat === "pdf") {
      const pdfBuffer = await createPdf(data, columns, title, dateRange);
      return {
        status: "success",
        fileContent: pdfBuffer.toString("base64"),
        fileName: `${dataType}_report.pdf`,
        mimeType: "application/pdf",
      };
    }

    throw new Error("Invalid file format specified.");
  } catch (error: any) {
    console.error(`Failed to export ${dataType}:`, error);
    return { status: "error", message: error.message };
  }
}

function createPdf(
  data: any[],
  columns: { id: string; header: string }[],
  title: string,
  dateRange?: { from: Date; to: Date }
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const tableTop = 150;

  doc.fontSize(20).text(title, { align: "center" });

  if (dateRange) {
    doc
      .fontSize(10)
      .text(
        `Report for period: ${format(dateRange.from, "PPP")} to ${format(
          dateRange.to,
          "PPP"
        )}`,
        { align: "center" }
      );
  }

  doc.moveDown(2);

  const columnWidth = (doc.page.width - 100) / columns.length;
  doc.fontSize(10).font("Helvetica-Bold");
  columns.forEach((column, i) =>
    doc.text(column.header, 50 + i * columnWidth, tableTop, {
      width: columnWidth,
      align: "left",
    })
  );
  doc
    .moveTo(50, tableTop + 20)
    .lineTo(doc.page.width - 50, tableTop + 20)
    .stroke();

  doc.font("Helvetica");

  let y = tableTop + 30;
  data.forEach((item) => {
    columns.forEach((column, i) => {
      const value = item[column.id]?.toString() ?? "N/A";
      doc.text(value, 50 + i * columnWidth, y, {
        width: columnWidth,
        align: "left",
      });
    });
    y += 25;

    // New page if needed
    if (y > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }
  });

  return new Promise((resolve) => {
    const buffers: any[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
}
