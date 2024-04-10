import { Channel } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from './connection';
import { config } from '../configuration';
import { winstonLogger } from '@remus1504/micrograde-shared';

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  'enrolmentServiceProducer',
  'debug'
);

export const publishDirectMessage = async (
  channel: Channel,
  exchangeName: string,
  routingKey: string,
  message: string,
  logMessage: string
): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    await channel.assertExchange(exchangeName, 'direct');
    channel.publish(exchangeName, routingKey, Buffer.from(message));
    log.info(logMessage);
  } catch (error) {
    log.log(
      'error',
      'enrolmentService enrolmentServiceProducer publishDirectMessage() method:',
      error
    );
  }
};
