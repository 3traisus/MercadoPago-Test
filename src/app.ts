import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import router from "./Routes/routes.js";
import { authMiddleware } from "./middlewares/auth.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Generar un token JWT de prueba
app.post("/login", (req, res) => {
  const { username } = req.body;
  const token = jwt.sign({ username }, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
  res.json({ token });
});

app.get("/getlogin" ,(req, res) => {
  const { token } = req.body;
  const username = jwt.decode(token)
  res.json({ username });
});

app.get("/ping", (req, res) => {
  res.json({ response:"pong" });
});

app.get("/pingCheck", authMiddleware ,(req, res) => {
  res.json({ response:"autorizado" });
});

app.use("/api", router);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

