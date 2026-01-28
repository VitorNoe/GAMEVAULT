import axios, { AxiosInstance, AxiosError } from 'axios';
import { getApiBaseUrl } from '../utils/constants';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = getApiBaseUrl();
    console.log('API Base URL:', baseURL); // Debug log

    this.api = axios.create({
      baseURL: baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  public getApi() {
    return this.api;
  }
}

export const apiService = new ApiService();
export const api = apiService.getApi();
