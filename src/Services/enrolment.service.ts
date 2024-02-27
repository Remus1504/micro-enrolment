import { config } from "../configuration";
import { EnrolmentModel } from "../Modals/enrolmentModal";
import { publishDirectMessage } from "../../Queues/enrolment.producer";
import { enrolmentChannel } from "../server";
import {
  IDeliveredWork,
  IExtendedEnrolment,
  IEnrolmentDocument,
  IEnrolmentMessage,
  IReviewMessageDetails,
  lowerCase,
} from "@remus1504/micrograde";
import { sendNotification } from "../Services/notification.service";

export const getEnrolmentByEnrolmentId = async (
  orderId: string
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { orderId } },
  ])) as IEnrolmentDocument[];
  return order[0];
};

export const getOrdersByInstructorId = async (
  instructorId: string
): Promise<IEnrolmentDocument[]> => {
  const orders: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { instructorId } },
  ])) as IEnrolmentDocument[];
  return orders;
};

export const getOrdersByStudentId = async (
  studentId: string
): Promise<IEnrolmentDocument[]> => {
  const orders: IEnrolmentDocument[] = (await EnrolmentModel.aggregate([
    { $match: { studentId } },
  ])) as IEnrolmentDocument[];
  return orders;
};

export const createEnrolmentOrder = async (
  data: IEnrolmentDocument
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = await EnrolmentModel.create(data);
  const messageDetails: IEnrolmentMessage = {
    instructorId: data.instructorId,
    onGoingTasks: 1,
    type: "create-enrolment-order",
  };
  // update seller info
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-instructor-update",
    "user-instructor",
    JSON.stringify(messageDetails),
    "Details sent to users service"
  );
  const emailMessageDetails: IEnrolmentMessage = {
    enrolmentOrderId: data.courseId,
    invoiceId: data.invoiceId,
    orderDue: `${data.offer.newDeliveryDate}`,
    amount: `${data.price}`,
    studentUsername: lowerCase(data.studentUsername),
    instructorUsername: lowerCase(data.instructorUsername),
    courseTitle: data.offer.courseTitle,
    description: data.offer.description,
    requirements: data.requirements,
    serviceFee: `${order.serviceFee}`,
    total: `${order.price + order.serviceFee!}`,
    enrolementUrl: `${config.CLIENT_URL}/orders/${data.courseId}/activities`,
    template: "orderPlaced",
  };
  // send email
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-order-notification",
    "order-email",
    JSON.stringify(emailMessageDetails),
    "Enrolment email sent to notification service."
  );
  sendNotification(
    order,
    data.instructorUsername,
    "placed an order for your course."
  );
  return order;
};

export const cancelOrder = async (
  orderId: string,
  data: IEnrolmentMessage
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { orderId },
    {
      $set: {
        cancelled: true,
        status: "Cancelled",
        approvedAt: new Date(),
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  // update seller info
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-instructor-update",
    "user-instructor",
    JSON.stringify({ type: "cancel-order", instructorId: data.instructorId }),
    "Cancelled enrolment order details sent to users service."
  );
  // update buyer info
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-student-update",
    "user-student",
    JSON.stringify({
      type: "cancel-order",
      studentId: data.studentId,
      enrolledCourses: data.enrolledCourses,
    }),
    "Cancelled enrolment order details sent to users service."
  );
  sendNotification(
    order,
    order.instructorUsername,
    "cancelled your enrolment."
  );
  return order;
};

export const approveEnrolment = async (
  enrolmentorderId: string,
  data: IEnrolmentMessage
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentorderId },
    {
      $set: {
        approved: true,
        status: "Completed",
        approvedAt: new Date(),
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  const messageDetails: IEnrolmentMessage = {
    instructorId: data.instructorId,
    studentId: data.studentId,
    onGoingTasks: data.onGoingTasks,
    completedTasks: data.completedTasks,
    totalPoints: data.totalPoints, // this is the price the seller earned for lastest order delivered
    recentDelivery: `${new Date()}`,
    type: "approve-order",
  };
  // update seller info
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-instrcutor-update",
    "user-instructor",
    JSON.stringify(messageDetails),
    "Approved order details sent to users service."
  );
  // update buyer info
  await publishDirectMessage(
    enrolmentChannel,
    "micrograde-student-update",
    "user-student",
    JSON.stringify({
      type: "purchased-courses",
      studentId: data.studentId,
      purchasedCourses: data.enrolledCourses,
    }),
    "Approved order details sent to users service."
  );
  sendNotification(
    order,
    order.instructorUsername,
    "approved your order delivery."
  );
  return order;
};

export const instrcutorAcceptEnrolmentOrder = async (
  enrolmentOrderId: string,
  delivered: boolean,
  deliveredWork: IDeliveredWork
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentOrderId },
    {
      $set: {
        delivered,
        status: "Enroled",
        ["events.orderDelivered"]: new Date(),
      },
      $push: {
        deliveredWork,
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (order) {
    const messageDetails: IEnrolmentMessage = {
      enrolmentOrderId,
      studentUsername: lowerCase(order.studentUsername),
      instructorUsername: lowerCase(order.instructorUsername),
      courseTitle: order.offer.courseTitle,
      description: order.offer.description,
      enrolementUrl: `${config.CLIENT_URL}/orders/${enrolmentOrderId}/activities`,
      template: "orderDelivered",
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      "micrograde-order-notification",
      "order-email",
      JSON.stringify(messageDetails),
      "Enrolment delivered message sent to notification service."
    );
    sendNotification(order, order.studentUsername, "delivered your order.");
  }
  return order;
};

export const requestDeliveryExtension = async (
  orderId: string,
  data: IExtendedEnrolment
): Promise<IEnrolmentDocument> => {
  const { newDate, days, reason, originalDate } = data;
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { orderId },
    {
      $set: {
        ["requestExtension.originalDate"]: originalDate,
        ["requestExtension.newDate"]: newDate,
        ["requestExtension.days"]: days,
        ["requestExtension.reason"]: reason,
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (order) {
    const messageDetails: IEnrolmentMessage = {
      studentUsername: lowerCase(order.studentUsername),
      instructorUsername: lowerCase(order.instructorUsername),
      originalDate: order.offer.oldDeliveryDate,
      newDate: order.offer.newDeliveryDate,
      reason: order.offer.reason,
      enrolementUrl: `${config.CLIENT_URL}/orders/${orderId}/activities`,
      template: "orderExtension",
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      "micrograde-order-notification",
      "order-email",
      JSON.stringify(messageDetails),
      "Enrolment delivered message sent to notification service."
    );
    sendNotification(
      order,
      order.studentUsername,
      "requested for an order delivery date extension."
    );
  }
  return order;
};

export const approveDeliveryDate = async (
  enrolmentOrderId: string,
  data: IExtendedEnrolment
): Promise<IEnrolmentDocument> => {
  const { newDate, days, reason, deliveryDateUpdate } = data;
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentOrderId },
    {
      $set: {
        ["offer.deliveryInDays"]: days,
        ["offer.newDeliveryDate"]: newDate,
        ["offer.reason"]: reason,
        ["events.deliveryDateUpdate"]: new Date(`${deliveryDateUpdate}`),
        requestExtension: {
          originalDate: "",
          newDate: "",
          days: 0,
          reason: "",
        },
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (order) {
    const messageDetails: IEnrolmentMessage = {
      subject: "Congratulations: Your extension request was approved",
      studentUsername: lowerCase(order.studentUsername),
      instructorUsername: lowerCase(order.instructorUsername),
      header: "Request Accepted",
      type: "accepted",
      message: "You can continue working on the order.",
      enrolementUrl: `${config.CLIENT_URL}/orders/${enrolmentOrderId}/activities`,
      template: "orderExtensionApproval",
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      "micrograde-order-notification",
      "order-email",
      JSON.stringify(messageDetails),
      "Enrolment request extension approval message sent to notification service."
    );
    sendNotification(
      order,
      order.instructorUsername,
      "approved your order delivery date extension request."
    );
  }
  return order;
};

export const rejectEnrolementStartDate = async (
  enrolmentOrderId: string
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { enrolmentOrderId },
    {
      $set: {
        requestExtension: {
          originalDate: "",
          newDate: "",
          days: 0,
          reason: "",
        },
      },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  if (order) {
    const messageDetails: IEnrolmentMessage = {
      subject: "Sorry: Your extension request was rejected",
      studentUsername: lowerCase(order.studentUsername),
      instructorUsername: lowerCase(order.instructorUsername),
      header: "Request Rejected",
      type: "rejected",
      message: "You can contact the student for more information.",
      enrolementUrl: `${config.CLIENT_URL}/orders/${enrolmentOrderId}/activities`,
      template: "enrolmentExtensionApproval",
    };
    // send email
    await publishDirectMessage(
      enrolmentChannel,
      "micrograde-order-notification",
      "order-email",
      JSON.stringify(messageDetails),
      "Enrolment request extension rejection message sent to notification service."
    );
    sendNotification(
      order,
      order.instructorUsername,
      "rejected your enrolment date extension request."
    );
  }
  return order;
};

export const updateOrderReview = async (
  data: IReviewMessageDetails
): Promise<IEnrolmentDocument> => {
  const order: IEnrolmentDocument = (await EnrolmentModel.findOneAndUpdate(
    { orderId: data.courseId },
    {
      $set:
        data.type === "student-review"
          ? {
              buyerReview: {
                rating: data.rating,
                review: data.review,
                created: new Date(`${data.createdAt}`),
              },
              ["events.studentReview"]: new Date(`${data.createdAt}`),
            }
          : {
              sellerReview: {
                rating: data.rating,
                review: data.review,
                created: new Date(`${data.createdAt}`),
              },
              ["events.instructorReview"]: new Date(`${data.createdAt}`),
            },
    },
    { new: true }
  ).exec()) as IEnrolmentDocument;
  sendNotification(
    order,
    data.type === "student-review"
      ? order.instructorUsername
      : order.studentUsername,
    `left you a ${data.rating} star review`
  );
  return order;
};
