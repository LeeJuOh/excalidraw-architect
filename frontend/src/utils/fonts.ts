import { FONT_FAMILY } from '@excalidraw/excalidraw'

const FONT_NAMES = new Map<number, string>(
  Object.entries(FONT_FAMILY).map(([name, value]) => [value, name])
)

interface TextSource {
  type?: string
  text?: unknown
  originalText?: unknown
  fontFamily?: unknown
  label?: { text?: unknown; fontFamily?: unknown }
}

// Text per font, so only the font files (unicode subsets) the scene uses load.
const textPerFont = (elements: readonly unknown[]): Map<string, string> => {
  const texts = new Map<string, string>()
  const add = (fontFamily: unknown, text: unknown): void => {
    const name = typeof fontFamily === 'number' ? FONT_NAMES.get(fontFamily) : undefined
    if (!name || typeof text !== 'string' || !text) return
    texts.set(name, (texts.get(name) ?? '') + text)
  }
  for (const element of elements as TextSource[]) {
    if (!element) continue
    if (element.type === 'text') add(element.fontFamily, element.originalText ?? element.text)
    if (element.label) add(element.label.fontFamily ?? element.fontFamily, element.label.text)
  }
  return texts
}

// Excalidraw measures text when it converts elements. If the font file has
// not arrived, it keeps the fallback font's width and the text is clipped.
// A font that fails or stalls leaves the fallback; the scene still loads.
const FONT_LOAD_TIMEOUT_MS = 5000

export const loadSceneFonts = async (elements: readonly unknown[]): Promise<void> => {
  const pending = [...textPerFont(elements)]
    .map(([name, text]) => [`16px "${name}"`, text] as const)
    .filter(([font, text]) => !document.fonts.check(font, text))
  if (pending.length === 0) return
  const loads = Promise.all(pending.map(([font, text]) => document.fonts.load(font, text).catch(() => [])))
  await Promise.race([loads, new Promise(resolve => setTimeout(resolve, FONT_LOAD_TIMEOUT_MS))])
}
