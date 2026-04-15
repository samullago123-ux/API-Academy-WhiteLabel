import { beforeEach, describe, expect, it } from 'vitest'
import { THEMES, applyTheme, initTheme } from './theme.js'

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.cssText = ''
    window.__WL_THEME__ = undefined
    window.__WL_THEME_TOKENS__ = undefined
  })

  it('aplica un theme por nombre', () => {
    applyTheme('ocean')
    expect(document.documentElement.dataset.theme).toBe('ocean')
    expect(document.documentElement.style.getPropertyValue('--zinc-950').trim()).toBe(THEMES.ocean['zinc-950'])
  })

  it('initTheme usa localStorage y soporta override por tokens', () => {
    window.localStorage.setItem('wl:theme', 'ocean')
    window.__WL_THEME_TOKENS__ = { 'indigo-500': '1 2 3' }
    initTheme()

    expect(document.documentElement.dataset.theme).toBe('custom')
    expect(document.documentElement.style.getPropertyValue('--indigo-500').trim()).toBe('1 2 3')
  })
})
