import L from "leaflet";

export const HCM_CENTER: [number, number] = [10.7769, 106.7009];
export const DEFAULT_ZOOM = 13;

export const HCM_BOUNDS = L.latLngBounds([10.2, 106.2], [11.1, 107.2]);

export const MAP_TILES = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd" as const,
  },
} as const;
