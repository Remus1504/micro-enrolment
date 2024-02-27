import { databaseConnection } from "./database";
import { config } from "./configuration";
import express, { Express } from "express";
import { start } from "./server";

const initilize = (): void => {
  config.cloudinaryConfig();
  databaseConnection();
  const app: Express = express();
  start(app);
};

initilize();
