import { Period, TimeString } from '@/constants/team';
import { HttpRes } from '../_httpResTemplate';

export type CreateInterviewRequest = {
  date: TimeString;
  period: Period;
  start: TimeString;
  end: TimeString;
  slot_number: number;
}[];

export type CreateInterviewResponse = HttpRes<object>;
