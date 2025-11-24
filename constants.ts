// In a real production app, the GUEST_TOKEN should be hidden behind a proxy server
// to prevent abuse. For this demo, we assume it's injected via env or accessible.
// Since we can't create a backend here, we simulate the 'Serverless Bot' by 
// using a token provided in the environment or UI configuration.

export const GITHUB_API_URL = 'https://api.github.com/graphql';

// Default configuration for demo purposes
export const DEFAULT_CONFIG = {
  repoOwner: "cirnovsky", // Example: leveraging a public repo for read-only demo if needed, but user should change
  repoName: "guescus",
  categoryId: "DIC_kwDOQbwk_M4CyPKf", // Random example ID, user must provide theirs
  term: "Welcome to Gist-Cus"
};