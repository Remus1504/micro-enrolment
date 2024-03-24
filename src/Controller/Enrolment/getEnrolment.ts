import { IEnrolmentDocument } from '@remus1504/micrograde-shared';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import {
  getEnrolmentsByStudentId,
  getEnrolmentsByInstructorId,
  getEnrolmentByEnrolmentId,
} from '../../Services/enrolment.service';

const enrolmentId = async (req: Request, res: Response): Promise<void> => {
  const enrolment: IEnrolmentDocument = await getEnrolmentByEnrolmentId(
    req.params.enrolmentId
  );
  res
    .status(StatusCodes.OK)
    .json({ message: 'Enrolment by Enrolment id', enrolment });
};

const instructorOrders = async (req: Request, res: Response): Promise<void> => {
  const enrolment: IEnrolmentDocument[] = await getEnrolmentsByInstructorId(
    req.params.instructorId
  );
  res
    .status(StatusCodes.OK)
    .json({ message: 'Instructor Enrolments', enrolment });
};

const studentOrders = async (req: Request, res: Response): Promise<void> => {
  const enrolments: IEnrolmentDocument[] = await getEnrolmentsByStudentId(
    req.params.studentId
  );
  res
    .status(StatusCodes.OK)
    .json({ message: 'Student Enrolments', enrolments });
};

export { enrolmentId, instructorOrders, studentOrders };
