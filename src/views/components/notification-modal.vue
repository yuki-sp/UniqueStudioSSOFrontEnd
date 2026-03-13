<template>
  <a-modal
    v-model:visible="showNotify"
    :title="$t('common.operation.notify')"
    :on-before-ok="handleNotify"
    :on-before-close="
      notifyFormRef?.resetFields(['time', 'place', 'rest', 'meeting_id'])
    "
    :width="width < 666 ? '90%' : '600px'"
  >
    <a-form
      ref="notifyFormRef"
      :model="formData"
      layout="vertical"
      :rules="preview.rules"
    >
      <a-form-item class="max-sm:mb-3">
        <template #label>
          <span class="flex items-center gap-1">
            发送选项
            <a-tooltip
              content="使用模板：按上方步骤自动填充信息；自定义短信：保留占位符或基于当前模板生成的内容并支持自由修改"
            >
              <icon-info-circle
                class="text-[rgb(var(--primary-6))] cursor-pointer"
              />
            </a-tooltip>
          </span>
        </template>
        <a-switch
          v-model="isCustom"
          :checked-text="'自定义短信'"
          :unchecked-text="'使用模板'"
        />
      </a-form-item>

      <a-form-item class="max-sm:mb-3">
        <template #label>
          <span>{{ $t('candidate.receiver') }}</span>
          <span
            v-show="props.type === 'Reject'"
            class="text-[rgb(var(--danger-6))]"
            >{{ `(${$t('common.status.rejected')})` }}</span
          >
        </template>
        <a-input-tag
          :model-value="candidates.map(({ name }) => name)"
          readonly
        />
      </a-form-item>

      <template v-if="!isCustom">
        <div class="flex sm:gap-2 justify-between w-full max-sm:flex-col">
          <a-form-item
            class="max-sm:mb-3"
            field="next"
            :label="$t('common.user.nextStage')"
            asterisk-position="end"
            validate-trigger="change"
          >
            <a-select v-model:model-value="formData.next">
              <a-option
                v-for="item in nextValidSteps"
                :key="item"
                :value="item"
                :title="$t(`common.steps.${item}`)"
                >{{ $t(`common.steps.${item}`) }}</a-option
              >
            </a-select>
          </a-form-item>

          <a-form-item
            class="max-sm:mb-3"
            field="time"
            :disabled="!preview.notDisable.includes('time')"
            :label="$t('common.time')"
            asterisk-position="end"
            validate-trigger="change"
          >
            <a-date-picker
              v-model="formData.time"
              show-time
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:00"
            />
          </a-form-item>

          <a-form-item
            class="max-sm:mb-3"
            field="meeting_id"
            :disabled="!preview.notDisable.includes('meeting_id')"
            :label="$t('common.sms.meetingId')"
            asterisk-position="end"
            validate-trigger="change"
          >
            <a-input v-model="formData.meeting_id" />
          </a-form-item>
        </div>
        <div class="flex gap-2 justify-between w-full flex-col sm:flex-row">
          <a-form-item
            class="max-sm:mb-3"
            field="place"
            :disabled="!preview.notDisable.includes('place')"
            :label="$t('common.sms.place')"
            asterisk-position="end"
            validate-trigger="change"
          >
            <a-input v-model="formData.place" />
          </a-form-item>
          <a-form-item
            class="max-sm:mb-3"
            field="rest"
            :disabled="!preview.notDisable.includes('rest')"
            :label="$t('common.sms.rest')"
            asterisk-position="end"
            validate-trigger="change"
          >
            <a-input v-model="formData.rest" />
          </a-form-item>
        </div>
      </template>
      <a-form-item
        class="max-sm:mb-3"
        :label="isCustom ? '自定义短信内容' : $t('common.sms.example')"
      >
        <a-scrollbar
          class="flex flex-col w-full max-h-48 overflow-y-auto"
          outer-class="w-full"
        >
          <div
            v-for="candidate in props.candidates"
            :key="candidate.aid"
            class="rounded-md border-2 px-4 py-3 pb-2 break-all mb-2 flex flex-col"
          >
            <div class="mb-2 font-bold text-gray-700 dark:text-gray-300">
              {{ candidate.name }}
            </div>
            <a-textarea
              v-if="isCustom"
              v-model="customContents[candidate.aid]"
              :auto-size="{ minRows: 2, maxRows: 6 }"
            />
            <div v-else class="text-sm">
              {{ generateSMSContent(candidate) }}
            </div>
          </div>
        </a-scrollbar>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, PropType, watch, computed } from 'vue';
import { Group, recruitSteps, Step, SMSTemplate } from '@/constants/team';
import { sendSms } from '@/api';
import { groupBy } from 'lodash';
import { Message } from '@arco-design/web-vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { getRecruitmentName } from '@/utils';
import useWindowResize from '@/hooks/resize';
import useRecruitmentStore from '@/store/modules/recruitment';

const { t } = useI18n();
const { width } = useWindowResize();

const props = defineProps({
  candidates: {
    type: Array as PropType<
      {
        name: string;
        aid: string;
        step: Step;
        groupInterviewTime: string;
        teamInterviewTime: string;
      }[]
    >,
    required: true,
  },
  curStep: {
    type: Number,
    required: true,
  },
  type: {
    type: String as PropType<'Accept' | 'Reject'>,
    required: true,
  },
  group: {
    type: String as PropType<Group>,
    required: true,
  },
});

const recStore = useRecruitmentStore();

const recName = computed(() => recStore.currentRec?.name ?? '');

const recNameI18nKey = computed(() => getRecruitmentName(t, recName.value));

const isCustom = ref(false);
const customContents = ref<Record<string, string>>({});

const showNotify = defineModel<boolean>('showNotify', {
  type: Boolean,
  default: false,
  required: true,
});

const nextValidSteps = computed(() => {
  const arr: Step[] = [];
  recruitSteps
    .slice(props.curStep + 1)
    .forEach(({ value }) => arr.push(...value));
  return arr;
});
const formData = ref({
  next: nextValidSteps.value[0], // 下一步流程
  time: '', // 笔试/面试/熬测时间
  place: '', // 地点
  meeting_id: '', // 在线面试的会议id
  rest: '', // 补充信息
});
watch(nextValidSteps, () => {
  [formData.value.next] = nextValidSteps.value;
});

const preview = computed(() => {
  if (props.type === 'Reject')
    return {
      ...SMSTemplate[0],
      rules: {},
      notDisable: SMSTemplate[0].required.concat(['rest']),
    };
  const template = SMSTemplate.find(({ match }) =>
    match.includes(formData.value.next || Step.Pass),
  );
  return {
    ...template,
    rules: template
      ? Object.fromEntries(
          template.required.map((key) => [
            key,
            [{ required: !formData.value.rest || !template.restI18nKey }],
          ]),
        )
      : {},
    notDisable:
      template?.required.concat(template.restI18nKey ? ['rest'] : []) ?? [],
  };
});

const generateSMSContent = (candidate: any) => {
  let example_time = `{${t('common.status.waitForDistribution')}}`;
  if (
    recruitSteps[3].value.includes(formData.value.next) &&
    candidate.groupInterviewTime
  ) {
    example_time = dayjs(candidate.groupInterviewTime).format(
      'YYYY-MM-DD HH:mm:00',
    );
  } else if (
    recruitSteps[6].value.includes(formData.value.next) &&
    candidate.teamInterviewTime
  ) {
    example_time = dayjs(candidate.teamInterviewTime).format(
      'YYYY-MM-DD HH:mm:00',
    );
  }

  let restMsg = formData.value.rest;
  if (!restMsg && props.type === 'Accept' && preview.value.restI18nKey) {
    restMsg = t(preview.value.restI18nKey, {
      next: formData.value.next ? t(`common.steps.${formData.value.next}`) : '',
      time: formData.value.time || '{ }',
      place: formData.value.place || '{ }',
      group: props.group,
    });
  }

  return t(preview.value.i18nKey || '', {
    name: candidate.name || '{ }',
    recruitment_name: t(recNameI18nKey.value, {
      defaultValue: recNameI18nKey.value,
    }),
    group: props.group,
    current:
      props.curStep < recruitSteps.length
        ? t(recruitSteps[props.curStep].i18Key)
        : '',
    next: formData.value.next ? t(`common.steps.${formData.value.next}`) : '',
    meeting_id: formData.value.meeting_id || '{ }',
    time: formData.value.time || '{ }',
    place: formData.value.place || '{ }',
    rest: restMsg || '',
    example_time,
    online_interview_type: formData.value.next
      ? t(`common.steps.${formData.value.next}`)
      : '',
  });
};

const notifyFormRef = ref<any>(null);

watch(
  () => formData.value.next,
  () => {
    notifyFormRef.value?.clearValidate();
  },
);

watch(isCustom, (val) => {
  if (val) {
    props.candidates.forEach((candidate) => {
      customContents.value[candidate.aid] = generateSMSContent(candidate);
    });
  }
});

const handleNotify = async () => {
  if (!isCustom.value) {
    const validateError = await notifyFormRef.value?.validate();
    if (validateError) return false;
    if (
      recruitSteps[3].value.includes(formData.value.next) &&
      !props.candidates.every(({ groupInterviewTime }) => groupInterviewTime)
    ) {
      Message.error(t('candidate.requireAllocateTime'));
      return false;
    }
    if (
      recruitSteps[6].value.includes(formData.value.next) &&
      !props.candidates.every(({ teamInterviewTime }) => teamInterviewTime)
    ) {
      Message.error(t('candidate.requireAllocateTime'));
      return false;
    }

    const res = groupBy(props.candidates, ({ step }) => step);
    const reqs = Object.entries(res).map(([current, arr]) => {
      const aids = arr.map(({ aid }) => aid);
      return sendSms({
        type: props.type,
        current: current as Step,
        ...formData.value,
        aids,
      });
    });
    const resp = await Promise.all(reqs);
    if (!resp.every((x) => x)) return false;
  } else {
    const reqs = props.candidates.map((candidate) => {
      return sendSms({
        aid: candidate.aid,
        content: customContents.value[candidate.aid],
      });
    });
    const resp = await Promise.all(reqs);
    if (!resp.every((x) => x)) return false;
  }

  Message.success(t('common.result.sendSuccess'));
  notifyFormRef.value?.resetFields();
  [formData.value.next] = nextValidSteps.value;
  isCustom.value = false;
  return true;
};
</script>

<style scoped lang="less"></style>
