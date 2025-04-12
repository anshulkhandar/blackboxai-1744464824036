const config = {
  apiBaseUrl: window.location.port === '8000' ? 
    'http://localhost:8001' : '/api',
  staticPath: window.location.port === '8000' ? 
    '' : '/static'
};
window.appConfig = config;