import { TileLayer } from "react-leaflet";
import { useTheme } from "@/features/theme/theme-context";
import { MAP_TILES } from "@/lib/map-constants";

export function ThemedTileLayer() {
  const { resolved } = useTheme();
  const tiles = MAP_TILES[resolved];
  return (
    <TileLayer
      key={resolved}
      attribution={tiles.attribution}
      url={tiles.url}
      {...("subdomains" in tiles ? { subdomains: tiles.subdomains } : {})}
    />
  );
}
