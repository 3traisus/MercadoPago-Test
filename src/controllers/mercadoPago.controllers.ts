// SDK de Mercado Pago
import { Request, Response, NextFunction } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
// Agrega credenciales
const client = new MercadoPagoConfig({ accessToken: process.env.ACCESSTOKEN_MERCADOPAGO! });
const preference = new Preference(client);

interface Item {
  id: string;
  title:string,
  quantity: number;
  unit_price: number;
}

export const createPreference = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
      body: preferenceData,
    });

    res.json({ id: response.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear preferencia" });
  }
};


export const WebHook = async (req: Request, res: Response, next: NextFunction) => {
  console.log("📩 Notificación recibida de Mercado Pago:", req.body);

  // Siempre responde 200 a Mercado Pago para confirmar recepción
  res.sendStatus(200);
};