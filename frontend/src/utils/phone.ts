/**
 * Utility functions for Uzbekistan phone number formatting and validation
 */

const UZ_OPERATOR_CODES = new Set([
  '90', '91', '93', '94', '95', '97', '98', '99', // Beeline, Ucell, Mobiuz, UzMobile
  '88', '77', '33', '50', '55',                   // Humans, Beeline, Ucell, Mobiuz
  '71', '78', '69', '66', '65', '73', '74', '75', '76', '79', '61', '62' // City/Region landlines & CDMA
]);

/**
 * Formats a raw string into standard Uzbekistan phone number:
 * Example: "901234567" -> "+998 (90) 123-45-67"
 * 
 * In this implementation:
 * - Always keeps "+998 " permanently at the beginning
 * - NEVER appends trailing symbols (like '-' or ')') unless at least one digit follows
 */
export function formatUzPhone(input: string): string {
  if (!input) return '+998 ';

  let digits = input.replace(/\D/g, '');

  // If starts with 998, remove it to extract local digits
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // Max 9 digits in Uzbekistan local number
  digits = digits.slice(0, 9);

  if (digits.length === 0) {
    return '+998 ';
  }

  let formatted = '+998 (';

  if (digits.length <= 2) {
    return formatted + digits;
  }

  formatted += digits.slice(0, 2) + ') ' + digits.slice(2, Math.min(5, digits.length));

  if (digits.length > 5) {
    formatted += '-' + digits.slice(5, Math.min(7, digits.length));
  }

  if (digits.length > 7) {
    formatted += '-' + digits.slice(7, 9);
  }

  return formatted;
}

/**
 * Strips formatting and returns E.164 phone string:
 * Example: "+998 (90) 123-45-67" -> "+998901234567"
 */
export function cleanUzPhone(value: string): string {
  if (!value) return '';
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  if (digits.length === 0) return '';
  return `+998${digits.slice(0, 9)}`;
}

/**
 * Validates whether the given string is a complete and valid Uzbekistan phone number
 */
export function validateUzPhone(value: string): { isValid: boolean; error?: string } {
  if (!value || !value.trim() || value.trim() === '+998' || value.trim() === '+998 ') {
    return { isValid: false, error: 'Telefon raqamini kiritish majburiy' };
  }

  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  if (digits.length < 9) {
    return {
      isValid: false,
      error: 'Telefon raqami to‘liq kiritilmadi (+998 (XX) XXX-XX-XX)'
    };
  }

  const opCode = digits.slice(0, 2);
  if (!UZ_OPERATOR_CODES.has(opCode)) {
    return {
      isValid: false,
      error: `Noto‘g‘ri operator kodi (${opCode}). O‘zbekiston raqamini kiriting`
    };
  }

  return { isValid: true };
}
