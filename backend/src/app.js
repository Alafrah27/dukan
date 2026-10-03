import express from "express";
import { clerkMiddleware } from "@clerk/express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import userRoute from "./route/user.route.js";
import shippingRoute from "./route/shipping.route.js";
import addressRoute from "./route/address.route.js";
import categoryRoute from "./route/category.route.js";
import productRoute from "./route/product.route.js";
import cartRoute from "./route/cart.route.js";
import tailoringRoute from "./route/tailoring.route.js";
import offerRoute from "./route/offer.route.js";

const app = express();

// 1. CORS first - ensures all requests (including preflight and error responses) get CORS headers
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// 2. Helmet with crossOriginResourcePolicy disabled so cross-origin requests & assets aren't blocked
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// 3. Body parsers with 15MB limit for base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 4. Cookies & Clerk Auth
app.use(cookieParser());
app.use(clerkMiddleware());

// 5. Health route
app.get("/health", (req, res) => {
  res.json({ message: "server is running" });
});

// 6. API routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/shipping", shippingRoute);
app.use("/api/v1/address", addressRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/products", productRoute);
app.use("/api/v1/cart", cartRoute);
app.use("/api/v1/tailoring", tailoringRoute);
app.use("/api/v1/offers", offerRoute);

// 7. Error handling middleware (guarantees CORS headers & json response on errors)
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: "حجم الصورة أو البيانات كبير جداً، الحد الأقصى 15 ميغابايت",
    });
  }
  res.status(err.status || 500).json({
    error: err.message || "حدث خطأ في الخادم",
  });
});

export default app;

