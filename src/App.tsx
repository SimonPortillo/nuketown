import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import LandingPage from "./components/LandingPage";
import MapPage from "./components/MapPage";
import { Analytics } from '@vercel/analytics/react';

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2b2d42", // Dark blue-gray for primary actions
    },
    secondary: {
      main: "#ffd100", // Bright yellow for urgency
    },
    background: {
      default: "#f8f9fa", // Light gray background
      paper: "#ffffff", // White for paper elements
    },
    text: {
      primary: "#2b2d42", // Dark blue-gray for primary text
      secondary: "#6c757d", // Medium gray for secondary text
    },
    error: {
      main: "#d90429", // Bright red for errors or critical information
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 500,
      textTransform: "none", // Prevents all-caps buttons
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 20px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Analytics />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
