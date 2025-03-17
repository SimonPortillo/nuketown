import { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Slide,
  Grow,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CircleIcon from "@mui/icons-material/Circle";
import { styled } from "@mui/material/styles";
import { PoliceLogMessage } from "../../services/PoliceLogService";

interface PoliceLogCardProps {
  messages: PoliceLogMessage[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const RotatingIcon = styled(NotificationsActiveIcon)(({}) => ({
  animation: "pulse 1.5s infinite",
  "@keyframes pulse": {
    "0%": {
      transform: "scale(1)",
    },
    "50%": {
      transform: "scale(1.1)",
    },
    "100%": {
      transform: "scale(1)",
    },
  },
  color: "#0066ff",
}));

// Fixed ActiveIcon styling to ensure it shows as glowing red
const ActiveIcon = styled(CircleIcon)({
  fontSize: 12,
  color: "#ff3d00",
  animation: "glow 1.5s infinite alternate",
  "@keyframes glow": {
    "0%": {
      filter: "drop-shadow(0 0 2px rgba(255, 61, 0, 0.7))",
    },
    "100%": {
      filter: "drop-shadow(0 0 6px rgba(255, 61, 0, 1))",
    },
  },
});

// Custom scrollbar style component
const ScrollableBox = styled(Box)({
  overflow: "auto",
  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "rgba(30, 30, 30, 0.5)",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(0, 102, 255, 0.5)",
    borderRadius: "4px",
    "&:hover": {
      backgroundColor: "rgba(0, 102, 255, 0.7)",
    },
  },
  // Firefox scrollbar styles
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0, 102, 255, 0.5) rgba(30, 30, 30, 0.5)",
});

const PoliceLogCard = ({
  messages,
  isLoading,
  error,
  onClose,
}: PoliceLogCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<PoliceLogMessage[]>(
    []
  );
  const [mounted, setMounted] = useState(false);

  // Update visible messages when expanded state changes or messages change
  useEffect(() => {
    setVisibleMessages(expanded ? messages : messages.slice(0, 5));
  }, [expanded, messages]);

  // Mount animation effect
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const toggleExpansion = () => {
    setExpanded(!expanded);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Slide
      direction="left"
      in={mounted}
      mountOnEnter
      unmountOnExit
      timeout={300}
    >
      <Card
        sx={{
          position: "absolute",
          right: "50px",
          top: "10px",
          zIndex: 1,
          backgroundColor: "rgba(38, 38, 38, 0.95)",
          color: "white",
          borderRadius: "12px",
          maxWidth: "400px",
          width: "100%",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
          maxHeight: expanded ? "70vh" : "auto",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RotatingIcon />
            <Typography variant="h6">Politiloggen</Typography>
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": { color: "#0066ff" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <ScrollableBox
          sx={{
            maxHeight: expanded ? "calc(70vh - 60px)" : "300px",
            transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress size={40} sx={{ color: "#0066ff" }} />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ p: 2 }}>
              {error}
            </Typography>
          ) : messages.length === 0 ? (
            <Typography sx={{ p: 2, color: "rgba(255, 255, 255, 0.7)" }}>
              Ingen nylige meldinger fra politiet i ditt område.
            </Typography>
          ) : (
            <List>
              {visibleMessages.map((message, index) => (
                <Grow
                  key={message.id}
                  in={true}
                  style={{ transformOrigin: "0 0 0" }}
                  timeout={300 + index * 100}
                >
                  <Box>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              sx={{ fontWeight: 500, color: "#0066ff" }}
                            >
                              {message.category}
                            </Typography>
                            {message.isActive && (
                              <Chip
                                icon={<ActiveIcon />}
                                label="Aktiv"
                                size="small"
                                sx={{
                                  color: "white",
                                  backgroundColor: "rgba(255, 61, 0, 0.15)",
                                  border: "1px solid rgba(255, 61, 0, 0.3)",
                                  height: 24,
                                  "& .MuiChip-icon": {
                                    marginLeft: "8px",
                                    color: "#ff3d00", // Explicitly setting the icon color to ensure it's red
                                  },
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography
                              component="span"
                              sx={{
                                display: "block",
                                color: "rgba(255, 255, 255, 0.9)",
                                mt: 1,
                              }}
                            >
                              {message.text}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mt: 1,
                                color: "rgba(255, 255, 255, 0.6)",
                                fontSize: "0.8rem",
                              }}
                            >
                              <Typography variant="caption">
                                {message.area ||
                                  `${message.municipality}, ${message.district}`}
                              </Typography>
                              <Typography variant="caption">
                                {formatDate(message.createdOn)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < visibleMessages.length - 1 && (
                      <Divider
                        sx={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      />
                    )}
                  </Box>
                </Grow>
              ))}
            </List>
          )}
        </ScrollableBox>

        {messages.length > 5 && (
          <Box
            sx={{
              p: 1,
              display: "flex",
              justifyContent: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(30, 30, 30, 0.5)",
            }}
          >
            <IconButton onClick={toggleExpansion} sx={{ color: "#0066ff" }}>
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        )}
      </Card>
    </Slide>
  );
};

export default PoliceLogCard;
