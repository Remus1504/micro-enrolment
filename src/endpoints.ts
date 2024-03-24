import { verifyGatewayRequest } from '@remus1504/micrograde-shared';
import { Application } from 'express';
import { healthRoutes } from '../src/Endpoints/health';
import { enrolmentRoutes } from '../src/Endpoints/enrolment';

const BASE_PATH = '/api/v1/enrolment';

const appRoutes = (app: Application): void => {
  app.use('', healthRoutes());
  app.use(BASE_PATH, verifyGatewayRequest, enrolmentRoutes());
};

export { appRoutes };
