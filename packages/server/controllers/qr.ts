import bwipjs from "bwip-js";
import sharp from "sharp";
import { processBufferUploads } from "../utils/upload";
import type { Request, Response } from "express";

export const generateCode = async (_req: Request, res: Response) => {
  try {
    const code = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const qrBuffer = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: code,
      scale: 5,
      backgroundcolor: "FFFFFF",
    });
    const img = sharp(qrBuffer);
    const meta = await img.metadata();
    const padding = 20;
    const textHeight = 60;
    const width = (meta.width ?? 200) + padding * 2;
    const height = (meta.height ?? 200) + textHeight + padding * 2;
    const svg = `<svg width="${width}" height="${
      textHeight - 10
    }"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="monospace" font-size="42" fill="#000">${code}</text></svg>`;
    const svgBuffer = Buffer.from(svg);
    const finalImage = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qrBuffer, top: padding, left: padding },
        { input: svgBuffer, top: (meta.height ?? 200) + padding, left: 0 },
      ])
      .png()
      .toBuffer();

    const imageUrl = await processBufferUploads(finalImage, code, "qr-codes");

    res.status(200).json({ success: true, code, imageUrl });
  } catch (error) {
    console.error("Failed to generate code", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate code" });
  }
};
