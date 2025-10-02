
// ABOUTME: Service number generator utility for auto-incrementing service numbers
// ABOUTME: Generates service numbers in format SVC-YYYY-NNNNN

import { getServices } from './storageManager';

export function generateServiceNumber(): string {
  const currentYear = new Date().getFullYear();
  const services = getServices();
  
  // Filter services for current year and extract sequence numbers
  const currentYearServices = services.filter(service => {
    const serviceYear = new Date(service.date).getFullYear();
    return serviceYear === currentYear;
  });
  
  // Find the highest sequence number for the current year
  let maxSequence = 0;
  const serviceNumberPattern = new RegExp(`^SVC-${currentYear}-(\\d{5})$`);
  
  currentYearServices.forEach(service => {
    if (service.serviceNumber) {
      const match = service.serviceNumber.match(serviceNumberPattern);
      if (match) {
        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
  });
  
  // Generate next sequence number
  const nextSequence = maxSequence + 1;
  const paddedSequence = nextSequence.toString().padStart(5, '0');
  
  return `SVC-${currentYear}-${paddedSequence}`;
}
