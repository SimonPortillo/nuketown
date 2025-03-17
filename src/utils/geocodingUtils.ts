interface GeocodingResult {
  district?: string;
  municipality?: string;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodingResult> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "NukeTown Emergency Map Application"
      }
    });
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    const data = await response.json();
    console.log("Geocoding response:", data);
    
    const county = data.address?.county || "";
    const municipality = data.address?.municipality || data.address?.city || "";
    
    const mappedDistrict = mapToPoliceDistrict(county);
    console.log(`Mapped district: ${county} -> ${mappedDistrict}`);
    
    return { 
      district: mappedDistrict,
      municipality 
    };
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return {};
  }
};

const mapToPoliceDistrict = (county: string): string => {
  // Updated mapping using exact names expected by the API
  const districtMapping: Record<string, string> = {
    // Direct mappings
    "Oslo": "Oslo",
    "Viken": "Øst",
    "Innlandet": "Innlandet",
    "Agder": "Agder",
    "Vestland": "Vest",
    "Trøndelag": "Trøndelag",
    "Nordland": "Nordland",

    // Names that need format correction
    "Vestfold og Telemark": "SørØst",
    "Telemark": "SørØst",
    "Vestfold": "SørØst",
    "Buskerud": "SørØst",
    "Rogaland": "SørVest",
    "Møre og Romsdal": "MøreOgRomsdal",
    
    // Northern counties
    "Troms": "Troms",
    "Finnmark": "Finnmark",
    "Troms og Finnmark": "Troms" // Default to Troms when combined
  };
  
  // Try to match with the exact county name
  if (districtMapping[county]) {
    return districtMapping[county];
  }
  
  // If not found, try to find a partial match
  for (const [key, value] of Object.entries(districtMapping)) {
    if (county.includes(key)) {
      return value;
    }
  }
  
  // If all else fails, return the original county name
  console.warn(`Could not map county ${county} to police district, using as-is.`);
  return county;
};
