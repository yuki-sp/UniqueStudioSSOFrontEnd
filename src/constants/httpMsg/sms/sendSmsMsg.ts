import { HttpRes } from '../_httpResTemplate';

export interface SmsRequest {
  aid: string;
  content: string;
}

export type SmsResponse = HttpRes<object>;
