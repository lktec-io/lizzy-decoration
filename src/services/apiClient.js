import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStorage';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({ baseURL, withCredentials: true });

// Separate instance for the refresh call itself so it never recurses through
// the response interceptor below.
const refreshClient = axios.create({ baseURL, withCredentials: true });

let onSessionExpired = () => {};
export function setOnSessionExpired(callback) {
  onSessionExpired = callback;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthRoute = config?.url?.startsWith('/auth/login') || config?.url?.startsWith('/auth/refresh');
    if (response?.status !== 401 || isAuthRoute || config._retried) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshClient.post('/auth/refresh').finally(() => {
          refreshPromise = null;
        });
      }
      const { data } = await refreshPromise;
      setAccessToken(data.data.accessToken);
      config.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return apiClient(config);
    } catch (refreshError) {
      clearAccessToken();
      onSessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
