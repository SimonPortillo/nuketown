import { Typography, Box } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import BasePopup from "./BasePopup";

interface ShelterPoint {
  longitude: number;
  latitude: number;
  address: string;
  capacity: number;
  population?: number;
  coverage_ratio?: number;
}

interface ShelterPopupProps {
  shelter: ShelterPoint;
  onClose: () => void;
  distanceToShelter?: number | null;
  walkTime?: string | null;
}

const ShelterPopup = ({
  shelter,
  onClose,
  distanceToShelter,
  walkTime,
}: ShelterPopupProps) => {
  return (
    <BasePopup
      longitude={shelter.longitude}
      latitude={shelter.latitude}
      onClose={onClose}
      hoverColor="#ffc400"
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <HomeIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: "white" }}>
          {shelter.address}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <PeopleIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Box>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Kapasitet
          </Typography>
          <Typography variant="body1" sx={{ color: "#ffc400" }}>
            {shelter.capacity} plasser
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <PeopleIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Box sx={{ width: "100%" }}>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Områdedekning
          </Typography>
          {shelter.population ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 0.5,
                }}
              >
                <Typography variant="body1" sx={{ color: "#ffc400" }}>
                  {shelter.coverage_ratio?.toFixed(1)}% dekning
                </Typography>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                  {shelter.population.toLocaleString()} personer i området
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(shelter.coverage_ratio ?? 0, 100)}%`,
                    height: 8,
                    borderRadius: 1,
                    bgcolor:
                      (shelter.coverage_ratio ?? 0) >= 100
                        ? "#4caf50"
                        : (shelter.coverage_ratio ?? 0) >= 50
                        ? "#ffc400"
                        : "#f44336",
                    transition: "width 0.5s ease-in-out",
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color:
                    (shelter.coverage_ratio ?? 0) >= 100
                      ? "#4caf50"
                      : (shelter.coverage_ratio ?? 0) >= 50
                      ? "#ffc400"
                      : "#f44336",
                  mt: 0.5,
                }}
              >
                {(shelter.coverage_ratio ?? 0) >= 100
                  ? "God dekning"
                  : (shelter.coverage_ratio ?? 0) >= 50
                  ? "Begrenset dekning"
                  : "Kritisk underdekning"}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Ingen befolkningsdata tilgjengelig
            </Typography>
          )}
        </Box>
      </Box>

      {distanceToShelter && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <DirectionsWalkIcon sx={{ color: "#ffc400", fontSize: 24 }} />
          <Box>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Avstand
            </Typography>
            <Typography variant="body1" sx={{ color: "#ffc400" }}>
              {distanceToShelter.toFixed(2)} km
            </Typography>
            <Typography variant="body1" sx={{ color: "#ffc400" }}>
              Estimert gange: {walkTime} min
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <LocationOnIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Box>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Koordinater
          </Typography>
          <Typography variant="body2" sx={{ color: "#ffc400" }}>
            {shelter.latitude.toFixed(6)}, {shelter.longitude.toFixed(6)}
          </Typography>
        </Box>
      </Box>
    </BasePopup>
  );
};

export default ShelterPopup;
