const API_BASE_URL = 'http://localhost:8000/api';

export const getUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
};

export const getUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
};