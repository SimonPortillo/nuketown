import { useState } from "react";
import { Typography, Box, Button, Collapse } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import CoverageIcon from "@mui/icons-material/GroupsRounded";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  const [expanded, setExpanded] = useState(false);

  return (
    <BasePopup
      longitude={shelter.longitude}
      latitude={shelter.latitude}
      onClose={onClose}
      hoverColor="#ffc400"
    >
      {/* Always show the address section */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <HomeIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: "white" }}>
          {shelter.address}
        </Typography>
      </Box>

      {/* Always show the capacity section */}
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

      {/* Always show the coverage ratio bar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <CoverageIcon sx={{ color: "#ffc400", fontSize: 24 }} />
        <Box sx={{ width: "100%" }}>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Områdedekning
          </Typography>
          {shelter.population ? (
            <>
              <Collapse in={!expanded} timeout={500}>
                <Box
                  sx={{
                    width: "100%",
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderRadius: 1,
                    mb: 0.5,
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
              </Collapse>

              <Collapse in={expanded} timeout={500}>
                <Box sx={{ width: "100%" }}>
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
                    <Typography
                      variant="body2"
                      color="rgba(255, 255, 255, 0.7)"
                    >
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
                </Box>
              </Collapse>

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

      {/* Expand/Collapse Button */}
      <Button
        fullWidth
        onClick={() => setExpanded(!expanded)}
        sx={{
          color: "rgba(255, 255, 255, 0.8)",
          mb: expanded ? 2 : 0,
          borderColor: "rgba(255, 196, 0, 0.5)",
          borderWidth: 1,
          borderStyle: "solid",
          "&:hover": {
            borderColor: "#ffc400",
            backgroundColor: "rgba(255, 196, 0, 0.1)",
          },
          transition: "margin-bottom 0.3s ease",
        }}
        endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      >
        {expanded ? "Vis mindre" : "Vis mer"}
      </Button>

      <Collapse in={expanded} timeout={500}>
        <>
          {/* Distance section */}
          {distanceToShelter && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
                mt: 2,
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

          {/* Coordinates section */}
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
        </>
      </Collapse>
    </BasePopup>
  );
};

export default ShelterPopup;
