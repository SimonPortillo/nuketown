import { Typography, Box, Button } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import BasePopup from "./BasePopup";

interface PoliceStation {
  id: number;
  name: string;
  phone?: string;
  lon: number;
  lat: number;
}

interface PoliceStationPopupProps {
  policeStation: PoliceStation;
  onClose: () => void;
  userLocation?: [number, number];
  onGetRoute?: (lon: number, lat: number) => void;
}

const PoliceStationPopup = ({
  policeStation,
  onClose,
  userLocation,
  onGetRoute,
}: PoliceStationPopupProps) => {
  return (
    <BasePopup
      longitude={policeStation.lon}
      latitude={policeStation.lat}
      onClose={onClose}
      hoverColor="#0066ff"
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <PeopleIcon sx={{ color: "#0066ff", fontSize: 24 }} />
        <Typography variant="h6" sx={{ color: "white" }}>
          {policeStation.name}
        </Typography>
      </Box>

      {policeStation.phone && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              Telefon
            </Typography>
            <Typography variant="body1" sx={{ color: "#0066ff" }}>
              {policeStation.phone}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <LocationOnIcon sx={{ color: "#0066ff", fontSize: 24 }} />
        <Box>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Koordinater
          </Typography>
          <Typography variant="body2" sx={{ color: "#0066ff" }}>
            {policeStation.lat.toFixed(6)}, {policeStation.lon.toFixed(6)}
          </Typography>
        </Box>
      </Box>
      {userLocation && onGetRoute && (
        <Button
          variant="contained"
          onClick={() => onGetRoute(policeStation.lon, policeStation.lat)}
          sx={{
            mt: 2,
            backgroundColor: "#0066ff",
            "&:hover": {
              backgroundColor: "#0052cc",
            },
            width: "100%",
          }}
        >
          Få veibeskrivelse
        </Button>
      )}
    </BasePopup>
  );
};

export default PoliceStationPopup;
