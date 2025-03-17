export interface PoliceLogMessage {
  id: string;
  threadId: string;
  category: string;
  district: string;
  municipality: string;
  area?: string;
  isActive: boolean;
  text: string;
  createdOn: string;
  updatedOn: string;
  imageUrl?: string | null;
  previouslyIncludedImage: boolean;
  isEdited: boolean;
}

export interface PoliceLogResponse {
  data: PoliceLogMessage[];
  metadata: {
    requestTime: string;
    apiVersion: string;
    requestLimitPerHour: number;
    totalItems: number;
    pageSize: number;
    queryParameters: Array<{
      key: string;
      value: string[];
    }>;
  };
}

// Fallback mock data to use when all API methods fail
const fallbackMockData: PoliceLogMessage[] = [
  {
    id: "fallback-1",
    threadId: "fallback-thread",
    category: "Trafikk",
    district: "Demo Politidistrikt",
    municipality: "Demo Kommune",
    area: "Sentrum",
    isActive: true,
    text: "Dette er en demo-melding fordi API-tilkoblingen ikke er tilgjengelig. Systemet kjører i feilsikker modus.",
    createdOn: new Date().toISOString(),
    updatedOn: new Date().toISOString(),
    previouslyIncludedImage: false,
    isEdited: false
  },
  {
    id: "fallback-2",
    threadId: "fallback-thread",
    category: "Informasjon",
    district: "Demo Politidistrikt",
    municipality: "Demo Kommune",
    area: "Nettverk",
    isActive: false,
    text: "API-forespørsel feiler på grunn av CORS-begrensninger. Dette er generert demo-innhold.",
    createdOn: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedOn: new Date(Date.now() - 3600000).toISOString(),
    previouslyIncludedImage: false,
    isEdited: false
  }
];

// The main function that automatically selects the best method based on environment
export const fetchPoliceLogMessages = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  // Determine if we're in development mode
  const isDevelopment = import.meta.env.DEV;
  
  try {
    if (isDevelopment) {
      // In development, try to use the Vite proxy first
      try {
        return await fetchPoliceLogMessagesWithDevProxy(district, municipality);
      } catch (error) {
        console.warn("Development proxy failed, falling back to CORS proxies", error);
        return await tryMultipleCorsProxies(district, municipality);
      }
    } else {
      // In production, try multiple CORS proxies
      try {
        return await tryMultipleCorsProxies(district, municipality);
      } catch (error) {
        console.error("All CORS proxies failed, using fallback data", error);
        return fallbackMockData;
      }
    }
  } catch (error) {
    console.error("All methods to fetch police log failed:", error);
    return fallbackMockData; // Return mock data as a last resort
  }
};

// Try multiple CORS proxies in sequence until one works
const tryMultipleCorsProxies = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  // List of CORS proxies to try in order
  const corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://thingproxy.freeboard.io/fetch/",
    "https://cors-anywhere.herokuapp.com/",
    "https://corsproxy.io/?",
  ];
  
  let lastError;
  
  // Try each proxy in sequence
  for (const proxy of corsProxies) {
    try {
      const messages = await fetchPoliceLogMessagesWithSpecificProxy(proxy, district, municipality);
      console.log(`Successfully fetched data using proxy: ${proxy}`);
      return messages;
    } catch (error) {
      console.warn(`Proxy ${proxy} failed, trying next one...`, error);
      lastError = error;
    }
  }
  
  // If all proxies fail, try without a proxy (might work in some environments)
  try {
    const messages = await fetchPoliceLogMessagesDirectly(district, municipality);
    return messages;
  } catch (error) {
    console.error("Direct API call also failed", error);
    lastError = error;
  }
  
  throw lastError || new Error("All proxies failed");
};

// Method using a specific CORS proxy
const fetchPoliceLogMessagesWithSpecificProxy = async (
  corsProxy: string,
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  try {
    const baseUrl = "https://api.politiet.no/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    
    const apiUrl = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    const url = `${corsProxy}${encodeURIComponent(apiUrl)}`;
    
    console.log(`Attempting to fetch police log via proxy: ${corsProxy}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Adding a timeout using AbortController
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch police log: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    console.log("Police log API response received:", responseData.data?.length || 0, "messages");
    
    return responseData.data || [];
  } catch (error) {
    console.error(`Error fetching police log with proxy ${corsProxy}:`, error);
    throw error;
  }
};

// Try direct API call without any proxy (may work in some environments)
const fetchPoliceLogMessagesDirectly = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  try {
    const baseUrl = "https://api.politiet.no/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    
    const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log("Attempting direct API call without proxy");
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
      },
      mode: 'cors',
      // Adding a timeout using AbortController
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Direct API call failed: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    return responseData.data || [];
  } catch (error) {
    console.error("Error with direct API call:", error);
    throw error;
  }
};

// Method using the local development server proxy (only works in development)
const fetchPoliceLogMessagesWithDevProxy = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  try {
    // Use the /api prefix which is configured to be proxied in vite.config.js
    const baseUrl = "/api/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    
    const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log("Fetching police log via dev proxy:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch police log: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    console.log("Police log API response received:", responseData.data?.length || 0, "messages");
    
    return responseData.data || [];
  } catch (error) {
    console.error("Error fetching police log with dev proxy:", error);
    throw error;
  }
};

// For backwards compatibility
export const fetchPoliceLogMessagesWithProxy = fetchPoliceLogMessages;
