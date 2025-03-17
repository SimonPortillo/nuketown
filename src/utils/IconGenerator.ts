import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * Generate an SVG URL for a Font Awesome icon
 */
export const generateSvgUrl = (
  icon: IconDefinition,
  fillColor: string = "#000000",
  scale: number = 0.8,
  translateX: number = 51.2,
  translateY: number = 51.2
): string => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
      <path fill="${fillColor}" d="${icon.icon[4]}" transform="scale(${scale}) translate(${translateX}, ${translateY})"/>
    </svg>
  `;
  
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  return URL.createObjectURL(blob);
};

/**
 * Load an SVG icon into the map
 */
export const loadIconToMap = (
  map: maplibregl.Map,
  iconName: string,
  icon: IconDefinition,
  fillColor: string = "#000000",
  scale: number = 0.8,
  translateX: number = 51.2,
  translateY: number = 51.2
): void => {
  if (map.hasImage(iconName)) return;
  
  const img = new Image();
  img.onload = () => {
    if (!map.hasImage(iconName)) {
      map.addImage(iconName, img);
    }
  };
  
  img.src = generateSvgUrl(icon, fillColor, scale, translateX, translateY);
};
