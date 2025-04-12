// Authentication helper functions
const auth = {
  getToken: () => localStorage.getItem('moneyManagerToken'),
  setToken: (token) => localStorage.setItem('moneyManagerToken', token),
  clearToken: () => localStorage.removeItem('moneyManagerToken')
};

// Attach to window for global access
window.authHelper = auth;