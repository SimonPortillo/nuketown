/**
 * Calculates the distance between two points using the Haversine formula
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Calculates the walking time between two points in minutes
 * Assumes average walking speed of 5 km/h
 */
export const calculateWalkTime = (distanceInKm: number): number => {
  return (distanceInKm / 5) * 60; // 5 km/h walking speed
};

/**
 * Finds the closest shelter to a given location
 */
export const findClosestShelter = (
  userLat: number,
  userLon: number,
  shelters: any
) => {
  if (!shelters?.features) return null;

  let closestShelter: any = null;
  let minDistance = Infinity;

  shelters.features.forEach((shelter: any) => {
    const shelterCoords = shelter.geometry.coordinates;
    const distance = calculateDistance(
      userLat,
      userLon,
      shelterCoords[1],
      shelterCoords[0]
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestShelter = shelter;
    }
  });

  return closestShelter;
};

/**
 * Fetches a walking route between two points using MapBox API
 */
export const getRouteData = async (
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number,
  mapboxToken: string
): Promise<any> => {
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${startLon},${startLat};${endLon},${endLat}?steps=true&geometries=geojson&access_token=${mapboxToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry;
    }
    return null;
  } catch (error) {
    console.error("Error fetching route:", error);
    return null;
  }
};
