import { ReactNode } from "react";
import { Card, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Popup } from "react-map-gl/maplibre";

interface BasePopupProps {
  longitude: number;
  latitude: number;
  onClose: () => void;
  children: ReactNode;
  hoverColor: string;
}

const BasePopup = ({
  longitude,
  latitude,
  onClose,
  children,
  hoverColor,
}: BasePopupProps) => {
  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      className="custom-popup"
    >
      <Card
        sx={{
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          minWidth: "250px",
          position: "relative",
        }}
      >
        <Box
          onClick={onClose}
          sx={{
            position: "absolute",
            right: "8px",
            top: "8px",
            cursor: "pointer",
            color: "rgba(255, 255, 255, 0.7)",
            "&:hover": {
              color: hoverColor,
            },
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </Box>
        <Box sx={{ p: 2 }}>{children}</Box>
      </Card>
    </Popup>
  );
};

export default BasePopup;
