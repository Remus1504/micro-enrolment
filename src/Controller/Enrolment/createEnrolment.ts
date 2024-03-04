import Stripe from "stripe";
import { Request, Response } from "express";
import { config } from "../../configuration";
import { StatusCodes } from "http-status-codes";
import { enrolmentSchema } from "../../Schema/enrolment";
import {
  BadRequestError,
  IEnrolmentDocument,
} from "@remus1504/micrograde-shared";
import { createEnrolment } from "../../Services/enrolment.service";

const stripe: Stripe = new Stripe(config.STRIPE_API_KEY!, {
  typescript: true,
});

const intent = async (req: Request, res: Response): Promise<void> => {
  const customer: Stripe.Response<Stripe.ApiSearchResult<Stripe.Customer>> =
    await stripe.customers.search({
      query: `email:"${req.currentUser!.email}"`,
    });
  let customerId = "";
  if (customer.data.length === 0) {
    const createdCustomer: Stripe.Response<Stripe.Customer> =
      await stripe.customers.create({
        email: `${req.currentUser!.email}`,
        metadata: {
          studentId: `${req.body.studentId}`,
        },
      });
    customerId = createdCustomer.id;
  } else {
    customerId = customer.data[0].id;
  }

  let paymentIntent: Stripe.Response<Stripe.PaymentIntent>;
  if (customerId) {
    // the service charge is 5.5% of the purchase amount
    // for purchases under $50, an additional $2 is applied
    const serviceFee: number =
      req.body.price < 50
        ? (5.5 / 100) * req.body.price + 2
        : (5.5 / 100) * req.body.price;
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.floor((req.body.price + serviceFee) * 100),
      currency: "usd",
      customer: customerId,
      automatic_payment_methods: { enabled: true },
    });
  }
  res.status(StatusCodes.CREATED).json({
    message: "enrolment intent created successfully.",
    clientSecret: paymentIntent!.client_secret,
    paymentIntentId: paymentIntent!.id,
  });
};

const order = async (req: Request, res: Response): Promise<void> => {
  const { error } = await Promise.resolve(enrolmentSchema.validate(req.body));
  if (error?.details) {
    throw new BadRequestError(
      error.details[0].message,
      "Create order() method"
    );
  }
  const serviceFee: number =
    req.body.price < 50
      ? (5.5 / 100) * req.body.price + 2
      : (5.5 / 100) * req.body.price;
  let orderData: IEnrolmentDocument = req.body;
  orderData = { ...orderData, serviceFee };
  const offer: IEnrolmentDocument = await createEnrolment(orderData);
  res
    .status(StatusCodes.CREATED)
    .json({ message: "enrolment created successfully.", offer });
};

export { intent, order };
