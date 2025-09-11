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
        success: "https://www.tu-sitio/success",
        failure: "https://www.tu-sitio/failure",
        pending: "https://www.tu-sitio/pending"
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
