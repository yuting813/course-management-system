
import axios from 'axios';
import { getToken, clearToken, isTokenExpired } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 自動夾帶 Token 並檢查過期
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      // 在發送請求前，先檢查 Token 是否過期 (Client-side Pre-check)
      // 如果過期，直接登出，節省一次無效的 Server Request
      if (isTokenExpired(token)) {
        clearToken();
        window.location.href = '/login';
        return Promise.reject(new Error('Token expired'));
      }
      
      // 注意：這裡假設後端接受的格式是直接 Token 或 "JWT " + Token
      // 根據 auth.js 的 login 邏輯，token 字串已經包含 "JWT " 前綴
      config.headers['Authorization'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 統一處理 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 處理 401 Unauthorized (後端驗證失敗)
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/login')) {
        clearToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
