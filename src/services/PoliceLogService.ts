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
        console.warn("Development proxy failed, falling back to serverless function", error);
        return await fetchPoliceLogWithServerlessFunction(district, municipality);
      }
    } else {
      // In production, use our serverless function
      try {
        return await fetchPoliceLogWithServerlessFunction(district, municipality);
      } catch (error) {
        console.error("Serverless function failed, using fallback data", error);
        return fallbackMockData;
      }
    }
  } catch (error) {
    console.error("All methods to fetch police log failed:", error);
    return fallbackMockData; // Return mock data as a last resort
  }
};

// New method to fetch using our serverless function
const fetchPoliceLogWithServerlessFunction = async (
  district?: string,
  municipality?: string
): Promise<PoliceLogMessage[]> => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (district) params.append("district", district);
    if (municipality) params.append("municipality", municipality);
    
    // Use the serverless function endpoint
    const url = `/api/policeLog${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log("Fetching police log via serverless function:", url);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from serverless function: ${response.statusText}`);
    }
    
    const responseData: PoliceLogResponse = await response.json();
    console.log("Police log API response received:", responseData.data?.length || 0, "messages");
    
    return responseData.data || [];
  } catch (error) {
    console.error("Error fetching police log with serverless function:", error);
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
