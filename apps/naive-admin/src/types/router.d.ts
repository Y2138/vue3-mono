import 'vue-router'
import { Component } from 'vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string | Component
    name?: string
  }
}

export interface CustomRouteRecord {
  path: string
  name?: string
  component?: Component | (() => Promise<Component>)
  meta?: RouteMeta
  redirect?: string
  children?: CustomRouteRecord[]
} 