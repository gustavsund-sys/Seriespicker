# Seriespicker

En svensk, mobile-first React-app som rekommenderar **en TV-serie** utifrån streamingtjänster, smak, humör och kvällsbehov. Mörkt gränssnitt med stora touchytor, lokal historik och feedback.

## Starta

Node.js 22.12+ och pnpm 11 rekommenderas. Låsfilen ingår.

```sh
pnpm install
pnpm dev
```

Öppna adressen Vite visar. För att testa på en mobil i samma nätverk: `pnpm dev --host 0.0.0.0` och öppna datorns lokala IP-adress med port 5173. För publik åtkomst behöver `dist/` publiceras på en statisk webbhost.

```sh
pnpm build
pnpm lint
pnpm test
pnpm preview
```

Vanliga npm-kommandon fungerar också (`npm install`, `npm run dev`), men pnpm-låsfilen är den verifierade beroendeuppsättningen.

## TMDB och demoläge

Kopiera `.env.example` till `.env.local`, ange `VITE_TMDB_API_KEY` från [TMDB](https://www.themoviedb.org/settings/api) och starta om Vite. Ingen riktig nyckel ingår. Vite-variabler byggs in i webbläsarkoden; använd en serverproxy om nyckeln ska hållas hemlig för besökare.

Utan nyckel eller vid API-fel visas ett tydligt demoläge. Demokatalogens betyg och leverantörer är exempel, inte verifierad aktuell svensk tillgänglighet. Den innehåller även uttryckligen fiktiva serier för att testa alla åtta tjänster. Demokorten använder typografiska affischer. Live-läget använder TMDB:s posterbilder med reservvy om bilden inte laddas.

TMDB-servicen hämtar TV-serier, identifierar svenska leverantörer via leverantörskatalogen och använder `watch_region=SE`. Kandidater kontrolleras mot varje series svenska watch-provider-data. Abonnemang, gratis och reklamfinansierad streaming stöds; hyr/köp ger ingen match. Två kandidaturval (popularitet och betyg) kombineras. Enstaka misslyckade tillgänglighetskontroller utesluts. Det är ett begränsat urval, inte en genomsökning av hela katalogen.

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
public/                       ikon och webbmanifest
```

## Mood Engine

Humör och behov kombineras till `tempo`, `complexity`, `humor`, `darkness`, `tension`, `emotion`, `escapism` och `hook`, alla 0–10. Trött + Bli fast direkt ger `[7,2,5,4,6,3,5,10]`. Det är en profil med flera dimensioner, ingen direkt genreöversättning.

Kurerade serier har egna profiler. Övriga live-serier använder enkla genrebaserade uppskattningar; TMDB tillhandahåller inte dessa dimensioner. Detta är en begränsning i första versionen. `normalizeExternalProfile` normaliserar framtida AI-profiler, inklusive ogiltiga värden, innan de skickas till rekommendationsmotorn. Ingen extern AI används. Fritextknappen är märkt ”Kommer snart”.

## Rekommendationer och lagring

Vald streamingtjänst är obligatorisk. Poäng: genre upp till 30, profilavstånd upp till 30, betyg upp till 10, popularitet upp till 5 samt liten daglig variation. Tidigare rekommendationer får avdrag, sedda −70 och ogillade −100. Positiv feedback sparas för framtida personalisering. En visad serie byts bara när användaren ber om ett nytt förslag; feedback omrankar inte det aktuella kortet. ”Ge mig en annan” går framåt i kön och återupprepar ingen serie samma kväll.

`UserDataStore` sparar tjänster, smak, senaste humör/behov, de senaste 500 rekommendationerna, betyg och separat sedd-status. Ogiltig lagrad profil valideras. Om lagring blockeras används minne för sessionen. Historik finns under inställningar.

## PWA och Firebase

Appen har manifest, ikon, mobilmetadata och relativa resurssökvägar. Full PWA-installation/offline kräver ytterligare arbete: PNG-ikoner för fler plattformar, service worker med versionshanterad cache och HTTPS. Den tidigare enkla service workern har utelämnats för att undvika att cacha felaktiga API-svar eller radera andra appars cache.

Inför Firebase: gör datalagret asynkront, injicera Firestore-adapter, lägg till användaridentitet, säkerhetsregler, migration, synkning samt export/radering. Bygg vidare på sparad feedback för personlig ranking.

## Ursprung

Återställd från kodvyn i den delade uppgiften ”Bygg första versionen av Seriespicker” och korrigerad för detta repo. Ingen historik eller filer från schema-repot följer med.
