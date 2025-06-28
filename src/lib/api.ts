/**
 * File utilitas untuk mengelola permintaan API ke backend Laravel
 */

// URL dasar API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Fungsi utilitas untuk melakukan permintaan fetch ke API
 * @param endpoint - Endpoint API (tanpa awalan /api)
 * @param options - Opsi fetch tambahan
 * @returns Response dari API
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  // Pastikan endpoint tidak dimulai dengan garis miring
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Siapkan headers default
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  // Gabungkan dengan headers yang diberikan
  const headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  // Buat URL lengkap
  const url = `${API_URL}/${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Penting untuk mengirim cookies
    });

    // Periksa apakah respons OK
    if (!response.ok) {
      // Coba untuk mendapatkan pesan error dari respons
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Error: ${response.status}`;
      } catch (e) {
        errorMessage = `Error: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    // Kembalikan data JSON jika ada
    if (response.headers.get('content-type')?.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fungsi GET untuk API
 * @param endpoint - Endpoint API
 * @param options - Opsi fetch tambahan
 */
export function get(endpoint: string, options: RequestInit = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * Fungsi POST untuk API
 * @param endpoint - Endpoint API
 * @param data - Data yang akan dikirim
 * @param options - Opsi fetch tambahan
 */
export function post(endpoint: string, data: any, options: RequestInit = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fungsi PUT untuk API
 * @param endpoint - Endpoint API
 * @param data - Data yang akan dikirim
 * @param options - Opsi fetch tambahan
 */
export function put(endpoint: string, data: any, options: RequestInit = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Fungsi DELETE untuk API
 * @param endpoint - Endpoint API
 * @param options - Opsi fetch tambahan
 */
export function del(endpoint: string, options: RequestInit = {}) {
  return fetchAPI(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

// Export semua fungsi
export const api = {
  get,
  post,
  put,
  delete: del,
  fetch: fetchAPI,
};

export default api; 