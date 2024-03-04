import { Client } from "@elastic/elasticsearch";
import { ClusterHealthResponse } from "@elastic/elasticsearch/lib/api/types";
import { config } from "./configuration";
import { winstonLogger } from "@remus1504/micrograde-shared";

import { Logger } from "winston";

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  "EnrolmentElasticSearchServer",
  "debug"
);

const elasticSearchClient = new Client({
  node: `${config.ELASTIC_SEARCH_ENDPOINT}`,
});

const checkConnection = async (): Promise<void> => {
  let Connected = false;
  while (!Connected) {
    try {
      const healthOfConnection: ClusterHealthResponse =
        await elasticSearchClient.cluster.health({});
      log.info(
        `Enrolment Elasticsearch health  - ${healthOfConnection.status}`
      );
      Connected = true;
    } catch (error) {
      log.error("Connection to Elasticsearch failed.");
      log.log("error", "EnrolmentService Connection() method:", error);
    }
  }
};

export { checkConnection };
