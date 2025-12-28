/**
 * Convert number to words (Indian numbering system)
 * Extracted from pdf.ts to avoid importing pdfkit in client components
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  
  if (num === 0) return 'Zero'
  if (num < 10) return ones[num]
  if (num < 20) return teens[num - 10]
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
  if (num < 1000) {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    return ones[hundred] + ' Hundred' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 100000) {
    const thousand = Math.floor(num / 1000)
    const remainder = num % 1000
    return numberToWords(thousand) + ' Thousand' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  if (num < 10000000) {
    const lakh = Math.floor(num / 100000)
    const remainder = num % 100000
    return numberToWords(lakh) + ' Lakh' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
  }
  const crore = Math.floor(num / 10000000)
  const remainder = num % 10000000
  return numberToWords(crore) + ' Crore' + (remainder !== 0 ? ' ' + numberToWords(remainder) : '')
}

