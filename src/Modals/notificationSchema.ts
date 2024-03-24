import { IEnrolmentNotifcation } from '@remus1504/micrograde-shared';
import { model, Model, Schema } from 'mongoose';

const notificationSchema: Schema = new Schema({
  userTo: { type: String, default: '', index: true },
  senderUsername: { type: String, default: '' },
  senderPicture: { type: String, default: '' },
  receiverUsername: { type: String, default: '' },
  receiverPicture: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  message: { type: String, default: '' },
  enrolmentId: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const OrderNotificationModel: Model<IEnrolmentNotifcation> =
  model<IEnrolmentNotifcation>(
    'enrolmentNotification',
    notificationSchema,
    'enrolmentNotification'
  );
export { OrderNotificationModel };
