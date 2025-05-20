// 补充ServiceWorker环境类型声明
declare interface ServiceWorkerGlobalScope {
  __SW_CONFIG?: {
    cachePrefix?: string;
    staticCacheMaxEntries?: number;
    staticCacheMaxAgeDay?: number;
    cdnDomains?: string[];
  };
  __WB_MANIFEST: Array<{ url: string }>;
}
