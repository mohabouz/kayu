export const getSafetyColor = (level) => {
  switch (level) {
    case 'good':
      return '#4CAF50'; // Green
    case 'ok':
      return '#FF9800'; // Orange
    case 'bad':
      return '#F44336'; // Red
    case 'dangerous':
      return '#9C27B0'; // Purple
    default:
      return '#757575'; // Gray
  }
};

export const getSafetyText = (level) => {
  switch (level) {
    case 'good':
      return 'Good';
    case 'ok':
      return 'OK';
    case 'bad':
      return 'Bad';
    case 'dangerous':
      return 'Dangerous';
    default:
      return 'Unknown';
  }
};

export const formatScore = (score) => {
  return Math.round(score);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const colors = {
  primary: '#2196F3',
  secondary: '#FFC107',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  danger: '#9C27B0'
};
