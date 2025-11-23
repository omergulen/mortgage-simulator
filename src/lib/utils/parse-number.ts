/**
 * Parse number from various formats:
 * - EEE,CC (European: 1000,50)
 * - EEE.CC (US: 1000.50)
 * - EEE CC (with spaces: 1 000,50 or 1 000.50)
 * - Also handles thousands separators: 1.000,50 or 1,000.50
 */
export function parseNumber(value: string | number | undefined | null): number {
  if (!value || value === '') return 0
  
  // Convert to string and trim
  let cleaned = value.toString().trim()
  
  // Check if it's empty after trimming
  if (cleaned === '') return 0
  
  // Remove all spaces (thousands separator)
  cleaned = cleaned.replace(/\s/g, '')
  
  // Determine format by checking for comma and period
  const hasComma = cleaned.includes(',')
  const hasPeriod = cleaned.includes('.')
  
  if (hasComma && hasPeriod) {
    // Both comma and period: determine which is decimal separator
    const lastComma = cleaned.lastIndexOf(',')
    const lastPeriod = cleaned.lastIndexOf('.')
    
    if (lastComma > lastPeriod) {
      // Comma is decimal separator (European: 1.000,50)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // Period is decimal separator (US with thousands: 1,000.50)
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasComma) {
    // Only comma: could be decimal (European) or thousands separator
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      // Single comma with 1-2 digits after = decimal separator
      cleaned = cleaned.replace(',', '.')
    } else {
      // Multiple commas or more than 2 digits after = thousands separator
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasPeriod) {
    // Only period: could be decimal (US) or thousands separator
    const parts = cleaned.split('.')
    if (parts.length === 2 && parts[1] && parts[1].length <= 2) {
      // Single period with 1-2 digits after = decimal separator (US format)
      // Keep as is
    } else {
      // Multiple periods or more than 2 digits after = thousands separator
      cleaned = cleaned.replace(/\./g, '')
    }
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

