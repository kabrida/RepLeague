# RepLeague

RepLeague on kevyt mobiilisovellus treenitulosten kirjaamiseen ja seurantaan. Sovellus tarjoaa kalenterinäkymän, tuloslistat, sekä mahdollisuuden lisätä ja muokata yksittäisiä tuloksia.

## Perusidea
- Käyttäjä kirjaa suoritusdataa (toistot, aika, painot, muistiinpanot) treenikohtaisesti.
- Tulokset tallentuvat Firestoreen ja näkyvät kalenterissa merkittyinä päivinä.
- Käyttäjä voi selata tuloksia, muokata niitä ja tarkastella kuukausikohtaisia tilastoja (esim. yleisin treenityyppi).

## Käytetyt teknologiat
- React Native + Expo
- Firebase Authentication (kirjautuminen) & Firestore (tietokanta)
- React Navigation (bottom tabs + stack)
- react-native-calendars (kalenterikomponentti)
- date-fns (päivämäärämuunnokset ja interval-laskenta)
- react-native-community/datetimepicker (päivämäärän valinta / Expo-yhteensopiva)
- react-native-keyboard-aware-scroll-view, react-native-safe-area-context ja muita pienempiä kirjastoja

## Kansiorakenne (tärkeimmät tiedostot)
- `App.js` – navigaatio ja sovelluksen juurilogiikka
- `components/` – näkymät ja käyttöliittymäkomponentit (HomeScreen, ResultsScreen, CalendarScreen, modaalit...)
- `authentication/` – AuthContext ja kirjautumis-/rekisteröintinäkymät
- `styles/` – `globalStyles.js` ja teema
- `firebaseConfig.js` – Firebase-konfiguraatio
- `user/` – sovelluksen käyttäjään liittyvät näkymät ja käyttöliittymäkomponentit (ProfileScreen, EditProfileModal)

## Paikallinen kehitys
Asenna riippuvuudet ja käynnistä Expo (PowerShell-esimerkki):

```powershell
cd "sovelluksen_juurihakemisto"
npm install
npx expo start
```

Käytä Expo Go -sovellusta käyttääksesi sovellusta mobiililaitteella.

## Firebase-konfiguraatio (paikallinen)
Tiedosto `firebaseConfig.js` EI kuulu versionhallintaan. Luo projektiisi paikallinen tiedosto `firebaseConfig.js` ja täydennä omilla avaimillasi. Esimerkki:

```javascript
// firebaseConfig.js (paikallinen, älä commitoi)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_PROJECT_ID.appspot.com",
	messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
	appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
```

Lisää `.gitignore`-tiedostoon rivi `firebaseConfig.js`, jos sitä ei vielä ole.