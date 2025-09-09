import { type Request, type Response } from "express";
import { generateExportFile } from "../services/export";

export const exportData = async (req: Request, res: Response) => {
  try {
    const { dataType, format, dateRange } = req.body;

    // Parse dateRange if sent as strings
    let parsedDateRange;
    if (dateRange?.from && dateRange?.to) {
      parsedDateRange = {
        from: new Date(dateRange.from),
        to: new Date(dateRange.to),
      };
    }

    const result = await generateExportFile({
      dataType,
      format,
      dateRange: parsedDateRange,
    });

    if (result.status === "error") {
      return res.status(400).json(result);
    }

    if (result.mimeType === "text/csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      return res.send(result.fileContent);
    } else if (result.mimeType === "application/pdf") {
      const buffer = Buffer.from(result.fileContent, "base64");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      return res.send(buffer);
    }
  } catch (error: any) {
    console.error("Export failed:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};
