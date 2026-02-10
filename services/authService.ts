
export const getAccessToken = async (): Promise<{ access_token: string } | null> => {
  const API_URL = "https://de210e4bcd22e60591ca8e841aad4b.8e.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/0b067a6d21a641deb6e1450e16428cd5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=HMG_Cm5e3SlSGkF5gfcjdFF_qIx0aYGwyFh8cAuNA3w";

  try {
    const response = await fetch(API_URL, {
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
