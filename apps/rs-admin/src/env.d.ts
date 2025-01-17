/// <reference types="@rsbuild/core/types" />
import { MessageApiInjection } from "naive-ui/es/message/src/MessageProvider";

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: reason
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
