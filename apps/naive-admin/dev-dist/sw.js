/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-80c5aca5'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg)$/, new workbox.CacheFirst({
    "cacheName": "assets-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30
    })]
  }), 'GET');
  workbox.registerRoute(/.*\.js$/, new workbox.CacheFirst({
    "cacheName": "project-js-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [200]
    })]
  }), 'GET');
  workbox.registerRoute(/.*\.css.*/, new workbox.CacheFirst({
    "cacheName": "project-css-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 604800
    }), new workbox.CacheableResponsePlugin({
      statuses: [200]
    })]
  }), 'GET');
  workbox.registerRoute(({
    request
  }) => {
    var _request$headers$get;
    return request.mode === "navigate" || request.destination === "document" || request.url.includes(location.origin) && !request.url.includes("/api/") && !request.url.includes(".json") && ((_request$headers$get = request.headers.get("accept")) == null ? void 0 : _request$headers$get.includes("text/html"));
  }, new workbox.NetworkFirst({
    "cacheName": "project-html-cache",
    plugins: [new workbox.CacheableResponsePlugin({
      statuses: [200],
      headers: {
        'Content-Type': 'text/html; charset=UTF-8'
      }
    })]
  }), 'GET');

}));
