"use client";

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
} from "@mui/material";
import { useInView } from "react-intersection-observer";
import LocationOnIcon from "@mui/icons-material/LocationOnRounded";
import SecurityIcon from "@mui/icons-material/SecurityRounded";
import SpeedIcon from "@mui/icons-material/SpeedRounded";
import InfoIcon from "@mui/icons-material/InfoRounded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CheckIcon from "@mui/icons-material/CheckRounded";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { styled } from "@mui/material/styles";
import { Info } from "@mui/icons-material";

const FadeInSection: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <Fade in={inView} timeout={1000}>
      <div ref={ref}>{children}</div>
    </Fade>
  );
};

const PulseButton = styled(Button)(({}) => ({
  "@keyframes pulse": {
    "0%": {
      boxShadow: "0 0 0 0 rgba(255, 196, 0, 0.4)",
    },
    "70%": {
      boxShadow: "0 0 0 15px rgba(156, 39, 176, 0)",
    },
    "100%": {
      boxShadow: "0 0 0 0 rgba(156, 39, 176, 0)",
    },
  },
  animation: "pulse 2s infinite",
  "&:hover": {
    animation: "none",
  },
}));

const LandingPage: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const firstSectionRef = useRef<HTMLDivElement>(null);

  const scrollToFirstSection = () => {
    firstSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFindShelter = () => {
    setLoading(true);
    // Simulating API call
    setTimeout(() => {
      setLoading(false);
      navigate("/map");
    }, 1000);
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <>
      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100%",
          color: "white",
          pt: 12,
          pb: 10,
          mb: 12,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "url(/assets/hero.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.7) blur(2px)",
            zIndex: -2,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: -1,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <FadeInSection>
            <Box sx={{ my: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    fontSize: { xs: "2.5rem", md: "4rem" },
                    color: "#ffc400",
                  }}
                >
                  <FontAwesomeIcon icon="radiation" />
                </Box>
                <Typography
                  variant="h1"
                  component="h1"
                  align="center"
                  sx={{
                    color: "white",
                    fontSize: { xs: "2.5rem", md: "4rem" },
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                    fontWeight: "bold",
                  }}
                >
                  <Box component="span" sx={{ color: "#ffc400" }}>
                    NukeTown
                  </Box>{" "}
                  <Box component="span">Tilfluktsromfinner</Box>
                </Typography>
              </Box>
              <Typography
                variant="h5"
                align="center"
                paragraph
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: { xs: "1.2rem", md: "1.5rem" },
                  mb: 4,
                  mt: 5,
                }}
              >
                Din livslinje i krisetider. Finn nærmeste tilfluktsrom raskt og
                effektivt.
              </Typography>
              <Box
                sx={{
                  mt: 8,
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <PulseButton
                  variant="contained"
                  color="secondary"
                  size="large"
                  startIcon={<LocationOnIcon />}
                  onClick={handleFindShelter}
                  disabled={loading}
                  sx={{
                    py: 2,
                    px: 6,
                    fontSize: "1.2rem",
                    backgroundColor: "#ffc400",
                    color: "#000",
                    "&:hover": {
                      backgroundColor: "#ffcd38",
                    },
                  }}
                >
                  Finn nærmeste tilfluktsrom
                </PulseButton>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    py: 2,
                    px: 6,
                    fontSize: "1.2rem",
                    color: "white",
                    borderColor: "white",
                    "&:hover": {
                      borderColor: "#ffc400",
                      color: "#ffc400",
                    },
                  }}
                  onClick={scrollToFirstSection}
                >
                  Les mer
                </Button>
              </Box>
              {loading && <LinearProgress sx={{ mt: 4 }} color="secondary" />}
            </Box>
          </FadeInSection>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <FadeInSection>
          <Box ref={firstSectionRef} sx={{ my: 8 }}>
            <Typography
              variant="h2"
              align="center"
              color="primary"
              gutterBottom
            >
              {" "}
              <Box component="span">
                Hvorfor velge{" "}
                <Box component="span" sx={{ color: "#ffc400" }}>
                  NukeTown
                </Box>{" "}
                Tilfluktsromfinner?
              </Box>
            </Typography>
            <Grid container spacing={4} sx={{ mt: 2 }}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5" component="div" sx={{ mt: 2 }}>
                      Sikkerhet først
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vi prioriterer din sikkerhet ved å gi oppdatert
                      informasjon om tilfluktsrom.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <SpeedIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5" component="div" sx={{ mt: 2 }}>
                      Rask respons
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Appen vår finner raskt nærmeste tilfluktsrom og sparer
                      verdifull tid i nødsituasjoner.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <InfoIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5" component="div" sx={{ mt: 2 }}>
                      Pålitelig informasjon
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vi gir nøyaktig og oppdatert informasjon om
                      tilfluktsrommenes plassering og kapasitet.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </FadeInSection>

        <FadeInSection>
          <Box sx={{ my: 8 }}>
            <Typography
              variant="h2"
              align="center"
              color="primary"
              gutterBottom
            >
              Slik fungerer det
            </Typography>
            <Paper elevation={2} sx={{ p: 4, mt: 4 }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="1. Åpne appen"
                    secondary="Start NukeTown Tilfluktsromfinner på enheten din."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="2. Gi tilgang til posisjon"
                    secondary="Aktiver GPS for nøyaktige anbefalinger."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="3. Finn nærmeste tilfluktsrom"
                    secondary="Trykk på 'Finn nærmeste tilfluktsrom' for å se alternativene."
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="4. Følg veibeskrivelsen"
                    secondary="Få navigasjon til valgt tilfluktsrom."
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </FadeInSection>

        <FadeInSection>
          <Box sx={{ my: 8, textAlign: "center" }}>
            <Typography variant="h2" color="primary" gutterBottom>
              Vær forberedt, hold deg trygg
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Ikke vent til det oppstår en krise. Last ned NukeTown
              Tilfluktsromfinner nå.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              sx={{ mt: 2, py: 1.5, px: 4, fontSize: "1.1rem" }}
            >
              Prøv gratis nå
            </Button>
          </Box>
        </FadeInSection>

        <FadeInSection>
          <Box sx={{ my: 8 }}>
            <Alert severity="info" icon={<Info />} sx={{ mb: 2 }}>
              <Typography variant="h6" component="div" gutterBottom>
                Vær forberedt!
              </Typography>
              <Typography variant="body1">
                Ved en atomulykke er det avgjørende å vite hvor nærmeste
                tilfluktsrom er. Appen vår bruker GPS-posisjonen din for raskt å
                guide deg til sikkerhet. Husk å holde deg informert og følg
                offisielle retningslinjer.
              </Typography>
            </Alert>
          </Box>
        </FadeInSection>

        <FadeInSection>
          <Box sx={{ my: 8 }}>
            <Typography
              variant="h2"
              align="center"
              color="primary"
              gutterBottom
            >
              Velg din sikkerhetsplan
            </Typography>
            <Typography
              variant="h5"
              align="center"
              color="text.secondary"
              paragraph
            >
              Velg den planen som passer best for dine behov
            </Typography>
            <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                      Basic
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      Gratis
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Finn nærmeste tilfluktsrom" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Grunnleggende navigasjon" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Beredskapsvarsler" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button variant="outlined" color="primary" fullWidth>
                      Kom i gang
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "2px solid",
                    borderColor: "secondary.main",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                      Premium
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      49 kr/mnd
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Alle Basic-funksjoner" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Offline kart" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Sanntidsoppdateringer" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Familiedeling av posisjon" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button
                      variant="contained"
                      color="secondary"
                      fullWidth
                      href="https://paypal.me/SimonPortillo03NO?country.x=NO&locale.x=no_NO"
                    >
                      Abonner nå
                    </Button>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" component="div" gutterBottom>
                      Bedrift
                    </Typography>
                    <Typography variant="h3" color="primary" gutterBottom>
                      Tilpasset
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Alle Premium-funksjoner" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Skreddersydd integrasjon" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Døgnåpen support" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <CheckIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary="Dedikert kontaktperson" />
                      </ListItem>
                    </List>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <Button variant="outlined" color="primary" fullWidth>
                      Ta kontakt
                    </Button>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </FadeInSection>
      </Container>

      <Box component="footer" sx={{ bgcolor: "background.paper", py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" gutterBottom>
            NukeTown Tilfluktsromfinner
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            component="p"
          >
            Hjelper deg å holde deg trygg i krisetider.
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {"© "}
            Gruppe 14 ved UiA {new Date().getFullYear()}
            {"."}
          </Typography>
        </Container>
      </Box>
    </>
  );
};

export default LandingPage;
