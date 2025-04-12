// Authentication helper functions
const getAuthToken = () => localStorage.getItem('moneyManagerToken');
const setAuthToken = (token) => localStorage.setItem('moneyManagerToken', token);
const clearAuthToken = () => localStorage.removeItem('moneyManagerToken');

export { getAuthToken, setAuthToken, clearAuthToken };