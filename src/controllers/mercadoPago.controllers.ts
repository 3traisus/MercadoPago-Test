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
    console.log("📩 Headers:", req.headers);
    console.log("📩 Query:", req.query);
    console.log("📩 Body:", req.body);

    const signature = req.headers["x-signature"] as string;
    const requestId = req.headers["x-request-id"] as string;

    if (!signature || !requestId) {
      console.error("❌ Faltan headers requeridos");
      return res.status(400).send("Bad Request");
    }

    // Extraer ts y hash desde la firma
    const [tsPart, v1Part] = signature.split(",");
    const ts = tsPart?.split("=")[1];
    const hash = v1Part?.split("=")[1];

    if (!ts || !hash) {
      console.error("❌ Formato inválido en x-signature");
      return res.status(400).send("Bad Request");
    }

    // El ID debe venir de la query: data.id
    const dataId = req.query["data.id"] as string;
    if (!dataId) {
      console.error("❌ Falta data.id en query");
      return res.status(400).send("Bad Request");
    }

    // Construir manifest
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    console.log("📝 Manifest generado:", manifest);

    // Calcular firma HMAC
    const secret = process.env.MP_WEBHOOK_SECRET!;
    const sha = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

    console.log("🔑 Calculado:", sha);
    console.log("🔑 Header:", hash);

    // Comparar firmas
    if (sha !== hash) {
      console.error("❌ Firma inválida, request no confiable");
      return res.status(401).send("Unauthorized");
    }

    // ✅ Webhook válido
    console.log("✅ Webhook válido:", {
      query: req.query,
      body: req.body,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.sendStatus(500);
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