import { onMounted } from 'vue'
import { useGlobalStore } from '@/store/modules/global'
import { storeToRefs } from 'pinia'

export function usePageLoading(from?: string) {
  const globalStore = useGlobalStore();
  const { refreshStatus: pageRefreshStatus } = storeToRefs(globalStore)

  onMounted(() => {
    setTimeout(() => {
      globalStore.setRefreshStatus(false, { from });
    }, 0);
  });

  return {
    pageRefreshStatus,
    refresh: globalStore.refresh,
    setRefreshStatus: globalStore.setRefreshStatus
  }
}
