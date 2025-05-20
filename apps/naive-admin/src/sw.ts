/// <reference lib="webworker" />
// 明确声明self是ServiceWorkerGlobalScope类型
declare const self: ServiceWorkerGlobalScope;

/**
 * Service Worker实现
 */
import { setCacheNameDetails, skipWaiting, clientsClaim } from 'workbox-core';
import { registerRoute, Route } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

/**
 * SW消息类型
 */
enum SWMessageType {
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
}

/**
 * SW消息接口
 */
interface SWMessage {
  type: SWMessageType;
  message: string;
} 

// 声明构建工具注入的资源清单
// @ts-ignore
declare global {
  const __WB_MANIFEST: Array<{url: string, revision: string | null}>;
}

// 预缓存配置接口
interface PrecacheConfig {
  enabled: boolean;
  useWebpackManifest?: boolean;
  entries?: Array<{url: string, revision: string | null}>;
  ignoreURLParametersMatching?: RegExp[];
  cleanupOutdatedCaches?: boolean;
}

// 预缓存
// TODO 编辑配置预缓存配置
const PRECACHE_CONFIG: PrecacheConfig = { enabled: false };

// 接收SW配置
interface SWConfig {
  cachePrefix: string;
  staticCacheMaxEntries: number;
  staticCacheMaxAgeDay: number;
  cdnDomains: string[];
}

// 初始化SW配置，使用默认值
const SW_CONFIG: SWConfig = (() => {
  // TODO 编辑配置
  let config = {
    cachePrefix: 'app',
    staticCacheMaxEntries: 10000,
    staticCacheMaxAgeDay: 7,
    cdnDomains: []
  };

  // 尝试从全局变量获取配置
  try {
    // @ts-ignore
    if (self.__SW_CONFIG) {
      // @ts-ignore
      config = { ...config, ...self.__SW_CONFIG };
    }
  } catch (error) {
    console.error('[SW] 获取配置失败', error);
  }

  return config;
})();

// 设置缓存名称
setCacheNameDetails({
  prefix: SW_CONFIG.cachePrefix,
  suffix: 'v1',
  precache: 'precache',
  runtime: 'runtime',
});

// 处理预缓存功能
(() => {
  // 如果预缓存未启用，直接返回
  if (!PRECACHE_CONFIG || !PRECACHE_CONFIG.enabled) {
    console.info('[SW] 预缓存功能未启用');
    return;
  }

  // 清理过期的缓存
  if (PRECACHE_CONFIG.cleanupOutdatedCaches) {
    cleanupOutdatedCaches();
  }

  // 获取预缓存资源列表
  let entriesToPrecache: Array<{url: string, revision: string | null}> = [];

  // 添加手动指定的预缓存资源
  if (PRECACHE_CONFIG.entries && PRECACHE_CONFIG.entries.length > 0) {
    entriesToPrecache = [...entriesToPrecache, ...PRECACHE_CONFIG.entries];
  }

  // 使用构建工具生成的清单
  if (PRECACHE_CONFIG.useWebpackManifest) {
    try {
      // @ts-ignore - self.__WB_MANIFEST由构建工具注入
      const webpackManifest = self.__WB_MANIFEST || [];
      if (webpackManifest.length > 0) {
        // @ts-ignore
        entriesToPrecache = [...entriesToPrecache, ...webpackManifest];
      }
    } catch (e) {
      console.error('[SW] 读取构建工具生成的资源清单失败', e);
    }
  }

  // 执行预缓存
  if (entriesToPrecache.length > 0) {
    console.info(`[SW] 预缓存 ${entriesToPrecache.length} 个资源`);
    
    // 使用workbox预缓存
    try {
      // @ts-ignore - 类型问题，但功能正常
      precacheAndRoute(entriesToPrecache);
    } catch (e) {
      console.error('[SW] 预缓存失败', e);
    }
  } else {
    console.info('[SW] 没有找到预缓存资源');
  }
})();

// 创建缓存过期策略
const expirationPlugin = new ExpirationPlugin({
  maxEntries: SW_CONFIG.staticCacheMaxEntries,
  maxAgeSeconds: SW_CONFIG.staticCacheMaxAgeDay * 24 * 60 * 60, // 天数转秒数
  purgeOnQuotaError: true,
});

// 设置本地静态资源缓存策略 (JS, CSS, 图片等)
registerRoute(
  ({ request }) => {
    return (
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font'
    );
  },
  new CacheFirst({
    cacheName: `${SW_CONFIG.cachePrefix}-static-v1`,
    plugins: [expirationPlugin],
  })
);

// 设置CDN资源缓存策略
if (SW_CONFIG.cdnDomains.length > 0) {
  const cdnRoute = new Route(
    ({ url }) => {
      return SW_CONFIG.cdnDomains.some(domain => url.hostname.includes(domain));
    },
    new CacheFirst({
      cacheName: `${SW_CONFIG.cachePrefix}-cdn-v1`,
      plugins: [expirationPlugin],
    })
  );
  registerRoute(cdnRoute);
}

// 跳过等待，立即激活
skipWaiting();

// 立即接管所有客户端
clientsClaim();

// 监听激活事件
self.addEventListener('activate', () => {
  console.info('[SW] 新版本已激活');
  
  // 向所有客户端发送更新通知
  self.clients.matchAll().then((clients: readonly Client[]) => {
    clients.forEach((client: Client) => {
      const message: SWMessage = {
        type: SWMessageType.UPDATE_AVAILABLE,
        message: '新版本已可用',
      };
      client.postMessage(message);
    });
  });
});

// 设置全局变量，使得此文件可以被独立使用
// @ts-ignore
self.__WB_MANIFEST = self.__WB_MANIFEST || [];

// 导出版本号，方便调试
// export const VERSION = '0.1.0'; 