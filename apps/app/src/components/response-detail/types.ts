export interface ProfileData {
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

export function getProfileData(
  profileData: ProfileData | null | undefined,
  experience: string | null,
): {
  isJson: boolean;
  data?: ProfileData;
  text?: string;
} {
  // Приоритет: новое поле profileData
  if (profileData?.platform && profileData.username) {
    return { isJson: true, data: profileData };
  }

  // Fallback: старое поле experience (для обратной совместимости)
  if (!experience) return { isJson: false };

  try {
    const parsed = JSON.parse(experience) as ProfileData;
    if (parsed.platform && parsed.username) {
      return { isJson: true, data: parsed };
    }
  } catch {
    // Не JSON, обычный текст
  }

  return { isJson: false, text: experience };
}