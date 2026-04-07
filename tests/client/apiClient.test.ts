import { mapApiError } from '../../src/services/apiClient';

describe('api client error mapping', () => {
  it('maps VALIDATION_ERROR into readable message', () => {
    const msg = mapApiError({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payload',
      },
    });

    expect(msg).toBe('資料格式錯誤，請檢查輸入內容');
  });
});
