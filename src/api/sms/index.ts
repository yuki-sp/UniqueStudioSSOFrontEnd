import { SmsRequest, SmsResponse } from '@/constants/httpMsg/sms/sendSmsMsg';
import request from '../_request';

export default async function sendSms(data: SmsRequest): Promise<SmsResponse> {
  const url = 'aids' in data ? '/sms/' : '/sms/raw';
  const res: SmsResponse = await request({
    url,
    method: 'POST',
    data,
  });
  return res;
}
