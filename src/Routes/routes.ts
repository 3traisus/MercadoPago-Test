import { Router } from "express";
import mercadoPagoRouter from "./mercadoPago.routes.js";
import testRouter from "./test.routes.js";

const router = Router() as ReturnType<typeof Router>;

// Prefijo: /api/mercado_pago
router.use("/mercado_pago", mercadoPagoRouter);
router.use("/test", testRouter);

export default router;