
// In a real production app, the GUEST_TOKEN should be hidden behind a proxy server
// to prevent abuse. For this demo, we assume it's injected via env or accessible.

export const GITHUB_API_URL = 'https://api.github.com/graphql';

/**
 * Helper to safely get environment variables from various bundler environments
 * (Vite, Create React App, Next.js, etc.)
 */
export const getEnv = (key: string): string => {
  // 1. Try Vite's import.meta.env
  try {
    // @ts-ignore - import.meta may not be defined in all environments
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const viteVal = import.meta.env[`VITE_${key}`];
      if (viteVal) return viteVal;
      
      // @ts-ignore
      const val = import.meta.env[key];
      if (val) return val;
    }
  } catch (e) {
    // Ignore reference errors
  }

  // 2. Try process.env (CRA, Next.js, Node)
  try {
    if (typeof process !== 'undefined' && process.env) {
      // Priority 1: VITE_ prefix (standard for Vite)
      const viteVal = process.env[`VITE_${key}`];
      if (viteVal) return viteVal;

      // Priority 2: REACT_APP_ prefix (standard for CRA)
      const reactAppVal = process.env[`REACT_APP_${key}`];
      if (reactAppVal) return reactAppVal;

      // Priority 3: Direct key
      const val = process.env[key];
      if (val) return val;
    }
  } catch (e) {
    // Ignore
  }

  return '';
};

// Default configuration for demo purposes
export const DEFAULT_CONFIG = {
  repoOwner: "cirnovsky", 
  repoName: "guescus",
  categoryId: "DIC_kwDOQbwk_M4CyPKf", 
  term: "Welcome to Gist-Cus"
};
