// Mock API service for invite acceptance flow

import { authAPI } from './api.js';

// Function to create studio from invite with email verification
export const createStudioFromInvite = async (inviteCode, studioName, subdomain, email) => {
  try {
    const response = await authAPI.createStudioFromInvite(inviteCode, studioName, subdomain, email);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to create studio from invite');
  }
};

// Function to set password for studio
export const setPasswordForStudio = async (studioId, password) => {
  try {
    const response = await authAPI.setPasswordForStudio(studioId, password);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to set password for studio');
  }
};

// Function to verify invite code with backend API
export const verifyInviteCode = async (inviteCode, email) => {
  const response = await fetch('/api/auth/verify-invite-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code: inviteCode, email })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to verify invite code');
  }

  return data;
};
