import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

export type SiteLanguage = 'de' | 'en'

export function withoutLanguage(path: string) {
  return path.replace(/^\/en(?=\/|$)/, '') || '/'
}

export function useSiteLanguage() {
  const { lang, site } = useData()
  const route = useRoute()
  const language = computed<SiteLanguage>(() => lang.value.startsWith('en') ? 'en' : 'de')
  const isEnglish = computed(() => language.value === 'en')
  const normalizedPath = computed(() => {
    const base = site.value.base || '/'
    const path = base !== '/' && route.path.startsWith(base)
      ? `/${route.path.slice(base.length)}` : route.path
    return withoutLanguage(path).replace(/\/+$/, '') || '/'
  })
  const text = (de: string, en: string) => isEnglish.value ? en : de
  const localizedPath = (path: string, target: SiteLanguage = language.value) =>
    withBase(`${target === 'en' ? '/en' : ''}${withoutLanguage(path)}`)
  const languagePath = (target: SiteLanguage) => localizedPath(normalizedPath.value, target)

  return { language, isEnglish, normalizedPath, text, localizedPath, languagePath }
}
