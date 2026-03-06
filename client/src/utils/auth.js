/**
 * src/utils/auth.js
 * 核心職責：管理 Token 狀態與讀寫，與 HTTP 請求解耦
 */

const STORAGE_KEY = 'user';
const BUFFER_TIME = 10; // 秒：容許客戶端與伺服器時間誤差

/**
 * 檢查 Token 是否過期 (Client-side Check)
 * @param {string} token - JWT 字串
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // 1. 去除 "Bearer " 前綴 (若有的話)
    const pureToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    
    // 2. 解析 Payload
    const base64Url = pureToken.split('.')[1];
    if (!base64Url) return true;
    
    // 3. Base64 解碼 (處理 URL Safe)
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false; // 若無效期欄位，視為不過期

    // 4. 檢查是否過期 (包含 Buffer Time)
    const currentTime = Date.now() / 1000;
    return exp < (currentTime + BUFFER_TIME);
  } catch (e) {
    return true; // 解析失敗視為過期
  }
};

// 封裝 Storage 操作，隱藏實作細節
export const getToken = () => {
  const userStr = localStorage.getItem(STORAGE_KEY);
  if (!userStr) return null;
  const user = JSON.parse(userStr);
  return user.token || null;
};

export const clearToken = () => {
  localStorage.removeItem(STORAGE_KEY);
};
