import dotenv from "dotenv";
import express from "express";

dotenv.config();
const app = express();

app.use(express.json());

// mount routers
import userRouter from "./routes/employees.routes.js";
app.use("/api", userRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

// debugging helpers
console.log("PORT from env:", process.env.PORT);
console.log("DB host:", process.env.DB_HOST);
