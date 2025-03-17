import { Card, Typography, Box } from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import MyLocationIcon from "@mui/icons-material/MyLocation";

interface DistanceInfoCardProps {
  distanceToShelter: number | null;
}

const DistanceInfoCard = ({ distanceToShelter }: DistanceInfoCardProps) => {
  return (
    <Card
      sx={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 1,
        backgroundColor: "rgba(38, 38, 38, 0.95)",
        color: "white",
        padding: "16px",
        borderRadius: "12px",
        minWidth: "200px",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      {distanceToShelter !== null ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <DirectionsWalkIcon sx={{ color: "#ffc400", fontSize: 24 }} />
          <Box>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Avstand til tilfluktsrom
            </Typography>
            <Typography variant="h6" sx={{ color: "#ffc400" }}>
              {distanceToShelter.toFixed(2)} km
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <MyLocationIcon sx={{ color: "#ffc400", fontSize: 24 }} />
          <Typography variant="body1">Finner din posisjon...</Typography>
        </Box>
      )}
    </Card>
  );
};

export default DistanceInfoCard;
