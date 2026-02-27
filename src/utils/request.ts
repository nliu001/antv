const BASE_URL = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET'
  console.log(`[API Request] ${method} ${BASE_URL}${url}`, options?.body ? JSON.parse(options.body as string) : '')
  
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    return request<T>(`${url}${queryString}`)
  },

  post<T>(url: string, data?: any): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put<T>(url: string, data?: any): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete<T>(url: string): Promise<T> {
    return request<T>(url, {
      method: 'DELETE',
    })
  },
}
