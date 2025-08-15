import { useState, useEffect, useCallback } from 'react';
import { API_URL } from "./apiUrl";

export const useGetUserInfo = (spinToken) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!spinToken) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/userinfo/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${spinToken}` },
      });
      if (!response.ok) {
        throw new Error('Invalid spinToken or failed to authenticate');
      }
      const respJson = await response.json();
      const data = respJson.userData;
      const userInfoData = {
        session: data.session,
        username: data.username,
        balance: Math.floor(data.balance),
        id: data.chatId,
        chatId: data.chatId,
      };
      setUserInfo(userInfoData);
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [spinToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { userInfo, isLoading, error, refreshUserInfo: fetchProfile };
};
