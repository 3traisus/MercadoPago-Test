// SDK de Mercado Pago
import { Request, Response, NextFunction } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';

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


export const WebHook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("📩 Notificación recibida de Mercado Pago:", req.body, "/", req.headers);
  try {
    const xSignature = req.headers["x-signature"] as string;
    const xRequestId = req.headers["x-request-id"] as string;
    const dataId = req.query["data.id"] as string; // viene en query params de la URL

    if (!xSignature || !xRequestId || !dataId) {
      console.error("❌ Faltan datos en la cabecera o query");
      return res.sendStatus(400);
    }

    // Separar la cabecera x-signature en partes
    const parts = xSignature.split(",");
    let ts: string | undefined;
    let hash: string | undefined;

    parts.forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();
        if (trimmedKey === "ts") ts = trimmedValue;
        if (trimmedKey === "v1") hash = trimmedValue;
      }
    });

    if (!ts || !hash) {
      console.error("❌ Firma inválida, falta ts o v1");
      return res.sendStatus(400);
    }

    // ⚠️ Usa tu "secret key" de Mercado Pago (NO el access token ni public key)
    const secret = process.env.MP_WEBHOOK_SECRET!;

    // Manifest string en el orden exacto
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Crear el HMAC con sha256
    const crypto = require('crypto');
    const cyphedSignature = crypto
        .createHmac('sha256', secret)
        .update(manifest)
        .digest('hex');

    if (cyphedSignature === hash) {
      console.log("✅ Firma válida, procesando evento...");
      // Aquí puedes procesar la notificación (guardar pago, etc.)
      res.sendStatus(200);
    } else {
      console.error("❌ Firma inválida, posible request no confiable");
      res.sendStatus(401);
    }
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
};
