import DefaultTheme from "vitepress/theme-without-fonts";

import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import './styles/vars.css'
import './styles/landing.css'
import "./tailwind.css";
import './styles/fonts.css'
import type { Theme } from "vitepress";
import Layout from './Layout.vue'
import WorkPage from './components/WorkPage.vue'

export default {
  Layout,
  enhanceApp({ app }) {
    app.component('WorkPage', WorkPage)
  }
} satisfies Theme
