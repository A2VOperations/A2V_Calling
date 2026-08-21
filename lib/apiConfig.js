const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_BASE_URL = (rawUrl || '').replace(/\/+$/, '');

 