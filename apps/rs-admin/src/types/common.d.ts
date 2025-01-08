import type { Component } from 'vue'

interface ITabItem {
  path: string
  name: string
  // checked: boolean
}
interface IMenuItem {
  path: string
  name: string
  parent: IMenuItem | null
  children?: IMenuItem[]
  icon: Component
}
