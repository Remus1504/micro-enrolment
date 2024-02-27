import Joi, { ObjectSchema } from "joi";

const enrolmentSchema: ObjectSchema = Joi.object().keys({
  offer: Joi.object({
    courseTitle: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    durationInDays: Joi.number().required(),
    oldDeliveryDate: Joi.string().required(),
    newDeliveryDate: Joi.string().optional(),
    accepted: Joi.boolean().required(),
    cancelled: Joi.boolean().required(),
  }).required(),
  courseId: Joi.string().required(),
  instructorId: Joi.string().required(),
  instructorUsername: Joi.string().required(),
  instructorEmail: Joi.string().required(),
  instructorImage: Joi.string().required(),
  courseCoverImage: Joi.string().required(),
  courseMainTitle: Joi.string().required(),
  courseBasicTitle: Joi.string().required(),
  courseBasicDescription: Joi.string().required(),
  studentId: Joi.string().required(),
  studentUsername: Joi.string().required(),
  studentEmail: Joi.string().required(),
  studentImage: Joi.string().required(),
  status: Joi.string().required(),
  orderId: Joi.string().required(),
  invoiceId: Joi.string().required(),
  quantity: Joi.number().required(),
  price: Joi.number().required(),
  serviceFee: Joi.number().optional(),
  requirements: Joi.string().optional().allow(null, ""),
  paymentIntent: Joi.string().required(),
  requestExtension: Joi.object({
    originalDate: Joi.string().required(),
    newDate: Joi.string().required(),
    days: Joi.number().required(),
    reason: Joi.string().required(),
  }).optional(),
  delivered: Joi.boolean().optional(),
  approvedAt: Joi.string().optional(),
  deliveredWork: Joi.array()
    .items(
      Joi.object({
        message: Joi.string(),
        file: Joi.string(),
      })
    )
    .optional(),
  dateOrdered: Joi.string().optional(),
  events: Joi.object({
    placeOrder: Joi.string(),
    requirements: Joi.string(),
    orderStarted: Joi.string(),
    deliverydateUpdate: Joi.string().optional(),
    orderDelivered: Joi.string().optional(),
    studentReview: Joi.string().optional(),
    instructorReview: Joi.string().optional(),
  }).optional(),
  studentReview: Joi.object({
    rating: Joi.number(),
    review: Joi.string(),
  }).optional(),
  instructorReview: Joi.object({
    rating: Joi.number(),
    review: Joi.string(),
  }).optional(),
});

const enrolmentUpdateSchema: ObjectSchema = Joi.object().keys({
  originalDate: Joi.string().required(),
  newDate: Joi.string().required(),
  days: Joi.number().required(),
  reason: Joi.string().required(),
  deliveryDateUpdate: Joi.string().optional(),
});

export { enrolmentSchema, enrolmentUpdateSchema };
