import { useTranslation } from "react-i18next";

/**
 * Formate une date pour affichage
 * @param date Date à formater
 * @returns Date formatée en chaîne de caractères
 */
export const formatDate = (date: Date): string => {
  const { t } = useTranslation();

  if (isNaN(date.getTime())) {
    return t('date.invalid_date');
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays < 1) {
    if (diffInHours < 1) {
      if (diffInMinutes < 1) {
        return t('date.just_now');
      }
      return t('date.minutes_ago', {
        count: diffInMinutes,
        plural: diffInMinutes > 1 ? 's' : ''
      });
    }
    return t('date.hours_ago', {
      count: diffInHours,
      plural: diffInHours > 1 ? 's' : ''
    });
  } else if (diffInDays === 1) {
    return t('date.yesterday');
  } else if (diffInDays < 7) {
    return t('date.days_ago', {
      count: diffInDays,
      plural: diffInDays > 1 ? 's' : ''
    });
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const date = new Date(timestamp);
  return formatDate(date);
};
