import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface CreateMapIconOptions {
  icon: IconDefinition;
  fillColor?: string;
  scale?: number;
  translateX?: number;
  translateY?: number;
}

/**
 * Creates a map icon from a FontAwesome icon
 */
export const createMapIcon = (
  mapInstance: maplibregl.Map,
  iconId: string,
  options: CreateMapIconOptions
): Promise<void> => {
  const {
    icon,
    fillColor = "#FFFFFF",
    scale = 0.65,
    translateX = 150,
    translateY = 150,
  } = options;

  return new Promise((resolve) => {
    // Skip if the icon already exists
    if (mapInstance.hasImage(iconId)) {
      resolve();
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      if (!mapInstance.hasImage(iconId)) {
        mapInstance.addImage(iconId, img);
      }
      resolve();
    };

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 512 512">
        <path fill="${fillColor}" d="${icon.icon[4]}" transform="scale(${scale}) translate(${translateX}, ${translateY})"/>
      </svg>
    `;
    
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    img.src = URL.createObjectURL(blob);
  });
};
