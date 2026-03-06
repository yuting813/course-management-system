import axios from './axios.service';

const API_URL = '/user';

class AuthService {
  // 核心認證功能
  login(email, password) {
    return axios.post(`${API_URL}/login`, {
      email,
      password,
    });
  }

  logout() {
    localStorage.removeItem('user');
  }

  register(formData) {
    return axios.post(`${API_URL}/register`, formData);
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  // 設置當前用戶（登入後使用）
  setCurrentUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // 檢查是否已登入
  isAuthenticated() {
    return !!this.getCurrentUser();
  }
}

const authService = new AuthService();
export default authService;
