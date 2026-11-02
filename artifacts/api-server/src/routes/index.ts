import { Router, type IRouter } from "express";
import archiveRouter from "./archive";
import archiveCommunityRouter from "./archiveCommunity";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(archiveRouter);
router.use(archiveCommunityRouter);

export default router;
