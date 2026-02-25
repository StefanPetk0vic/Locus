const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

const cache = new Map<string, string>();

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    });

    const resp = await fetch(`${NOMINATIM_REVERSE}?${params.toString()}`, {
      headers: { 'User-Agent': 'LocusApp/1.0' },
    });
    const data = await resp.json();

    if (data.error) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const addr = data.address || {};
    const parts: string[] = [];

    if (addr.road) parts.push(addr.road);
    if (addr.house_number) parts[parts.length - 1] += ` ${addr.house_number}`;
    if (addr.suburb) parts.push(addr.suburb);
    if (addr.city || addr.town || addr.village) {
      parts.push(addr.city || addr.town || addr.village);
    }

    const label = parts.length > 0 ? parts.join(', ') : data.display_name?.split(',').slice(0, 2).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    cache.set(key, label);
    return label;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
