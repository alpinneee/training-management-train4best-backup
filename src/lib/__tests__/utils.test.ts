import { formatCurrency, formatDate, validateEmail, cn } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(1000)).toContain('Rp');
      expect(formatCurrency(1000)).toContain('1.000');
      expect(formatCurrency(1500000)).toContain('Rp');
      expect(formatCurrency(1500000)).toContain('1.500.000');
      expect(formatCurrency(0)).toContain('Rp');
      expect(formatCurrency(0)).toContain('0');
    });

    it('handles decimal values', () => {
      expect(formatCurrency(1000.5)).toContain('Rp');
      expect(formatCurrency(1000.5)).toContain('1.000,5');
      expect(formatCurrency(1500000.75)).toContain('Rp');
      expect(formatCurrency(1500000.75)).toContain('1.500.000,75');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15');
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('handles different date formats', () => {
      const date1 = new Date('2024-12-25');
      expect(formatDate(date1)).toBe('25/12/2024');
      
      const date2 = new Date('2024-03-08');
      expect(formatDate(date2)).toBe('08/03/2024');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('test..test@example.com')).toBe(false);
    });
  });
}); 