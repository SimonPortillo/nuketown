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
  // Using exact names as they appear in the API response
  const districtMapping: Record<string, string> = {
    "Oslo": "Oslo",
    "Viken": "Øst", 
    "Innlandet": "Innlandet",
    "Vestfold og Telemark": "Sør-Øst",
    "Agder": "Agder", // This should match "Agder Politidistrikt" in the API
    "Rogaland": "Sør-Vest",
    "Vestland": "Vest",
    "Møre og Romsdal": "Møre og Romsdal",
    "Trøndelag": "Trøndelag",
    "Nordland": "Nordland",
    "Troms og Finnmark": "Finnmark",
  };
  return districtMapping[county] || county;
};
