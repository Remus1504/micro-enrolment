import { verifyGatewayRequest } from "@remus1504/micrograde";
import { Application } from "express";
import { healthRoutes } from "../src/Endpoints/health";
import { orderRoutes } from "../src/Endpoints/enrolment";

const BASE_PATH = "/api/v1/order";

const appRoutes = (app: Application): void => {
  app.use("", healthRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, orderRoutes());
};

export { appRoutes };
