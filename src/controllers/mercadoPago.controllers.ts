// SDK de Mercado Pago
import { Request, Response, NextFunction } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import crypto from "crypto";
interface Item {
  id: string;
  title:string,
  quantity: number;
  unit_price: number;
}

// función que devuelve la instancia del client
export const getMercadoPagoClient = () => {
  const client = new MercadoPagoConfig({ accessToken: process.env.ACCESSTOKEN_MERCADOPAGO! });
  return new Preference(client);
};

export const createPreference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preference = getMercadoPagoClient();
    const { items }: { items: Item[] } = req.body;
    console.log("items",items)
    const preferenceData = {
      items,
      back_urls: {
        success: process.env.BASE_URL+"/Payments/Success",
        failure: process.env.BASE_URL+"/Payments/Pending",
        pending: process.env.BASE_URL+"/Payments/Failure"
      },
      auto_return: "approved",
    };

    const response = await preference.create({
      body: 
      {
        ...preferenceData,
        notification_url:"https://mercadopago-test-i4fs.onrender.com/api/mercado_pago/webHook"
      }});

    res.json({ id: response.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear preferencia" });
  }
};


export const WebHook = async (req: Request, res: Response) => {
  try {
    const secret = process.env.MP_WEBHOOK_SECRET || ""; // misma clave que configuraste en Mercado Pago
    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;

    if (!signature || !requestId) {
      return res.status(401).json({ valid: false, reason: "missing headers" });
    }

    // La firma llega en el formato: ts=...,v1=...
    // Ejemplo: "ts=1736868433,v1=sha256=abcd1234..."
    const [tsPart, v1Part] = signature.split(",");
    const ts = tsPart!.split("=")[1];
    const signatureHash = v1Part!.split("=")[1];

    // Extraemos el data.id desde los query params
    const dataId = (req.query["data.id"] as string)?.toLowerCase(); // si es alfanumérico, debe ir en minúsculas
    if (!dataId) {
      return res.status(401).json({ valid: false, reason: "missing data.id" });
    }

    // Construimos el template exacto que Mercado Pago espera
    const template = `id:${dataId};request-id:${requestId};ts:${ts};`;

    // Calculamos el hash esperado
    const expectedHash = crypto
      .createHmac("sha256", secret)
      .update(template)
      .digest("hex");

    if (signatureHash === expectedHash) {
      console.log("✅ Webhook válido:", req.body);
      return res.status(200).json({ valid: true });
    } else {
      console.log("❌ Firma inválida");
      return res.status(401).json({ valid: false });
    }
  } catch (err) {
    console.error("Error en webhook:", err);
    return res.status(500).json({ valid: false, error: "internal error" });
  }
};


/*
    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;
    if (!signature || !requestId) throw new Error("Faltan headers");

    const [tsPart, v1Part] = signature.split(",");
    const ts = tsPart?.split("=")[1];
    const hash = v1Part?.split("=")[1];
    if (!ts || !hash) throw new Error("Formato inválido en x-signature");

    // usar el campo correcto del body
    const paymentId = req.body?.data?.id;
    if (!paymentId) throw new Error("Falta payment id en el body");

    const data = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const secret = process.env.MP_WEBHOOK_SECRET!;

    const sha = crypto.createHmac("sha256", secret).update(data).digest("hex");

    console.log("🔑 Calculado:", sha);
    console.log("🔑 Header:", hash);

    if (sha !== hash) {
      console.error("❌ Firma inválida, request no confiable");
      return res.status(401).send("Unauthorized");
    }

    console.log("✅ Webhook válido:", req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(400);
*/