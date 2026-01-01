// Automatically detect environment and use appropriate API URL
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = process.env.REACT_APP_API_URL || 
  (isDevelopment ? 'http://localhost:5000/api' : 'https://to-do-trimity-backend.onrender.com/api');

// Only log in development
if (isDevelopment) {
  console.log('🌐 API Configuration:', {
    environment: 'development',
    apiUrl: API_URL
  });
}

export default API_URL;
