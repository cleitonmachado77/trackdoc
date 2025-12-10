/**
 * Utility functions for formatting Brazilian documents and addresses
 */

/**
 * Format CPF input (adds dots and dash)
 * @param value - Raw CPF string
 * @returns Formatted CPF string
 */
export function formatCPF(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 11 digits
  const limited = numbers.slice(0, 11)
  
  // Apply CPF formatting
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 6) {
    return `${limited.slice(0, 3)}.${limited.slice(3)}`
  } else if (limited.length <= 9) {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`
  } else {
    return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`
  }
}

/**
 * Format CEP input (adds dash)
 * @param value - Raw CEP string
 * @returns Formatted CEP string
 */
export function formatCEP(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 8 digits
  const limited = numbers.slice(0, 8)
  
  // Apply CEP formatting
  if (limited.length <= 5) {
    return limited
  } else {
    return `${limited.slice(0, 5)}-${limited.slice(5)}`
  }
}

/**
 * Format phone input (Brazilian format)
 * @param value - Raw phone string
 * @returns Formatted phone string
 */
export function formatPhone(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '')
  
  // Limit to 11 digits (mobile) or 10 digits (landline)
  const limited = numbers.slice(0, 11)
  
  // Apply phone formatting
  if (limited.length <= 2) {
    return limited
  } else if (limited.length <= 6) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2)}`
  } else if (limited.length <= 10) {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`
  } else {
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`
  }
}

/**
 * Validate CPF format and check digit
 * @param cpf - CPF string to validate
 * @returns boolean indicating if CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatting
  const numbers = cpf.replace(/\D/g, '')
  
  // Check if has 11 digits
  if (numbers.length !== 11) return false
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(numbers[10])) return false
  
  return true
}

/**
 * Validate CEP format
 * @param cep - CEP string to validate
 * @returns boolean indicating if CEP format is valid
 */
export function validateCEP(cep: string): boolean {
  const numbers = cep.replace(/\D/g, '')
  return numbers.length === 8
}

/**
 * Clean CPF (remove formatting)
 * @param cpf - Formatted CPF string
 * @returns Clean CPF string with only numbers
 */
export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/**
 * Clean CEP (remove formatting)
 * @param cep - Formatted CEP string
 * @returns Clean CEP string with only numbers
 */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/**
 * Clean phone (remove formatting)
 * @param phone - Formatted phone string
 * @returns Clean phone string with only numbers
 */
export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}