import type { Component } from 'vue'
import * as Ionicons from '@vicons/ionicons5/index'
import type { RouteRecordRaw } from 'vue-router';

declare global {
  // 可选图标
  type IIcons =  keyof typeof Ionicons
  // route
  type CustomRouteRecord = RouteRecordRaw & {
    meta?: {
      title: string;
      icon?: IIcons | Component
    };
    children?: CustomRouteRecord[];
  }
  // tab
  interface ITabItem {
    path: string
    name: string
    // checked: boolean
  }
  // menu
  interface IMenuItem {
    path: string
    name: string
    parent: IMenuItem | null
    children?: IMenuItem[]
    icon: Component | keyof typeof Ionicons
  }
  // 全局通用类型
  interface IObj {
    [key: string | number | Symbol]: any;
  }
  
  // 请求返回类型
  interface ResResult<T = IObj> {
    success: boolean;
    model?: T;
    error?: string;
    totalCount?: number;
  }
  // window扩展属性
  interface Window {
    $message: MessageApiInjection
  }
}
