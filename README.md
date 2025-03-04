# Nuketown - Beredskapskart for Norge

## Om Prosjektet
Nuketown er en interaktiv kartapplikasjon for beredskap som hjelper brukere med å lokalisere og navigere til kritisk infrastruktur under nødsituasjoner. Applikasjonen visualiserer tilfluktsrom, politistasjoner og sykehus i Norge, og gir viktig informasjon om kapasitet, befolkningsdekning og ruteplanlegging.

## Funksjoner
- 🚨 **Tilfluktsrom**: Viser lokasjon og kapasitetsinformasjon med befolkningsanalyse
- 👮 **Politistasjoner**: Viser politistasjoners plassering med kontaktinformasjon
- 🏥 **Sykehus**: Visualiserer sykehusplasseringer med akuttjenesteinformasjon
- 🗺️ **Sanntidsnavigasjon**: Gir gangveibeskrivelser til nærmeste fasiliteter
- 🏗️ **3D-bygningsvisualisering**: Veksle mellom 2D og 3D bygningsvisning
- 🛣️ **Vegnettverk-integrasjon**: Valgfri overlay av detaljert vegnett
- 📱 **Responsivt Design**: Fungerer uavhengig av skjermstørrelse
- 🎯 **Geolokasjon**: Automatisk brukerposisjon og nærmeste fasilitet-finding

## Teknologi Stack
- **Frontend**: React med TypeScript og Vite for en hyppig utviklingsprosess
- **Kartrendering**: MapLibre GL JS for rask og fleksibel rendering av interaktivt kart, med støtte for tilpassede stiler og 3D-visninger.
- **UI-komponenter**: Material-UI (MUI) for moderne og tilgjengelige brukergrensesnitt, med ferdige komponenter og et tilpassbart designsystem.
- **Backend/Database**: Supabase med PostGIS for geografiske data og spørringer.
- **Ruteplanlegging**: Mapbox Directions API for beregning av gangruter basert på sanntidskartdata.
- **Ikoner**: FontAwesome, et omfattende ikonbibliotek som gir enkle og skalerbare vektorikoner for UI-elementer.
- **Styling**: CSS-in-JS med MUI System som muliggjør dynamisk og temabasert styling direkte i TypeScript-koden.

## Datakilder
1. [**Tilfluktsrom**](https://kartkatalog.geonorge.no/metadata/tilfluktsrom-offentlige/dbae9aae-10e7-4b75-8d67-7f0e8828f3d8)
2. [**Befolkningsdata**](https://kartkatalog.geonorge.no/metadata/befolkning-paa-grunnkretsniv/7eb907de-fdaa-4442-a8eb-e4bd06da9ca8?search=befolknign)
3. [**Politistasjoner**](https://overpass-turbo.eu/)
4. [**Sykehus**](https://overpass-turbo.eu/)
5. [**Vegnett**](https://kartkatalog.geonorge.no/metadata/vegnett2-wms/302fcb0e-a7dc-44f4-a336-8c9ee9709d73)
6. *[*Bygningsdata**](https://maplibre.org/maplibre-gl-js/docs/examples/3d-buildings/)

## Analysefunksjoner
- Befolkningsdekning for tilfluktsrom
- Avstandsberegninger med Haversine-formel
- Estimering av gangtid
- Kapasitet vs. befolkningsratio
- Varmekartvisualisering av anleggsdekning

## Installasjon og Oppsett

```bash
# Klon repositoriet
git clone https://github.com/simonportillo/nuketown.git

# Naviger til prosjektmappen
cd nuketown

# Installer avhengigheter
npm install

# Opprett .env fil med API-nøkler
cp .env.example .env

# Start utviklingsserveren
npm run dev
```

## Miljøvariabler
```
VITE_REACT_APP_SUPABASE_URL=din_supabase_url
VITE_REACT_APP_SUPABASE_KEY=din_supabase_nøkkel
VITE_MAPBOX_TOKEN=din_mapbox_token
```

## Prosjektstruktur
```
Kommer etter refact
```

## Implementasjonsdetaljer
Applikasjonen implementerer en fullstack-løsning hvor:
- Romlige data lagres i Supabase med PostGIS-utvidelser
- Frontend bruker MapLibre GL JS for kartrendering
- Sanntids geolokasjons-sporing for brukerposisjon
- Komplekse romlige spørringer for nærmeste fasilitet-søk
- Dynamisk ruteberegning mellom bruker og fasiliteter
- Interaktiv lag-veksling for ulike datavisualiseringer

## Fremtidige Forbedringer
- [ ] Stor refactor
- [ ] Støtte for offline-modus
- [ ] Mer detaljert fasilitetsinfo
- [ ] Integrasjon av sanntids beredskapsvarsler
- [ ] Forbedringer av tilgjengelighet
- [ ] Støtte for flere språk
- [ ] Mobil app-versjon

## Link til live demo
[LIVE DEMO](https://nuketown-one.vercel.app/)

## Forhåndsvisning
Landningsside
![cfcc670e76b17458a62295e328cd9446](https://github.com/user-attachments/assets/2e735c85-1f8d-4954-ad0d-2b27acb0629b)
2D-Kart
![a4126ebe9ccca691abdffc7c72c3c70b](https://github.com/user-attachments/assets/85a17fd6-1db7-4524-8263-0391524574b8)
3D-Kart
![d33434c50d780f586b7a3ff7e3d76859](https://github.com/user-attachments/assets/889c7364-b64d-4806-a674-9ee55d28b026)
Vegnett aktivert
![ea1cbc6b3a868a7a66ae1334774e37f4](https://github.com/user-attachments/assets/1a78091a-8f69-40c2-b529-1ac3d1457d71)




