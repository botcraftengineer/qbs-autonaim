/**
 * Общие типы для схем БД
 */

/**
 * Тип для структурированных данных профиля фрилансера
 */
export interface StoredProfileData {
  platform?: string;
  username?: string;
  profileUrl?: string;
  aboutMe?: string;
  skills?: string[];
  statistics?: {
    rating?: number;
    ordersCompleted?: number;
    reviewsReceived?: number;
    successRate?: number;
    onTimeRate?: number;
    repeatOrdersRate?: number;
    buyerLevel?: string;
  };
  parsedAt?: string;
  error?: string;
}
