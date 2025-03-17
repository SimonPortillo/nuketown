import { Fab, Tooltip, Badge, Zoom } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";

interface PoliceLogButtonProps {
  onClick: () => void;
  messageCount: number;
}

const StyledFab = styled(Fab)(({ }) => ({
  position: "absolute",
  right: "50px",
  top: "10px",
  backgroundColor: "rgba(38, 38, 38, 0.8)",
  color: "#0066ff",
  "&:hover": {
    backgroundColor: "rgba(38, 38, 38, 0.95)",
    transform: "scale(1.05)",
  },
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  zIndex: 10,
  transition: "all 0.2s ease-in-out",
}));

const StyledBadge = styled(Badge)({
  ".MuiBadge-badge": {
    animation: "pulse-badge 1.5s infinite alternate",
  },
  "@keyframes pulse-badge": {
    "0%": {
      boxShadow: "0 0 0 0 rgba(255, 0, 0, 0.4)",
    },
    "100%": {
      boxShadow: "0 0 0 4px rgba(255, 0, 0, 0)",
    },
  },
});

const PoliceLogButton = ({ onClick, messageCount }: PoliceLogButtonProps) => {
  // Add animation delay on mount
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Zoom in={visible} timeout={500}>
      <Tooltip title="Vis politiloggen" placement="left">
        <StyledFab size="medium" onClick={onClick}>
          <StyledBadge badgeContent={messageCount} color="error" max={99}>
            <NotificationsIcon />
          </StyledBadge>
        </StyledFab>
      </Tooltip>
    </Zoom>
  );
};

export default PoliceLogButton;
