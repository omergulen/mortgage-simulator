/**
 * Convert an array of objects to CSV format
 */
export function convertToCSV(data: Record<string, unknown>[], headers: string[]): string {
  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) {
      return ''
    }
    const str = String(value)
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Create CSV rows
  const rows: string[] = []
  
  // Add header row
  rows.push(headers.map(escapeCSV).join(','))
  
  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => escapeCSV(row[header]))
    rows.push(values.join(','))
  }
  
  return rows.join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}


