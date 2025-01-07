/// <reference types="@rsbuild/core/types" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  // biome-ignore lint/complexity/noBannedTypes: reason
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface IObj {
  [key: string | number | Symbol]: any;
}

declare namespace Http {
  interface ResResult<T = IObj> {
    success: boolean;
    model?: T;
    error?: string;
    totalCount?: number
  }
}