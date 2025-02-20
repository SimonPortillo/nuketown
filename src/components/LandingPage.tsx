"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Container, Typography, Paper, Grid, LinearProgress, Alert } from "@mui/material"
import WarningIcon from "@mui/icons-material/Warning"
import LocationOnIcon from "@mui/icons-material/LocationOn"

const LandingPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false)
  const navigate = useNavigate()

  const handleFindShelter = () => {
    setLoading(true)
    // Simulating API call
    setTimeout(() => {
      setLoading(false)
      navigate("/map")
    }, 2000)
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom align="center" color="primary" sx={{ mb: 4 }}>
          NukeTown Shelter Finder
        </Typography>
        <Paper elevation={2} sx={{ p: 4, mt: 4, backgroundColor: "background.paper" }}>
          <Grid container spacing={3} alignItems="center" justifyContent="center">
            <Grid item xs={12}>
              <Typography variant="h5" align="center" gutterBottom color="text.secondary">
                Find the Closest Emergency Shelter
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8} md={6}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                startIcon={<LocationOnIcon />}
                fullWidth
                onClick={handleFindShelter}
                disabled={loading}
                sx={{ py: 1.5, fontSize: "1.1rem" }}
              >
                Locate Nearest Shelter
              </Button>
            </Grid>
          </Grid>
          {loading && <LinearProgress sx={{ mt: 3 }} color="secondary" />}
        </Paper>
        <Box sx={{ mt: 4 }}>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <Typography variant="h6" component="div" gutterBottom>
              Be Prepared
            </Typography>
            <Typography variant="body1">
              In case of a nuclear emergency, it's crucial to know where the nearest shelter is located. Our app uses
              your GPS location to quickly guide you to safety.
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  )
}

export default LandingPage

