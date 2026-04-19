import { describe, it, expect } from 'vitest';
import { calculateLogAmount } from '../../src/utils/salary';

const hourlyJob = { id: 'j1', name: '早班', calcType: 'HOURLY' as const, unitPrice: 120, color: '#ff0000' };
const pieceJob  = { id: 'j2', name: '計件', calcType: 'PIECE'  as const, unitPrice: 10,  color: '#00ff00' };
const fixedJob  = { id: 'j3', name: '固定', calcType: 'FIXED'  as const, unitPrice: 500, color: '#0000ff' };

describe('calculateLogAmount', () => {
  describe('HOURLY', () => {
    it('整點工時：120 元/時 × 1 小時 = 120', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '10:00')).toBe(120);
    });

    it('30 分鐘：120 元/時 × 0.5 小時 = 60（整除，無進位）', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '09:30')).toBe(60);
    });

    it('10 分鐘：150 元/時 → ceil(150 * 10/60) = ceil(25) = 25', () => {
      // 150 * 10 / 60 = 25.0 → ceil = 25
      expect(calculateLogAmount(hourlyJob, 150, '09:00', '09:10')).toBe(25);
    });

    it('20 分鐘：130 元/時 → ceil(130 * 20/60) = ceil(43.33) = 44（無條件進位）', () => {
      // Math.round(43.33) = 43，Math.ceil(43.33) = 44
      expect(calculateLogAmount(hourlyJob, 130, '09:00', '09:20')).toBe(44);
    });

    it('1 分鐘：120 元/時 → ceil(120 / 60) = ceil(2) = 2', () => {
      expect(calculateLogAmount(hourlyJob, 120, '09:00', '09:01')).toBe(2);
    });

    it('缺少 startTime 或 endTime 時回傳 0', () => {
      expect(calculateLogAmount(hourlyJob, 120, undefined, undefined)).toBe(0);
      expect(calculateLogAmount(hourlyJob, 120, '09:00', undefined)).toBe(0);
    });
  });

  describe('PIECE', () => {
    it('計件：10 元 × 5 件 = 50', () => {
      expect(calculateLogAmount(pieceJob, 10, undefined, undefined, 5)).toBe(50);
    });

    it('缺少數量時回傳 0', () => {
      expect(calculateLogAmount(pieceJob, 10, undefined, undefined, undefined)).toBe(0);
    });
  });

  describe('FIXED', () => {
    it('固定：500 × 1 = 500', () => {
      expect(calculateLogAmount(fixedJob, 500, undefined, undefined, 1)).toBe(500);
    });
  });
});
