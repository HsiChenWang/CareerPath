import express, { type Express, type ErrorRequestHandler } from "express";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { sessionMiddleware } from "./middlewares/session";
import { HttpError } from "./lib/domain";

const app: Express = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(express.json({ limit: "128kb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.get("sec-fetch-site") === "cross-site") {
    res.status(403).json({ error: "Cross-site requests are not allowed." }); return;
  }
  next();
});
app.use(sessionMiddleware);

app.use("/api", router);
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof HttpError) { res.status(error.status).json({ error: error.message }); return; }
  if (error?.name === "ZodError") { res.status(400).json({ error: "Some fields are invalid. Please check your input and try again." }); return; }
  if (error?.code === "23505") { res.status(409).json({ error: "This already exists. Please refresh and try again." }); return; }
  req.log.error({ errorType: error instanceof Error ? error.name : "Unknown", message: error instanceof Error ? error.message : "Unknown error" }, "Request failed");
  res.status(500).json({ error: "Something went wrong. Please try again." });
};
app.use(errorHandler);

export default app;
