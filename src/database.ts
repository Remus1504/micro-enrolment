import { winstonLogger } from "@remus1504/micrograde-shared";
import { Logger } from "winston";
import { config } from "./configuration";
import mongoose from "mongoose";

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  "usersDatabaseServer",
  "debug"
);

const databaseConnection = async (): Promise<void> => {
  try {
    await mongoose.connect(`${config.MONGO_DB_CONNCECTION_URL}`);
    log.info("Enrolment service successfully connected to database.");
  } catch (error) {
    log.log(
      "error",
      "EnrolmentService databaseConnection() method error:",
      error
    );
  }
};

export { databaseConnection };
