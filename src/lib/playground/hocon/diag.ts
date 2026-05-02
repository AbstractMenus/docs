import type { DiagCode, DiagParams } from './types';
import { t, type TranslationKey } from '../i18n';

/**
 * Render the localized message for a diagnostic code in the active locale.
 * Centralized so emitters and external consumers (linter overlay,
 * ValidationPanel) share the same lookup, and so a future move to a
 * different i18n backend touches one function.
 */
export function formatDiagMessage(code: DiagCode, params?: DiagParams): string {
  return t(`diag.${code}` as TranslationKey, params);
}
