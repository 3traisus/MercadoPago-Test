import { Router } from "express";
import {
  validateWebhookSignature,
} from '../controllers/test.controllers.js';

const testRouter = Router() as ReturnType<typeof Router>;

// Prefijo: /api/mercado_pago
testRouter.use("/validate", validateWebhookSignature);

export default testRouter;