# 需求
我需要实现一个npm包，主要功能是基于 `service-worker` 和 `workbox` 实现以下功能：

## Service Worker注册流程
- 注册时机：仅在生产环境且浏览器支持 serviceWorker 时注册。
- 注册方式：使用 workbox-window 的 Workbox 类注册 /sw.js。
- 自动更新检测：注册成功后，定时（时间支持配置）调用 registration.update() 主动检查 Service Worker 是否有新版本。
## Service Worker核心功能
### 2.1 缓存命名与生命周期管理
- 缓存命名：通过 workbox.core.setCacheNameDetails 设置缓存前缀和后缀，便于区分和管理。 
- 自动激活新 SW：workbox.core.skipWaiting() 让新 SW 安装后立即进入激活状态；workbox.core.clientsClaim() 让新 SW 立即接管所有页面。
### 2.2 激活时通知客户端
- 激活事件：在 activate 事件中，向所有客户端（页面）发送 UPDATE_AVAILABLE 消息，通知前端有新版本可用。
```javascript
self.addEventListener('activate', event => {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'UPDATE_AVAILABLE',
                message: 'New version available',
            });
        });
    });
});
```
### 静态资源缓存策略
- 本地静态资源：对 .js、.css、图片等静态资源采用 CacheFirst 策略，优先从缓存读取，缓存最大 10000 条，最长 7 天。
- CDN 资源：对指定 CDN 域名（支持配置）的资源同样采用 CacheFirst 策略，配置一致。

## 关键点与优势
极致的前端热更新体验：用户无需手动刷新，能第一时间感知并切换到最新版本。
缓存与性能优化：合理缓存静态资源，提升访问速度，支持离线访问。
安全与可控：通过版本号比对和激活通知，避免因缓存导致的“假更新”或页面异常。


这样有点封装过度了，可以按如下要求继续改进下
1. 将 registerSW 方法作为一个独立的方法抛出，由用户自行引入main文件中注册
2. registerSW 和 vite的transformIndexHtml中的SW脚本注册似乎有点冲突了，请你确认下