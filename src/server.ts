import http from 'http';

import 'express-async-errors';
import {
  CustomError,
  IAuthPayload,
  IErrorResponse,
  winstonLogger,
} from '@remus1504/micrograde-shared';
import { Logger } from 'winston';
import { config } from './configuration';
import {
  Application,
  Request,
  Response,
  NextFunction,
  json,
  urlencoded,
} from 'express';
import hpp from 'hpp';
import helmet from 'helmet';
import cors from 'cors';
import { verify } from 'jsonwebtoken';
import compression from 'compression';
import { checkConnection } from './elasticsearch';
import { appRoutes } from './endpoints';
import { createConnection } from './Queues/connection';
import { Channel } from 'amqplib';
import { Server } from 'socket.io';
import { consumerReviewFanoutMessages } from './Queues/enrolment.consumer';

const SERVER_PORT = 4006;
const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  'enrolementServer',
  'debug'
);
let enrolmentChannel: Channel;
let socketIOOrderObject: Server;

const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);
  startQueues();
  startElasticSearch();
  orderErrorHandler(app);
  startServer(app);
};

const securityMiddleware = (app: Application): void => {
  app.set('trust proxy', 1);
  app.use(hpp());
  app.use(helmet());
  app.use(
    cors({
      origin: config.API_GATEWAY_ENDPOINT,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const payload: IAuthPayload = verify(
        token,
        config.JWT_TOKEN!
      ) as IAuthPayload;
      req.currentUser = payload;
    }
    next();
  });
};

const standardMiddleware = (app: Application): void => {
  app.use(compression());
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ extended: true, limit: '200mb' }));
};

const routesMiddleware = (app: Application): void => {
  appRoutes(app);
};

const startQueues = async (): Promise<void> => {
  enrolmentChannel = (await createConnection()) as Channel;
  await consumerReviewFanoutMessages(enrolmentChannel);
};

const startElasticSearch = (): void => {
  checkConnection();
};

const orderErrorHandler = (app: Application): void => {
  app.use(
    (
      error: IErrorResponse,
      _req: Request,
      res: Response,
      next: NextFunction
    ) => {
      log.log('error', `Enrolment ${error.comingFrom}:`, error);
      if (error instanceof CustomError) {
        res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    }
  );
};

const startServer = async (app: Application): Promise<void> => {
  try {
    const httpServer: http.Server = new http.Server(app);
    const socketIO: Server = await createSocketIO(httpServer);
    startHttpServer(httpServer);
    socketIOOrderObject = socketIO;
  } catch (error) {
    log.log('error', 'Enrolment startServer() method error:', error);
  }
};

const createSocketIO = async (httpServer: http.Server): Promise<Server> => {
  const io: Server = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });
  return io;
};

const startHttpServer = (httpServer: http.Server): void => {
  try {
    log.info(`Enrolment server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Enrolment server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'Enrolment startHttpServer() method error:', error);
  }
};

export { start, enrolmentChannel, socketIOOrderObject };
