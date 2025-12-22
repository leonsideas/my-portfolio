import DefaultTheme from "vitepress/theme-without-fonts";

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import './styles/vars.css'
import './styles/landing.css'
import "./tailwind.css";
import './styles/fonts.css'
import type { Theme } from "vitepress";
import Layout from './Layout.vue'

export default {
  Layout,
  // extends: DefaultTheme,
  // enhanceApp({ app }) {
  //   app.use(TwoslashFloatingVue)
  //   // ...
  // }
} satisfies Theme
