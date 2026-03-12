<template>
  <a-modal v-model:visible="visible" title-align="start" @ok="handleCreate">
    <template #title>
      <span class="font-semibold">{{
        $t('common.operation.arrangeSchedule')
      }}</span>
    </template>

    <div>
      <div class="font-semibold mb-2">{{
        $t('common.applyInfo.interviewName')
      }}</div>
      <div class="flex justify-between mb-6">
        <a-select
          v-model:model-value="currentGroup"
          :placeholder="$t('common.user.group')"
          class="w-5/12"
        >
          <a-option
            v-for="group in groupOptions"
            :key="group.label"
            :value="group.value"
          >
            {{ group.label }}
          </a-option>
        </a-select>
      </div>

      <div class="flex gap-4 mb-6">
        <div class="flex-1">
          <div class="font-semibold mb-2">
            {{ $t('common.interview.duration') }}
          </div>
          <a-input-number v-model="duration" :min="1" />
        </div>
        <div class="flex-1">
          <div class="font-semibold mb-2">
            {{ $t('common.interview.rest') }}
          </div>
          <a-input-number v-model="rest" :min="0" />
        </div>
      </div>

      <div class="flex gap-4">
        <div class="w-3/12">
          <div class="font-semibold mb-2">
            {{ $t('common.date') }}<span class="text-blue-600">*</span>
          </div>
          <a-date-picker v-model="interviewDate" class="w-full" />
        </div>

        <div class="flex-1">
          <div class="font-semibold mb-2">
            {{ $t('common.timeAndSlotNumber')
            }}<span class="text-blue-600">*</span>
          </div>
          <div
            v-for="(_, index) in interviewTimes"
            :key="index"
            class="flex items-center mb-2 gap-2"
          >
            <a-time-picker
              v-model="interviewTimes[index]"
              type="time-range"
              format="HH:mm"
              class="flex-1"
            />
            <a-input-number
              v-model="slotNumbers[index]"
              :min="1"
              :placeholder="$t('common.interview.slotNumber')"
              class="w-12 mx-2"
            />
            <a-button
              type="text"
              status="danger"
              @click="removeTimeRange(index)"
            >
              <template #icon><icon-delete /></template>
            </a-button>
            <a-button
              v-if="index === interviewTimes.length - 1"
              type="text"
              @click="addTimeRange"
            >
              <template #icon><icon-plus /></template>
            </a-button>
            <!-- 占位，保证对齐 -->
            <div v-else class="w-8"></div>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, PropType } from 'vue';
import { Group, Period, PeriodDefineHour } from '@/constants/team';
import useRecruitmentStore from '@/store/modules/recruitment';
import { Message } from '@arco-design/web-vue';
import { useI18n } from 'vue-i18n';
import { IconPlus, IconDelete } from '@arco-design/web-vue/es/icon';

const { t } = useI18n();

const visible = defineModel<boolean>('visible', {
  type: Boolean,
  default: false,
  required: true,
});
const props = defineProps({
  currentGroupStart: {
    type: String as PropType<Group>,
    default: Group.Web,
    required: true,
  },
});

const currentGroup = ref<Group>(props.currentGroupStart);
const interviewDate = ref<string>('');
const interviewTimes = ref<string[][]>([[]]);
const slotNumbers = ref<number[]>([1]);
const duration = ref(30);
const rest = ref(10);
const recStore = useRecruitmentStore();

const addTimeRange = () => {
  const lastRange = interviewTimes.value[interviewTimes.value.length - 1];
  if (lastRange && lastRange[1]) {
    const [h, m, s] = lastRange[1].split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0);

    const nextStart = new Date(date.getTime() + rest.value * 60000);
    const nextEnd = new Date(nextStart.getTime() + duration.value * 60000);

    const format = (d: Date) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes(),
      ).padStart(2, '0')}`;

    interviewTimes.value.push([format(nextStart), format(nextEnd)]);
  } else {
    interviewTimes.value.push([]);
  }
  const lastSlotNumber = slotNumbers.value[slotNumbers.value.length - 1] || 1;
  slotNumbers.value.push(lastSlotNumber);
};

const removeTimeRange = (index: number) => {
  if (interviewTimes.value.length > 1) {
    interviewTimes.value.splice(index, 1);
    slotNumbers.value.splice(index, 1);
  } else {
    interviewTimes.value = [[]];
    slotNumbers.value = [1];
  }
};

const groupOptions = Object.entries(Group).map(([label, value]) => ({
  label,
  value,
}));

const calcPeriod = (time: Date): Period => {
  const hour = time.getHours();
  if (hour >= PeriodDefineHour.morning[0] && hour < PeriodDefineHour.morning[1])
    return Period.Morning;
  if (
    hour >= PeriodDefineHour.afternoon[0] &&
    hour < PeriodDefineHour.afternoon[1]
  )
    return Period.Afternoon;
  return Period.Evening;
};

const handleCreate = async () => {
  if (
    !interviewDate.value ||
    interviewTimes.value.some((time) => time.length < 2)
  ) {
    Message.warning(t('common.interview.error.incompleteInfo'));
    return;
  }

  const interviews = interviewTimes.value.map(([startTime, endTime], index) => {
    const startDate = new Date(`${interviewDate.value}T${startTime}`);
    const start = startDate.toISOString();
    const end = new Date(`${interviewDate.value}T${endTime}`).toISOString();
    return {
      date: new Date(interviewDate.value).toISOString(),
      period: calcPeriod(startDate),
      start,
      end,
      slot_number: slotNumbers.value[index],
    };
  });

  visible.value = false;
  const res = await recStore.createInterview(currentGroup.value, interviews);
  if (res) {
    recStore.refresh();
    Message.success(t('common.result.addInterviewSuccess'));
  }
};
</script>
