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

  // Siempre responde 200 a Mercado Pago para confirmar recepción
  res.sendStatus(200);
};
