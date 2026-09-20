import type { AxiosAdapter } from 'axios';
import { seed, handleRequest } from './engine.ts';
import { useAuthStore } from '../store/useAuthStore';
import type { DemoState } from './data.ts';
const KEY = 'digitalfactory-demo-data-v1';
function load(): DemoState {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (value && Array.isArray(value.users) && Array.isArray(value.projects) && Array.isArray(value.tasks) && value.comments && Array.isArray(value.activities) && Array.isArray(value.notifications)) return value;
  } catch { /* Start fresh if storage is unavailable or invalid. */ }
  return seed();
}
let state = load();
export const resetDemo = () => {
  state = seed();
  try { sessionStorage.removeItem(KEY); } catch { /* Memory mode still works. */ }
  window.location.assign('/login');
};
export const demoAdapter: AxiosAdapter = async config => {
  const url = new URL(config.url || '/', 'https://demo.invalid');
  for (const [key, value] of Object.entries(config.params || {})) url.searchParams.set(key, String(value));
  // Pass absolute requests through to the engine so they fail closed.
  const target = /^[a-z]+:/i.test(config.url || '') || (config.url || '').startsWith('//') ? config.url! : url.pathname + url.search;
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
  const method = config.method || 'get';
  const data = handleRequest(state, method, target, body, useAuthStore.getState().user);
  if (method.toLowerCase() !== 'get') {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* Keep changes in memory. */ }
    window.dispatchEvent(new Event('demo:changed'));
  }
  return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config };
};
