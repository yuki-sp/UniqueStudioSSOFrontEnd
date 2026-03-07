<template>
  <a-result
    status="403"
    :subtitle="$t('noPermission.subtitle')"
    class="h-screen flex flex-col justify-center pb-40"
  >
    <template #icon>
      <NoPermissionSVG class="max-w-[min(404px,90%)]" />
    </template>
    <template #extra>
      <a-space>
        <a-button type="primary" @click="handleRelogin"> 重新登录 </a-button>
      </a-space>
    </template>
  </a-result>
</template>

<script setup lang="ts">
import NoPermissionSVG from '@/assets/svg/no-permission.svg';
import { SSO_DOMAIN, HR_DOMAIN_FE, HR_BASE_URL } from '@/constants';

function handleRelogin() {
  window.location.href = `//${SSO_DOMAIN}/login?from=${HR_DOMAIN_FE}`;
}
</script>

<style scoped lang="less">
:deep(.arco-result-icon-tip) {
  width: auto;
  height: auto;
}
</style>
