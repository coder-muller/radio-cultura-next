/**
 * Utility functions for API requests
 */

// const BASE_URL = 'http://localhost:5000'
const BASE_URL = 'https://radio-cultura.cgmcloud.com.br'

type RequestOptions = {
  headers?: Record<string, string>;
  token?: string;
  params?: Record<string, string>;
};

/**
 * Sends a GET request to the specified URL
 * @param url The URL to send the request to
 * @param options Request options including headers, token, and query parameters
 * @returns The response data
 */
export async function sendGet<T>(url: string, options?: RequestOptions): Promise<T> {
  try {
    // Add query parameters if provided
    if (options?.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url = `${BASE_URL}${url}?${queryParams.toString()}`;
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authorization token if provided
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(BASE_URL + url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendGet:', error);
    throw error;
  }
}

/**
 * Sends a POST request to the specified URL
 * @param url The URL to send the request to
 * @param data The data to send in the request body
 * @param options Request options including headers and token
 * @returns The response data
 */
export async function sendPost<T, D extends Record<string, unknown>>(url: string, data: D, options?: RequestOptions): Promise<T> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authorization token if provided
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(BASE_URL + url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendPost:', error);
    throw error;
  }
}

/**
 * Sends a PUT request to the specified URL
 * @param url The URL to send the request to
 * @param data The data to send in the request body
 * @param options Request options including headers and token
 * @returns The response data
 */
export async function sendPut<T, D extends Record<string, unknown>>(url: string, data: D, options?: RequestOptions): Promise<T> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authorization token if provided
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(BASE_URL + url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendPut:', error);
    throw error;
  }
}

/**
 * Sends a DELETE request to the specified URL
 * @param url The URL to send the request to
 * @param options Request options including headers and token
 * @returns The response data
 */
export async function sendDelete<T>(url: string, options?: RequestOptions): Promise<T> {
  try {
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // Add authorization token if provided
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const response = await fetch(BASE_URL + url, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendDelete:', error);
    throw error;
  }
}

/**
 * Formats a string into a Brazilian phone number format
 * @param value The string to be formatted
 * @returns The formatted phone number string
 */
export function formatPhone(value: string): string {
  if (!value) return '';

  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, '');

  // Handle different number lengths
  switch (numbers.length) {
    case 8: // Local landline: xxxx-xxxx
      return numbers.replace(/(\d{4})(\d{4})/, '$1-$2');
    case 9: // Local mobile: xxxxx-xxxx
      return numbers.replace(/(\d{5})(\d{4})/, '$1-$2');
    case 10: // Full landline: (xx) xxxx-xxxx
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    case 11: // Full mobile: (xx) xxxxx-xxxx
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    default:
      return value;
  }
}

export function parseDate(dateStr: string): string | null {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(regex);
  if (!match) return null;
  const [, dayStr, monthStr, yearStr] = match;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day) {
    return date.toISOString();
  }
  return null;
}