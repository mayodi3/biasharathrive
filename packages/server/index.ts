import express from "express";
import "dotenv/config";

const app = express();

const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello Isaac");
});

app.listen(port, () => {
  console.log(`Server Listening on http://localhost:${port}`);
});
