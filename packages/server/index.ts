import express from "express";
import cors from "cors";
import cookeParser from "cookie-parser";
import "dotenv/config";

import authRouter from "./routes/auth";

const app = express();

const clientUrl = process.env.CLIENT_URL!;

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookeParser());

const port = process.env.PORT || 4000;

app.use("/api/auth", authRouter);

app.listen(port, () => {
  console.log(`Server Listening on http://localhost:${port}...`);
});
