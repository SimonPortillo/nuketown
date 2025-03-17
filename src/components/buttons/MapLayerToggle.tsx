import { Card } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLayerGroup, faXmark } from "@fortawesome/free-solid-svg-icons";

interface MapLayerToggleProps {
  showControls: boolean;
  toggleControls: () => void;
}

const MapLayerToggle = ({
  showControls,
  toggleControls,
}: MapLayerToggleProps) => {
  return (
    <Card
      sx={{
        position: "absolute",
        left: "20px",
        top: "110px",
        zIndex: 2,
        backgroundColor: "rgba(38, 38, 38, 0.95)",
        color: "white",
        padding: "8px",
        borderRadius: "12px",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          backgroundColor: "rgba(58, 58, 58, 0.95)",
        },
      }}
      onClick={toggleControls}
    >
      <FontAwesomeIcon
        icon={showControls ? faXmark : faLayerGroup}
        style={{
          color: "#ffc400",
          fontSize: "1.2rem",
          transition: "transform 0.3s ease",
          marginTop: "4px",
        }}
      />
    </Card>
  );
};

export default MapLayerToggle;
