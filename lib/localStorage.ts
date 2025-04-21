// Safely get an item from localStorage with error handling
export function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

// Safely set an item in localStorage with error handling
export function setLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Error setting localStorage:', error);
    return false;
  }
}

// Safely remove an item from localStorage with error handling
export function removeLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
}