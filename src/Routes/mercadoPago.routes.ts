import { Router } from 'express';
import {
  createPreference,
  WebHook
} from '../controllers/mercadoPago.controllers.js';
import { authMiddleware } from "../middlewares/auth.js";

const mercadoPagoRouter = Router() as ReturnType<typeof Router>;

mercadoPagoRouter.post('/create_preference', authMiddleware, createPreference);
mercadoPagoRouter.post('/webHook', WebHook);


export default mercadoPagoRouter;