import { Typography, Box, Button } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHospital } from "@fortawesome/free-solid-svg-icons";
import BasePopup from "./BasePopup";

interface Hospital {
  id: number;
  name: string;
  phone?: string;
  lon: number;
  lat: number;
}

interface HospitalPopupProps {
  hospital: Hospital;
  onClose: () => void;
  userLocation?: [number, number];
  onGetRoute?: (lon: number, lat: number) => void;
}

const HospitalPopup = ({
  hospital,
  onClose,
  userLocation,
  onGetRoute,
}: HospitalPopupProps) => {
  return (
    <BasePopup
      longitude={hospital.lon}
      latitude={hospital.lat}
      onClose={onClose}
      hoverColor="#ff0000"
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <FontAwesomeIcon
          icon={faHospital}
          style={{ color: "#ff0000", fontSize: "24px" }}
        />
        <Typography variant="h6" sx={{ color: "white" }}>
          {hospital.name}
        </Typography>
      </Box>

      {hospital.phone && (
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
            <Typography variant="body1" sx={{ color: "#ff0000" }}>
              {hospital.phone}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <LocationOnIcon sx={{ color: "#ff0000", fontSize: 24 }} />
        <Box>
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
            Koordinater
          </Typography>
          <Typography variant="body2" sx={{ color: "#ff0000" }}>
            {hospital.lat.toFixed(6)}, {hospital.lon.toFixed(6)}
          </Typography>
        </Box>
      </Box>
      {userLocation && onGetRoute && (
        <Button
          variant="contained"
          onClick={() => onGetRoute(hospital.lon, hospital.lat)}
          sx={{
            mt: 2,
            backgroundColor: "#ff0000",
            "&:hover": {
              backgroundColor: "#cc0000",
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

export default HospitalPopup;
