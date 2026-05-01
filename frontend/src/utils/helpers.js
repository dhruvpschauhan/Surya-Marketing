/**
 * Format a number in Indian numbering system.
 * e.g., 123456.50 → "₹1,23,456.50"
 */
export function formatIndianCurrency(value) {
  if (value === null || value === undefined || value === '') return '₹0.00';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0.00';
  
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  const [intPart, decPart] = absNum.toFixed(2).split('.');
  
  // Indian grouping: last 3 digits, then groups of 2
  let formatted;
  if (intPart.length <= 3) {
    formatted = intPart;
  } else {
    const last3 = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = [];
    let rem = remaining;
    while (rem.length > 0) {
      groups.unshift(rem.slice(-2));
      rem = rem.slice(0, -2);
    }
    formatted = groups.join(',') + ',' + last3;
  }
  
  return `${isNegative ? '-' : ''}₹${formatted}.${decPart}`;
}

/**
 * Get category badge class
 */
export function getCategoryBadgeClass(category) {
  const map = {
    'Pipe': 'badge-pipe',
    'Fitting': 'badge-fitting',
    'Solvent': 'badge-solvent',
  };
  return map[category] || 'badge-pipe';
}

/**
 * Get material type badge class
 */
export function getMaterialBadgeClass(materialType) {
  const map = {
    'PVC': 'badge-pvc',
    'CPVC': 'badge-cpvc',
  };
  return map[materialType] || 'badge-pvc';
}

/**
 * Get company tint class
 */
export function getCompanyTintClass(company) {
  const map = {
    'Apollo': 'company-tint-apollo',
    'Supreme': 'company-tint-supreme',
    'Astral': 'company-tint-astral',
    'Ashirvad': 'company-tint-ashirvad',
  };
  return map[company] || '';
}

export const COMPANIES = ['Apollo', 'Supreme', 'Astral', 'Ashirvad'];
export const CATEGORIES = ['Pipe', 'Fitting', 'Solvent'];
export const MATERIAL_TYPES = ['PVC', 'CPVC'];

export const COMPANY_COLORS = {
  Apollo: '#DC2626',
  Supreme: '#2563EB',
  Astral: '#16A34A',
  Ashirvad: '#D97706',
};
