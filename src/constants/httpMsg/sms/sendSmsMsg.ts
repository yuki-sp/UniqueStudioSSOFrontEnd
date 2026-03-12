import { Step } from '@/constants/team';
import { HttpRes } from '../_httpResTemplate';

export type SmsRequest =
  | {
      type?: 'Accept' | 'Reject';
      current?: Step;
      next?: Step;
      time?: string;
      place?: string;
      meeting_id?: string;
      rest?: string;
      aids: string[];
    }
  | {
      aid: string;
      content: string;
    };

export type SmsResponse = HttpRes<object>;
