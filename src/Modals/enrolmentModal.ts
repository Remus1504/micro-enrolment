import { IEnrolmentDocument } from "@remus1504/micrograde";
import { model, Model, Schema } from "mongoose";

const enrolmentSchema: Schema = new Schema(
  {
    Enrolment: {
      courseTitle: { type: String, required: true },
      price: { type: Number, required: true },
      description: { type: String, required: true },
      durationInDays: { type: Number, required: true },
      oldDeliveryDate: { type: Date },
      newDeliveryDate: { type: Date },
      accepted: { type: Boolean, required: true },
      cancelled: { type: Boolean, required: true },
      reason: { type: String, default: "" },
    },
    courseId: { type: String, required: true },
    instructorId: { type: String, required: true, index: true },
    instructorUsername: { type: String, required: true },
    instructorImage: { type: String, required: true },
    instructorEmail: { type: String, required: true },
    courseCoverImage: { type: String, required: true },
    courseMainTitle: { type: String, required: true },
    courseBasicTitle: { type: String, required: true },
    courseBasicDescription: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    studentUsername: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentImage: { type: String, required: true },
    status: { type: String, required: true },
    orderId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    serviceFee: { type: Number, default: 0 },
    requirements: { type: String, default: "" },
    approvedEnrolment: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    cancelled: { type: Boolean, default: false },
    approvedAt: { type: Date },
    paymentIntent: { type: String },
    deliveredWork: [
      {
        message: { type: String },
        file: { type: String },
        fileType: { type: String },
        fileSize: { type: String },
        fileName: { type: String },
      },
    ],
    requestCourseExtension: {
      originalDate: { type: String, default: "" },
      newDate: { type: String, default: "" },
      days: { type: Number, default: 0 },
      reason: { type: String, default: "" },
    },
    dateEnrolled: { type: Date, default: Date.now },
    events: {
      placeEnrolment: { type: Date },
      requirements: { type: Date },
      orderStarted: { type: Date },
      deliveryDateUpdate: { type: Date },
      orderDelivered: { type: Date },
      studentReview: { type: Date },
      instructorReview: { type: Date },
    },
    studentReview: {
      rating: { type: Number, default: 0 },
      review: { type: String, default: "" },
      created: { type: Date },
    },
    InstructorReview: {
      rating: { type: Number, default: 0 },
      review: { type: String, default: "" },
      created: { type: Date },
    },
  },
  {
    versionKey: false,
  }
);

const EnrolmentModel: Model<IEnrolmentDocument> = model<IEnrolmentDocument>(
  "Enrolment",
  enrolmentSchema,
  "Enrolment"
);
export { EnrolmentModel };
