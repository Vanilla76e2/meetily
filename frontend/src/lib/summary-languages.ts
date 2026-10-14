export interface LanguageOption {
  code: string;
  label: string;
}

/**
 * Language options offered in the summary language pickers.
 * Codes must stay in sync with `language_name_from_code` in
 * `frontend/src-tauri/src/summary/processor.rs`.
 */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'Английский' },
  { code: 'zh', label: 'Китайский' },
  { code: 'zh-tw', label: 'Китайский (традиционный)' },
  { code: 'de', label: 'Немецкий' },
  { code: 'es', label: 'Испанский' },
  { code: 'ru', label: 'Русский' },
  { code: 'ko', label: 'Корейский' },
  { code: 'fr', label: 'Французский' },
  { code: 'ja', label: 'Японский' },
  { code: 'pt', label: 'Португальский' },
  { code: 'it', label: 'Итальянский' },
  { code: 'nl', label: 'Нидерландский' },
  { code: 'pl', label: 'Польский' },
  { code: 'ar', label: 'Арабский' },
  { code: 'hi', label: 'Хинди' },
  { code: 'ta', label: 'Тамильский' },
  { code: 'tr', label: 'Турецкий' },
  { code: 'vi', label: 'Вьетнамский' },
  { code: 'th', label: 'Тайский' },
  { code: 'id', label: 'Индонезийский' },
  { code: 'sv', label: 'Шведский' },
  { code: 'cs', label: 'Чешский' },
  { code: 'da', label: 'Датский' },
  { code: 'fi', label: 'Финский' },
  { code: 'el', label: 'Греческий' },
  { code: 'he', label: 'Иврит' },
  { code: 'hu', label: 'Венгерский' },
  { code: 'no', label: 'Норвежский' },
  { code: 'ro', label: 'Румынский' },
  { code: 'uk', label: 'Украинский' },
];

export const AUTO_VALUE = '__auto__' as const;

const SUPPORTED_CODES: ReadonlySet<string> = new Set(LANGUAGE_OPTIONS.map((o) => o.code));

/**
 * Normalises a raw locale string (from transcription or storage) into a code we
 * can translate into. Handles BCP-47 regional tags: `pt-BR` -> `pt`, `en_GB` -> `en`.
 * Returns null for unsupported languages so callers can fall back to English
 * rather than sending a code Rust will silently drop.
 */
export function normaliseLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase().replace(/_/g, '-');
  if (SUPPORTED_CODES.has(lower)) return lower;
  const base = lower.split('-')[0];
  if (SUPPORTED_CODES.has(base)) return base;
  return null;
}

export function labelForCode(code: string): string {
  return LANGUAGE_OPTIONS.find((l) => l.code === code)?.label ?? code;
}
