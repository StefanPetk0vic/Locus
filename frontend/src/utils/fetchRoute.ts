
export type LatLng = { latitude: number; longitude: number };
export interface RouteResult {
  coordinates: LatLng[];  
  distanceMeters: number;
}
export async function fetchRoute(
  origin: { latitude: number; longitude: number },
  destination: { lat: number; lng: number },
): Promise<RouteResult> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes?.length) {
      console.warn('[fetchRoute] OSRM returned no routes', json.code);
      return { coordinates: [], distanceMeters: 0 };
    }
    const route = json.routes[0];
    const coords: [number, number][] = route.geometry.coordinates;    
    const coordinates = coords.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
    return { coordinates, distanceMeters: route.distance ?? 0 };
  } catch (err) {
    console.warn('[fetchRoute] Error fetching route', err);
    return { coordinates: [], distanceMeters: 0 };
  }
}
export function calculatePrice(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  return Math.round(150 + 100 * km);
}
