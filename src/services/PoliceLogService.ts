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
        console.warn("Development proxy failed, falling back to CORS proxy", error);
        return await fetchPoliceLogMessagesWithCorsProxy(district, municipality);
      }
    } else {
      // In production, use the CORS proxy approach
      return await fetchPoliceLogMessagesWithCorsProxy(district, municipality);
    }
  } catch (error) {
    console.error("All methods to fetch police log failed:", error);
    return [];
  }
};

// Method using a CORS proxy (works in both development and production)
const fetchPoliceLogMessagesWithCorsProxy = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  try {
    // Use a more reliable CORS proxy
    const corsProxy = "https://corsproxy.io/?"; // Alternative proxies if needed: "https://cors-anywhere.herokuapp.com/"
    const baseUrl = "https://api.politiet.no/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    
    const apiUrl = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    const url = `${corsProxy}${encodeURIComponent(apiUrl)}`;
    
    console.log("Fetching police log via CORS proxy:", apiUrl);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch police log: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    console.log("Police log API response received:", responseData.data?.length || 0, "messages");
    
    return responseData.data || [];
  } catch (error) {
    console.error("Error fetching police log with CORS proxy:", error);
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
