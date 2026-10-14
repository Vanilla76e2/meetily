import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import Analytics from '@/lib/analytics';
import { toast } from 'sonner';
import { useConfig } from '@/contexts/ConfigContext';

export interface Language {
  code: string;
  name: string;
}

// ISO 639-1 language codes supported by Whisper
const LANGUAGES: Language[] = [
  { code: 'auto', name: 'Автоопределение (исходный язык)' },
  { code: 'auto-translate', name: 'Автоопределение (перевод на английский)' },
  { code: 'en', name: 'Английский' },
  { code: 'zh', name: 'Китайский' },
  { code: 'de', name: 'Немецкий' },
  { code: 'es', name: 'Испанский' },
  { code: 'ru', name: 'Русский' },
  { code: 'ko', name: 'Корейский' },
  { code: 'fr', name: 'Французский' },
  { code: 'ja', name: 'Японский' },
  { code: 'pt', name: 'Португальский' },
  { code: 'tr', name: 'Турецкий' },
  { code: 'pl', name: 'Польский' },
  { code: 'ca', name: 'Каталанский' },
  { code: 'nl', name: 'Нидерландский' },
  { code: 'ar', name: 'Арабский' },
  { code: 'sv', name: 'Шведский' },
  { code: 'it', name: 'Итальянский' },
  { code: 'id', name: 'Индонезийский' },
  { code: 'hi', name: 'Хинди' },
  { code: 'fi', name: 'Финский' },
  { code: 'vi', name: 'Вьетнамский' },
  { code: 'he', name: 'Иврит' },
  { code: 'uk', name: 'Украинский' },
  { code: 'el', name: 'Греческий' },
  { code: 'ms', name: 'Малайский' },
  { code: 'cs', name: 'Чешский' },
  { code: 'ro', name: 'Румынский' },
  { code: 'da', name: 'Датский' },
  { code: 'hu', name: 'Венгерский' },
  { code: 'ta', name: 'Тамильский' },
  { code: 'no', name: 'Норвежский' },
  { code: 'th', name: 'Тайский' },
  { code: 'ur', name: 'Урду' },
  { code: 'hr', name: 'Хорватский' },
  { code: 'bg', name: 'Болгарский' },
  { code: 'lt', name: 'Литовский' },
  { code: 'la', name: 'Латынь' },
  { code: 'mi', name: 'Маори' },
  { code: 'ml', name: 'Малаялам' },
  { code: 'cy', name: 'Валлийский' },
  { code: 'sk', name: 'Словацкий' },
  { code: 'te', name: 'Телугу' },
  { code: 'fa', name: 'Персидский' },
  { code: 'lv', name: 'Латышский' },
  { code: 'bn', name: 'Бенгальский' },
  { code: 'sr', name: 'Сербский' },
  { code: 'az', name: 'Азербайджанский' },
  { code: 'sl', name: 'Словенский' },
  { code: 'kn', name: 'Каннада' },
  { code: 'et', name: 'Эстонский' },
  { code: 'mk', name: 'Македонский' },
  { code: 'br', name: 'Бретонский' },
  { code: 'eu', name: 'Баскский' },
  { code: 'is', name: 'Исландский' },
  { code: 'hy', name: 'Армянский' },
  { code: 'ne', name: 'Непальский' },
  { code: 'mn', name: 'Монгольский' },
  { code: 'bs', name: 'Боснийский' },
  { code: 'kk', name: 'Казахский' },
  { code: 'sq', name: 'Албанский' },
  { code: 'sw', name: 'Суахили' },
  { code: 'gl', name: 'Галисийский' },
  { code: 'mr', name: 'Маратхи' },
  { code: 'pa', name: 'Панджаби' },
  { code: 'si', name: 'Сингальский' },
  { code: 'km', name: 'Кхмерский' },
  { code: 'sn', name: 'Шона' },
  { code: 'yo', name: 'Йоруба' },
  { code: 'so', name: 'Сомалийский' },
  { code: 'af', name: 'Африкаанс' },
  { code: 'oc', name: 'Окситанский' },
  { code: 'ka', name: 'Грузинский' },
  { code: 'be', name: 'Белорусский' },
  { code: 'tg', name: 'Таджикский' },
  { code: 'sd', name: 'Синдхи' },
  { code: 'gu', name: 'Гуджарати' },
  { code: 'am', name: 'Амхарский' },
  { code: 'yi', name: 'Идиш' },
  { code: 'lo', name: 'Лаосский' },
  { code: 'uz', name: 'Узбекский' },
  { code: 'fo', name: 'Фарерский' },
  { code: 'ht', name: 'Гаитянский креольский' },
  { code: 'ps', name: 'Пушту' },
  { code: 'tk', name: 'Туркменский' },
  { code: 'nn', name: 'Норвежский нюнорск' },
  { code: 'mt', name: 'Мальтийский' },
  { code: 'sa', name: 'Санскрит' },
  { code: 'lb', name: 'Люксембургский' },
  { code: 'my', name: 'Бирманский' },
  { code: 'bo', name: 'Тибетский' },
  { code: 'tl', name: 'Тагальский' },
  { code: 'mg', name: 'Малагасийский' },
  { code: 'as', name: 'Ассамский' },
  { code: 'tt', name: 'Татарский' },
  { code: 'haw', name: 'Гавайский' },
  { code: 'ln', name: 'Лингала' },
  { code: 'ha', name: 'Хауса' },
  { code: 'ba', name: 'Башкирский' },
  { code: 'jw', name: 'Яванский' },
  { code: 'su', name: 'Сунданский' },
];

interface LanguageSelectionProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  provider?: 'localWhisper' | 'parakeet' | 'deepgram' | 'elevenLabs' | 'groq' | 'openai';
}

export function LanguageSelection({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  provider = 'localWhisper'
}: LanguageSelectionProps) {
  const [saving, setSaving] = useState(false);
  const { setSelectedLanguage } = useConfig();

  // Parakeet only supports auto-detection (doesn't support manual language selection)
  const isParakeet = provider === 'parakeet';
  const availableLanguages = isParakeet
    ? LANGUAGES.filter(lang => lang.code === 'auto' || lang.code === 'auto-translate')
    : LANGUAGES;

  const handleLanguageChange = async (languageCode: string) => {
    setSaving(true);
    try {
      // Save language preference to localStorage and sync to backend
      setSelectedLanguage(languageCode);
      onLanguageChange(languageCode);
      console.log('Language preference saved:', languageCode);

      // Track language selection analytics
      const selectedLang = LANGUAGES.find(lang => lang.code === languageCode);
      await Analytics.track('language_selected', {
        language_code: languageCode,
        language_name: selectedLang?.name || 'Unknown',
        is_auto_detect: (languageCode === 'auto').toString(),
        is_auto_translate: (languageCode === 'auto-translate').toString()
      });

      // Show success toast
      const languageName = selectedLang?.name || languageCode;
      toast.success("Параметр языка сохранён", {
        description: `Язык транскрибации: ${languageName}`
      });
    } catch (error) {
      console.error('Failed to save language preference:', error);
      toast.error("Не удалось сохранить параметр языка", {
        description: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSaving(false);
    }
  };

  // Find the selected language name for display
  const selectedLanguageName = LANGUAGES.find(
    lang => lang.code === selectedLanguage
  )?.name || 'Автоопределение (исходный язык)';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <h4 className="text-sm font-medium text-gray-900">Язык транскрибации</h4>
        </div>
      </div>

      <div className="space-y-2">
        <select
          value={selectedLanguage}
          onChange={(e) => handleLanguageChange(e.target.value)}
          disabled={disabled || saving}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
        >
          {availableLanguages.map((language) => (
            <option key={language.code} value={language.code}>
              {language.name}
              {language.code !== 'auto' && language.code !== 'auto-translate' && ` (${language.code})`}
            </option>
          ))}
        </select>

        {/* Parakeet language limitation warning */}
        {isParakeet && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
            <p className="font-medium">ℹ️ Поддержка языков Parakeet</p>
            <p className="mt-1 text-xs">Parakeet поддерживает только автоматическое определение языка. Ручной выбор языка недоступен. Чтобы указать конкретный язык, используйте Whisper.</p>
          </div>
        )}

        {/* Info text */}
        <div className="text-xs space-y-2 pt-2">
          <p className="text-gray-600">
            <strong>Сейчас:</strong> {selectedLanguageName}
          </p>
          {selectedLanguage === 'auto' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              <p className="font-medium">⚠️ Автоопределение может давать неточные результаты</p>
              <p className="mt-1">Для лучшей точности выберите конкретный язык (например, английский, испанский).</p>
            </div>
          )}
          {selectedLanguage === 'auto-translate' && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-800">
              <p className="font-medium">🌐 Режим перевода включён</p>
              <p className="mt-1">Весь звук автоматически переводится на английский. Подходит для многоязычных встреч, когда нужен результат на английском.</p>
            </div>
          )}
          {selectedLanguage !== 'auto' && selectedLanguage !== 'auto-translate' && (
            <p className="text-gray-600">
              Транскрибация будет оптимизирована для языка <strong>{selectedLanguageName}</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
