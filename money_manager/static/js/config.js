const config = {
  apiBaseUrl: window.location.hostname === 'localhost' ? 
    'http://localhost:8001' : '/api'
};

window.appConfig = config;