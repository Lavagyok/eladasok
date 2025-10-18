// Number formatting utilities
export const formatNumberInput = (value: string): string => {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.replace(/[^\d]/g, '');
  
  if (!cleanValue) return '';
  
  // Convert to number and format with Hungarian thousand separators
  const number = parseInt(cleanValue);
  return new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

export const parseFormattedNumber = (formattedValue: string): number => {
  // Remove all non-digit characters and convert to number
  const cleanValue = formattedValue.replace(/[^\d]/g, '');
  return cleanValue ? parseInt(cleanValue) : 0;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' Ft';
};