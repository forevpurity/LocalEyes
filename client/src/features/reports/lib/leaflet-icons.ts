import L from "leaflet";

/**
 * Creates a blue droplet pin icon for marking a user's selected report location.
 * The SVG uses a 24×24 viewBox; the rendered size is controlled by the
 * `size` parameter (default 36px).
 */
export function createPinIcon(size = 36): L.DivIcon {
  const half = size / 2;
  return L.divIcon({
    className: "",
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="#0052cc" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [half, size],
    popupAnchor: [0, -size],
  });
}
