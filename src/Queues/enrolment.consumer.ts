import { Channel, ConsumeMessage, Replies } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from './connection';
import { config } from '../configuration';
import { winstonLogger } from '@remus1504/micrograde-shared';
import { updateEnrolmentReview } from '../Services/enrolment.service';

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  'enrolmentServiceConsumer',
  'debug'
);

export const consumerReviewFanoutMessages = async (
  channel: Channel
): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'micrograde-review';
    const queueName = 'enrolment-review-queue';
    await channel.assertExchange(exchangeName, 'fanout');
    const microgradeQueue: Replies.AssertQueue = await channel.assertQueue(
      queueName,
      { durable: true, autoDelete: false }
    );
    await channel.bindQueue(microgradeQueue.queue, exchangeName, '');
    channel.consume(
      microgradeQueue.queue,
      async (msg: ConsumeMessage | null) => {
        await updateEnrolmentReview(JSON.parse(msg!.content.toString()));
        channel.ack(msg!);
      }
    );
  } catch (error) {
    log.log(
      'error',
      'EnrolmentService comsumer consumerReviewFanoutMessages() method:',
      error
    );
  }
};
