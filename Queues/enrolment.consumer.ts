import { Channel, ConsumeMessage, Replies } from "amqplib";
import { Logger } from "winston";
import { createConnection } from "../Queues/connection";
import { config } from "../src/configuration";
import { winstonLogger } from "@remus1504/micrograde";
import { updateOrderReview } from "../src/Services/enrolment.service";

const log: Logger = winstonLogger(
  `${config.ELASTIC_SEARCH_ENDPOINT}`,
  "orderServiceConsumer",
  "debug"
);

export const consumerReviewFanoutMessages = async (
  channel: Channel
): Promise<void> => {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = "micrograde-review";
    const queueName = "order-review-queue";
    await channel.assertExchange(exchangeName, "fanout");
    const jobberQueue: Replies.AssertQueue = await channel.assertQueue(
      queueName,
      { durable: true, autoDelete: false }
    );
    await channel.bindQueue(jobberQueue.queue, exchangeName, "");
    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      await updateOrderReview(JSON.parse(msg!.content.toString()));
      channel.ack(msg!);
    });
  } catch (error) {
    log.log(
      "error",
      "EnrolmentService comsumer consumerReviewFanoutMessages() method:",
      error
    );
  }
};
