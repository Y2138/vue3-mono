import type { LoadingBarApi, MessageApi } from 'naive-ui'
import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

declare global {
  // 可选图标
  // route
  type CustomRouteRecord = RouteRecordRaw & {
    meta?: {
      title: string
      icon?: string
    }
    children?: CustomRouteRecord[]
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
    icon: string
  }
  // 全局通用类型
  interface IObj {
    [key: string | number | symbol]: any
  }

  // 请求返回类型
  interface ResResult<T = IObj> {
    code?: number
    data?: T
    msg?: string

    // totalCount?: number
  }
  // 分页表格接口data类型
  interface IPaginationResData<T extends Array> {
    table_data: T
    header?: Record<string, string>
    page_data: {
      count: number
      page: number
      page_size: number
    }
    /* 合计 */
    total_data?: Record<string, string>
  }
  interface IPaginationRequest {
    page: number
    // pageSize: number
    page_size: number
  }
  // 通用请求方法类型
  interface IRequest<Q, R> {
    (data: Q): Promise<[null, any] | [ResResult<R>, null]>
  }
  // window扩展属性
  interface Window {
    $message: MessageApi
    $loadingBar: LoadingBarApi
  }
  
  declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<{}, {}, any>;
    export default component;
  } 
}
