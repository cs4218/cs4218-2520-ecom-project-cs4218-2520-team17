import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// configure env
dotenv.config();

//database config
connectDB();

const app = express();

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);

// Only serve static files if we are in production (or E2E testing)
if (process.env.NODE_ENV === 'production') {
  // Serve the React build folder
  console.log("Serving static files from React build...".bgGreen.white, __dirname);
  app.use(express.static(path.join(__dirname, 'client/build')));

  // JSON 404 handler for unknown API routes in production
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Catch-all to let React Router handle frontend URLs
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 6060;

const server = app.listen(PORT, () => {
    console.log(`[${process.env.NODE_ENV}] Server running on ${process.env.DEV_MODE} mode on ${PORT}`.bgCyan.white);
});

const serverTimeoutMs = Number(process.env.SERVER_TIMEOUT_MS);
if (Number.isFinite(serverTimeoutMs) && serverTimeoutMs > 0) {
    server.timeout = serverTimeoutMs;
}


// Memory usage logging for soak testing
// const memoryLogFile = path.join(__dirname, "logs", "memory-usage.log");
// fs.mkdirSync(path.dirname(memoryLogFile), { recursive: true });

// Log memory usage every 5 seconds for soak test - To uncomment when required
// setInterval(() => {
//   const { heapUsed, heapTotal, rss } = process.memoryUsage();
//   const localTimestamp = new Date().toLocaleString("sv-SE", {
//     timeZoneName: "short",
//   });

//   const line =
//     `[${localTimestamp}] ` +
//     `heapUsed=${(heapUsed / 1024 / 1024).toFixed(2)}MB ` +
//     `heapTotal=${(heapTotal / 1024 / 1024).toFixed(2)}MB ` +
//     `rss=${(rss / 1024 / 1024).toFixed(2)}MB\n`;

//   fs.appendFile(memoryLogFile, line, (error) => {
//     if (error) {
//       console.error("Failed to write memory usage log", error);
//     }
//   });
// }, 5000);