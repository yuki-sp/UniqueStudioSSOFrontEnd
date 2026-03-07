import { TimeString } from '@/constants/team';
import { HttpRes } from '../_httpResTemplate';
import { CreateRecruitmentRequest } from './createRecruitmentMsg';

export type UpdateRecruitmentRequest = Partial<CreateRecruitmentRequest>;

export type UpdateRecruitmentResponse = HttpRes<object>;

export type SetStressTestTimeRequest = {
  stress_test_start: TimeString;
  stress_test_end: TimeString;
};

export type SetStressTestTimeResponse = HttpRes<object>;

export type UploadTestRequest = File;

export type UploadTestResponse = HttpRes<object>;

export type UploadTestUrlResponse = HttpRes<object>;

export type SetWrittenTestTypeResponse = HttpRes<object>;

export type GetWrittenTestTypeResponse = HttpRes<{
  group_written_test_type: number;
}>;
