import { Card, Switch, FormControlLabel, Box } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandcuffs,
  faCube,
  faRoad,
  faHospital,
} from "@fortawesome/free-solid-svg-icons";

interface MapControlsProps {
  showControls: boolean;
  showPoliceStations: boolean;
  setShowPoliceStations: (show: boolean) => void;
  is3DMode: boolean;
  setIs3DMode: (enabled: boolean) => void;
  showRoads: boolean;
  setShowRoads: (show: boolean) => void;
  showHospitals: boolean;
  setShowHospitals: (show: boolean) => void;
}

const MapControls = ({
  showControls,
  showPoliceStations,
  setShowPoliceStations,
  is3DMode,
  setIs3DMode,
  showRoads,
  setShowRoads,
  showHospitals,
  setShowHospitals,
}: MapControlsProps) => {
  return (
    <Box
      sx={{
        position: "absolute",
        left: "20px",
        top: "160px",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        opacity: showControls ? 1 : 0,
        transform: showControls ? "translateX(0)" : "translateX(-20px)",
        pointerEvents: showControls ? "auto" : "none",
      }}
    >
      {/* Police stations toggle */}
      <Card
        sx={{
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "11px",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={showPoliceStations}
              onChange={(e) => setShowPoliceStations(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#0066ff",
                  "&:hover": {
                    backgroundColor: "rgba(0, 102, 255, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#0066ff",
                },
              }}
            />
          }
          label={
            <FontAwesomeIcon
              icon={faHandcuffs}
              style={{
                color: showPoliceStations
                  ? "#0066ff"
                  : "rgba(255, 255, 255, 0.7)",
                transition: "color 0.3s ease",
                fontSize: "1.2rem",
              }}
            />
          }
        />
      </Card>

      {/* 3D Mode toggle */}
      <Card
        sx={{
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "11px",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={is3DMode}
              onChange={(e) => setIs3DMode(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#4caf50",
                  "&:hover": {
                    backgroundColor: "rgba(76, 175, 80, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#4caf50",
                },
              }}
            />
          }
          label={
            <FontAwesomeIcon
              icon={faCube}
              style={{
                color: is3DMode ? "#4caf50" : "rgba(255, 255, 255, 0.7)",
                transition: "color 0.3s ease",
                fontSize: "1.2rem",
              }}
            />
          }
        />
      </Card>

      {/* Roads toggle */}
      <Card
        sx={{
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "11px",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={showRoads}
              onChange={(e) => setShowRoads(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#ff9800",
                  "&:hover": {
                    backgroundColor: "rgba(255, 152, 0, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#ff9800",
                },
              }}
            />
          }
          label={
            <FontAwesomeIcon
              icon={faRoad}
              style={{
                color: showRoads ? "#ff9800" : "rgba(255, 255, 255, 0.7)",
                transition: "color 0.3s ease",
                fontSize: "1.2rem",
              }}
            />
          }
        />
      </Card>

      {/* Hospitals toggle */}
      <Card
        sx={{
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          padding: "11px",
          borderRadius: "12px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={showHospitals}
              onChange={(e) => setShowHospitals(e.target.checked)}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#ff0000",
                  "&:hover": {
                    backgroundColor: "rgba(255, 0, 0, 0.08)",
                  },
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#ff0000",
                },
              }}
            />
          }
          label={
            <FontAwesomeIcon
              icon={faHospital}
              style={{
                color: showHospitals ? "#ff0000" : "rgba(255, 255, 255, 0.7)",
                transition: "color 0.3s ease",
                fontSize: "1.2rem",
              }}
            />
          }
        />
      </Card>
    </Box>
  );
};

export default MapControls;
