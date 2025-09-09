import cookeParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";
import authRouter from "./routes/auth";
import branchRouter from "./routes/branch";
import businessRouter from "./routes/business";
import employeeRouter from "./routes/employee";
import qrRouter from "./routes/qr";
import stockRouter from "./routes/stock";
import saleRouter from "./routes/sale";

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
app.use("/api/business", businessRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/branch", branchRouter);
app.use("/api/qr", qrRouter);
app.use("/api/stock", stockRouter);
app.use("/api/sale", saleRouter);

app.listen(port, () => {
  console.log(`Server Listening on http://localhost:${port}...`);
});
