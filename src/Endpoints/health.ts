import { health } from "../Controller/health";
import express, { Router } from "express";

const router: Router = express.Router();

const healthRoutes = (): Router => {
  router.get("/enrolment-health", health);

  return router;
};

export { healthRoutes };
