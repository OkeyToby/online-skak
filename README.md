# Online skak (to spillere) – Socket.IO

Et simpelt online skakspil hvor to spillere kan spille fra hver sin computer via et delt rumnavn/link.  
Server: Express + Socket.IO · Regler: chess.js · Bræt: chessboard.js.

## Sådan kører du lokalt
1. Installer Node.js (LTS).
2. I projektmappen:
   ```bash
   npm install
   npm start
   ```
3. Åbn `http://localhost:3000`.

## Sådan spiller I
- Skriv et **rum** (fx `2a-sjaks`) og klik **Join** (eller tryk Enter).
- Del linket fra feltet “Del dette link …” (indeholder `#rumnavn`) med din modstander.
- Første spiller i rummet bliver **Hvid**, næste **Sort**. Tredje+ er tilskuere.

## Deploy til Render via GitHub
1. Opret en **Web Service** på Render og connect til dit GitHub-repo.  
   - Type: *Web Service* (ikke Static Site)
   - Start command: `npm start`
   - Health Check path: `/health` (valgfrit men anbefalet)
2. I GitHub repo → **Settings → Secrets and variables → Actions**:
   - `RENDER_SERVICE_ID` = Service ID fra Render (Findes på service-siden → Settings/Info)
   - `RENDER_API_KEY` = din Render API key (Account → API Keys)
3. Push til `main`. Workflow `.github/workflows/deploy.yml` vil trigge et deploy hos Render.

## Fejlfinding
- **Hænger på “almost live”** → Tjek at det er *Web Service*, at `npm start` er sat, og at serveren lytter på `process.env.PORT` og `0.0.0.0`. Vi har `/health`-endpoint.
- **Kan ikke trække brikker** → jQuery skal være loaded før chessboard.js (det er sat i `index.html`).
- **Kan ikke lave rum** → Brug enkle rumnavne (vi “sanitizer” automatisk: små bogstaver, `-` i stedet for mellemrum).

## Ideer / TODO
- Skakur/tidskontrol (fx 10+5)
- Download PGN
- Highlights af legale træk og sidste træk
- Persistens/leaderboard via database
