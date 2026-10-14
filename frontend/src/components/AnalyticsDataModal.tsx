'use client';

import React from 'react';
import { X, Info, Shield } from 'lucide-react';

interface AnalyticsDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDisable: () => void;
}

export default function AnalyticsDataModal({ isOpen, onClose, onConfirmDisable }: AnalyticsDataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Что собирает аналитика</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Конфиденциальность защищена</p>
                <p>Аналитика выключена по умолчанию. При включении собираются <strong>только анонимные данные об использовании</strong>. Содержимое встреч, имена, пути к файлам и личные данные не собираются.</p>
              </div>
            </div>
          </div>

          {/* Data Categories */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Данные при включённой аналитике:</h3>

            {/* Model Preferences */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">1. Параметры моделей</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Модель транскрибации (например, «Whisper large-v3», «Parakeet»)</li>
                <li>• Модель сводки (например, «Llama 3.2», «Claude Sonnet»)</li>
                <li>• Провайдер модели (например, «Local», «Ollama», «OpenRouter»)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Помогает понять, какие модели предпочитают</p>
            </div>

            {/* Meeting Metrics */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">2. Анонимные показатели встреч</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Длительность записи (например, «125 секунд»)</li>
                <li>• Длительность паузы (например, «5 секунд»)</li>
                <li>• Число сегментов расшифровки</li>
                <li>• Число обработанных аудиофрагментов</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Помогает оптимизировать производительность и понять сценарии использования</p>
            </div>

            {/* Device Types */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">3. Типы устройств (не имена)</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Тип микрофона: «Bluetooth», «Wired» или «Unknown»</li>
                <li>• Тип системного звука: «Bluetooth», «Wired» или «Unknown»</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Помогает улучшить совместимость; имена устройств не собираются</p>
            </div>

            {/* Usage Patterns */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">4. Сценарии использования приложения</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• События запуска и остановки приложения</li>
                <li>• Длительность сеанса</li>
                <li>• Использование функций (например, «настройки изменены»)</li>
                <li>• Случаи ошибок (помогают исправлять дефекты)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Помогает улучшать работу приложения</p>
            </div>

            {/* Platform Info */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">5. Сведения о платформе</h4>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Операционная система (например, «macOS», «Windows»)</li>
                <li>• Версия приложения (добавляется ко всем событиям)</li>
                <li>• Архитектура (например, «x86_64», «aarch64»)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">Помогает расставлять приоритеты поддержки платформ</p>
            </div>
          </div>

          {/* What We DON'T Collect */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Что не собирается:</h4>
            <ul className="text-sm text-red-800 space-y-1 ml-4">
              <li>• ❌ Названия встреч</li>
              <li>• ❌ Имена файлов, пути и папки встреч</li>
              <li>• ❌ Расшифровки и содержимое встреч</li>
              <li>• ❌ Аудиозаписи</li>
              <li>• ❌ Имена устройств (только типы: Bluetooth/Wired)</li>
              <li>• ❌ Личные данные</li>
              <li>• ❌ Любые идентифицирующие данные</li>
            </ul>
          </div>

          {/* Example Event */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Пример события:</h4>
            <pre className="text-xs text-gray-700 overflow-x-auto">
              {`{
  "event": "meeting_ended",
  "app_version": "0.4.1",
  "transcription_provider": "parakeet",
  "transcription_model": "parakeet-tdt-0.6b-v3-int8",
  "summary_provider": "ollama",
  "summary_model": "llama3.2:latest",
  "total_duration_seconds": "125.5",
  "microphone_device_type": "Wired",
  "system_audio_device_type": "Bluetooth",
  "chunks_processed": "150",
  "had_fatal_error": "false"
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Оставить аналитику включённой
          </button>
          <button
            onClick={onConfirmDisable}
            className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
          >
            Подтвердить: выключить аналитику
          </button>
        </div>
      </div>
    </div>
  );
}
