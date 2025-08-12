import { useState, useEffect } from 'react';
import { API_URL } from "./apiUrl";

export const useGetUserInfo = (spinToken) => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (spinToken) {
      fetch(`${API_URL}/api/userinfo/profile`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${spinToken}`
        }
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Invalid spinToken or failed to authenticate");
          }
          return response.json();
        })
        .then((response) => {
          const data = response.userData; 
          console.log("data", data)
          const userInfoData = {
            session: data.session,
            username: data.username,
            balance: Math.floor(data.balance),
            id: data.chatId,
            chatId: data.chatId,
          }
          setUserInfo(userInfoData);  
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          setError(error);
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [spinToken]);

  return { userInfo, isLoading, error };
};
