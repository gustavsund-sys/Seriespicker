# Seriespicker

En svensk, mobile-first React-app som rekommenderar **en TV-serie** utifrån streamingtjänster, smak, humör och kvällsbehov. Mörkt gränssnitt med stora touchytor, lokal historik och feedback.

## Starta

Node.js 22.12+ och pnpm 11 rekommenderas. Låsfilen ingår. Utvecklingsservern kör både appen och TMDB-proxyn på samma adress.

```sh
pnpm install
pnpm dev
```

Öppna adressen som servern visar. För att testa på en mobil i samma nätverk: `HOST=0.0.0.0 pnpm dev` och öppna datorns lokala IP-adress med port 5173.

```sh
pnpm build
pnpm lint
pnpm test
pnpm start
```

`pnpm start` serverar den byggda appen och proxyn på port 3000 som standard. `PORT` och `HOST` kan anges i miljön. För publik drift är repot konfigurerat för Firebase Hosting och en Cloud Function.

## Publicera på Firebase

Firebase-projektet är `seriespicker-f41a7`. Hosting serverar `dist/` och skriver om `/api/tmdb/**` till funktionen `tmdbProxy` i `europe-west1`. Funktionen läser nyckeln från Firebase Secret Manager. Projektet behöver Blaze-planen för att Cloud Functions ska kunna publiceras.

```sh
pnpm dlx firebase-tools login
pnpm dlx firebase-tools functions:secrets:set TMDB_API_KEY
pnpm install
pnpm build
pnpm dlx firebase-tools deploy --only functions,hosting
```

Ange TMDB:s **API Key** när kommandot för hemligheten frågar efter värdet. Den publika adressen är `https://seriespicker-f41a7.web.app/`. Publicera både `functions` och `hosting` när proxyn ändras. Firebase SDK-konfigurationen för webbläsaren behövs först när appen börjar använda exempelvis Firebase Auth eller Firestore.

Vanliga npm-kommandon fungerar också (`npm install`, `npm run dev`), men pnpm-låsfilen är den verifierade beroendeuppsättningen.

## TMDB och demoläge

Kopiera `.env.example` till `.env.local`, ange `TMDB_API_KEY` från [TMDB](https://www.themoviedb.org/settings/api) och starta om servern. Ingen riktig nyckel ingår i Git. Servern tillåter bara appens tre TMDB-anrop och lägger till nyckeln där. Nyckeln byggs inte in i webbläsarkoden.

Utan nyckel eller vid API-fel visas ett tydligt demoläge. Demokatalogens betyg och leverantörer är exempel, inte verifierad aktuell svensk tillgänglighet. Den innehåller även uttryckligen fiktiva serier för att testa alla åtta tjänster. Demokorten använder typografiska affischer. Live-läget använder TMDB:s posterbilder med reservvy om bilden inte laddas.

TMDB-servicen hämtar TV-serier via serverns `/api/tmdb`-proxy, identifierar svenska leverantörer via leverantörskatalogen och använder `watch_region=SE`. Kandidater kontrolleras mot varje series svenska watch-provider-data. Abonnemang, gratis och reklamfinansierad streaming stöds; hyr/köp ger ingen match. Popularitet, betyg och ett urval riktat mot valda genrer kombineras, upp till 60 kandidater. Enstaka misslyckade tillgänglighetskontroller utesluts. Det är ett begränsat urval, inte en genomsökning av hela katalogen. Katalogen återanvänds i webbläsaren i 20 minuter; servern håller kortvarig cache per instans för TMDB-svar.

TMDB:s TV-genrer skiljer inte alltid på sci-fi/fantasy och saknar egna genrer för thriller, skräck och feelgood. Appen härleder därför de valen från kombinationer av genre, uppskattad stämningsprofil och beskrivning. Träffarna är en uppskattning, inte officiella TMDB-genrer.

Streamingknappen i live-läget öppnar TMDB:s svenska watch-länk, där länkar vidare till tjänsterna finns. I demo sparas valet i historiken. Att välja en serie är separat från att markera den som sedd.

Attribution för TMDB, deras officiella logotyp och JustWatch finns i appens avsnitt om datakällor. Se [TMDB:s krav](https://developer.themoviedb.org/docs/faq) och [watch providers](https://developer.themoviedb.org/reference/tv-series-watch-providers).

## Struktur

```text
src/
  App.tsx                      användarflödet och stabil rekommendationskö
  components/                  logotyp och stegindikator
  data/                        utbyggbara val och demokatalog
  lib/moodEngine.ts            åtta stämningsdimensioner
  lib/recommendationEngine.ts  filtrering, poäng och förklaringar
  services/tmdb.ts             TMDB och explicit demofallback
  services/userData.ts         UserDataStore och localStorage
  types/                      delade typer
server/index.mjs               lokal webbserver
functions/                     delad TMDB-proxy och Firebase Cloud Function
public/                       ikon och webbmanifest
```

## Mood Engine

Humör och behov kombineras till `tempo`, `complexity`, `humor`, `darkness`, `tension`, `emotion`, `escapism` och `hook`, alla 0–10. Trött + Bli fast direkt ger `[7,2,5,4,6,3,5,10]`. Det är en profil med flera dimensioner, ingen direkt genreöversättning.

Kurerade serier har egna profiler. Övriga live-serier använder enkla genrebaserade uppskattningar; TMDB tillhandahåller inte dessa dimensioner. Detta är en begränsning i första versionen. `normalizeExternalProfile` normaliserar framtida AI-profiler, inklusive ogiltiga värden, innan de skickas till rekommendationsmotorn. Ingen extern AI används. Fritextknappen är märkt ”Kommer snart”.

## Rekommendationer och lagring

Vald streamingtjänst är obligatorisk. Poäng: genre upp till 30, profilavstånd upp till 30, betyg upp till 10, popularitet upp till 5 samt liten daglig variation. Redan sedda serier utesluts; ogillade får −100. Gilla-markeringar påverkar senare rekommendationer via liknande profiler och genrer. Ett negativt skäl (för mörkt, för långsamt eller fel genre) prioriterar ned liknande förslag. En visad serie byts bara när användaren ber om ett nytt förslag eller markerar den som sedd; det senare kan ångras. ”Ge mig en annan” går framåt i kön och återupprepar ingen serie samma kväll.

`UserDataStore` sparar tjänster, smak, senaste humör/behov, de senaste 500 rekommendationerna, betyg och separat sedd-status. Ogiltig lagrad profil valideras. Om lagring blockeras används minne för sessionen. Historik finns under inställningar.

## PWA och Firebase

Appen har manifest, ikon, mobilmetadata och relativa resurssökvägar. Full PWA-installation/offline kräver ytterligare arbete: PNG-ikoner för fler plattformar, service worker med versionshanterad cache och HTTPS. Den tidigare enkla service workern har utelämnats för att undvika att cacha felaktiga API-svar eller radera andra appars cache.

Inför Firebase: gör datalagret asynkront, injicera Firestore-adapter, lägg till användaridentitet, säkerhetsregler, migration, synkning samt export/radering. Bygg vidare på sparad feedback för personlig ranking.

## Ursprung

Återställd från kodvyn i den delade uppgiften ”Bygg första versionen av Seriespicker” och korrigerad för detta repo. Ingen historik eller filer från schema-repot följer med.
