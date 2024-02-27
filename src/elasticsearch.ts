import { Client } from '@elastic/elasticsearch';
import { ClusterHealthResponse } from '@elastic/elasticsearch/lib/api/types';
import { config } from './configuration';
import { winstonLogger } from '@remus1504/micrograde';

import { Logger } from 'winston';

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  'UserElasticSearchServer',
  'debug',
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
      log.info(`User Elasticsearch health  - ${healthOfConnection.status}`);
      Connected = true;
    } catch (error) {
      log.error('Connection to Elasticsearch failed.');
      log.log('error', 'UserService Connection() method:', error);
    }
  }
};

export { checkConnection };
