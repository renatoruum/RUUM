// config/api.js
const API_CONFIG = {
  BASE_URL: "https://apiruum-2cpzkgiiia-uc.a.run.app",
  TOKEN: "ruum-api-secure-token-2024"
};

export const apiHeaders = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${API_CONFIG.TOKEN}`
};

export const apiCall = async (endpoint, options = {}) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    headers: apiHeaders,
    ...options
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  
  return data;
};

export default API_CONFIG;