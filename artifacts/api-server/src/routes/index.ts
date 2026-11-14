import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import careersRouter from "./careers";
import messagingRouter from "./messaging";
import chatsRouter from "./chats";
import networkRouter from "./network";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(careersRouter);
router.use(messagingRouter);
router.use(chatsRouter);
router.use(networkRouter);
router.use(aiRouter);

export default router;
