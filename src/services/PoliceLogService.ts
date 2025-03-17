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

export const fetchPoliceLogMessages = async (
  district?: string,
  municipality?: string,
): Promise<PoliceLogMessage[]> => {
  try {
    // Use a CORS proxy to avoid the CORS issue
    const corsProxy = "https://corsproxy.io/?";
    const baseUrl = "https://api.politiet.no/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    // Don't filter by IsActive to get both active and inactive messages
    
    const apiUrl = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    const url = `${corsProxy}${encodeURIComponent(apiUrl)}`;
    
    console.log("Fetching police log from:", apiUrl);
    
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
    console.log("Police log API response:", responseData);
    
    // The API returns data in the data field of the response
    return responseData.data || [];
  } catch (error) {
    console.error("Error fetching police log:", error);
    return [];
  }
};

// Alternative proxy method using server proxy configuration
export const fetchPoliceLogMessagesWithProxy = async (
  district?: string,
  municipality?: string,
): Promise<PoliceLogMessage[]> => {
  try {
    // Use the /api prefix which is configured to be proxied in vite.config.js
    const baseUrl = "/api/politiloggen/v1/messages";
    const params = new URLSearchParams();
    if (district) params.append("Districts", district);
    if (municipality) params.append("Municipalities", municipality);
    // Don't filter by IsActive to get both active and inactive messages
    
    const url = `${baseUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log("Fetching police log from (via proxy):", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch police log: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    console.log("Police log API response:", responseData);
    
    // The API returns data in the data field of the response
    return responseData.data || [];
  } catch (error) {
    console.error("Error fetching police log:", error);
    return [];
  }
};
