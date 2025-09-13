import { Request, Response } from "express";
import crypto from "crypto";

export const validateWebhookSignature = async (req: Request, res: Response) => {
  try {
    // Estos valores los mandas en el body al llamar este endpoint manualmente
    const { xSignature, xRequestId, dataId, secret } = req.body;

    if (!xSignature || !xRequestId || !dataId || !secret) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // Separar ts y v1 de la cabecera x-signature
    const parts = xSignature.split(",");
    let ts = "";
    let hash = "";
    for (const part of parts) {
      const [key, value] = part.split("=");
      if (key.trim() === "ts") ts = value.trim();
      if (key.trim() === "v1") hash = value.trim();
    }

    if (!ts || !hash) {
      return res.status(400).json({ error: "Formato inválido en x-signature" });
    }

    // Construir el manifest como exige MP
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calcular HMAC
    const sha = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    const isValid = sha === hash;

    return res.json({
      manifest,
      shaCalculado: sha,
      hashRecibido: hash,
      valido: isValid,
    });
  } catch (err) {
    console.error("❌ Error en validador:", err);
    return res.status(500).json({ error: "Error interno" });
  }
};
