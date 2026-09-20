import axios from 'axios';
import { demoAdapter } from '../demo/adapter';
// Deliberately no network adapter or environment-controlled API URL.
export const api = axios.create({ adapter: demoAdapter, headers: { 'Content-Type': 'application/json' } });
