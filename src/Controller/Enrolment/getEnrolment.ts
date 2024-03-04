import { IEnrolmentDocument } from "@remus1504/micrograde-shared";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import {
  getEnrolmentsByStudentId,
  getEnrolmentsByInstructorId,
  getEnrolmentByEnrolmentId,
} from "../../Services/enrolment.service";

const enrolmentId = async (req: Request, res: Response): Promise<void> => {
  const order: IEnrolmentDocument = await getEnrolmentByEnrolmentId(
    req.params.enrolmentId
  );
  res.status(StatusCodes.OK).json({ message: "Order by order id", order });
};

const instructorOrders = async (req: Request, res: Response): Promise<void> => {
  const enrolmentOrders: IEnrolmentDocument[] =
    await getEnrolmentsByInstructorId(req.params.instructorId);
  res
    .status(StatusCodes.OK)
    .json({ message: "Instructor orders", enrolmentOrders });
};

const studentOrders = async (req: Request, res: Response): Promise<void> => {
  const orders: IEnrolmentDocument[] = await getEnrolmentsByStudentId(
    req.params.studentId
  );
  res.status(StatusCodes.OK).json({ message: "Student Enrolments", orders });
};

export { enrolmentId, instructorOrders, studentOrders };
