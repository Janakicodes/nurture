import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import weeklyContentRouter from "./weeklyContent";
import symptomsRouter from "./symptoms";
import kicksRouter from "./kicks";
import appointmentsRouter from "./appointments";
import benefitsRouter from "./benefits";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(weeklyContentRouter);
router.use(symptomsRouter);
router.use(kicksRouter);
router.use(appointmentsRouter);
router.use(benefitsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(analyticsRouter);

export default router;
