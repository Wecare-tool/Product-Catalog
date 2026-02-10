
import { AUTH_API_URL } from '../config';

export const getAccessToken = async (): Promise<{ access_token: string } | null> => {

  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Access Token / API Response:", data);

    // Normalize response to return an object with access_token
    // FIX: Map dataverseToken (from your screenshot) to access_token
    if (data.dataverseToken) return { access_token: data.dataverseToken };

    // Check other common patterns
    if (data.access_token) return data;
    if (data.token) return { access_token: data.token };
    if (data.value) return { access_token: data.value };

    // Fallback: if the response is just a string
    if (typeof data === 'string') return { access_token: data };

    return data;
  } catch (error) {
    console.error("Failed to fetch access token:", error);
    // Return null so the app knows it failed
    return null;
  }
};
