# Zelfstandige installatieprompt — Oxxa Studio 1.6.0

Kopieer alles onder de streep naar een beheeragent die SSH-toegang tot je DirectAdmin-server heeft. De agent moet alleen ontbrekende gegevens aan je vragen. Gebruik nooit wachtwoorden of Login Keys die eerder zichtbaar in een screenshot zijn geweest.

---

## Opdracht

Werk als een senior WordPress Multisite-, DirectAdmin- en Oxxa-engineer. Installeer **Oxxa Studio 1.6.0** als echte productie-installatie op:

```text
https://studio.collabrains.de
```

Gebruik de bijgeleverde `install.sh`, `oxxa-studio.zip` en `oxxa-studio-theme.zip`. Het doel is een nieuwe WordPress **subdirectory Multisite zonder wildcard-DNS**, met Oxxa Studio network-geactiveerd en het companion theme network-enabled. Klantsites krijgen URLs zoals `studio.collabrains.de/klant1`. Subdomain-Multisite mag alleen als ik dat later expliciet kies. De Arena/Vite-preview is altijd demo en mag niet als productie-installatie worden gebruikt.

Vraag mij alleen om gegevens die nog ontbreken. Laat mij geheimen via een verborgen prompt of veilig lokaal invoerkanaal invoeren. Toon, log, commit of herhaal nooit database-, WordPress-, Oxxa- of DirectAdmin-geheimen.

## Niet-onderhandelbare veiligheid

- Voer het installatiescript uit als de **DirectAdmin-accountgebruiker**, niet als root.
- Maak eerst een back-up en stop als de documentroot niet leeg is. Leeg of overschrijf geen bestaande site zonder mijn expliciete aparte bevestiging.
- Gebruik een nieuwe database en een nieuwe WordPress-admin met unieke sterke wachtwoorden.
- Gebruik HTTPS en geldige certificaten. Zet `sslverify`, TLS-verificatie of DNS-validatie nooit uit.
- Gebruik geen `chmod 777` en installeer niet met `curl ... | bash`.
- Gebruik geen `ALL_ADMIN`, `ALL_RESELLER`, `ALL_USER` of `Allow HTM` voor de WordPress-Login-Key.
- Gebruik twee verschillende DirectAdmin Login Keys: één voor WordPress en één voor Oxxa SSL-automatisering.
- Voer geen betaalde Oxxa-bestelling, auto-renew-wijziging, certificaatannulering, serverwijziging, SSL-installatie of mailboxcreatie uit zonder mijn afzonderlijke expliciete opdracht.
- Als een echte provider-call mislukt, rapporteer de gesanitiseerde fout en stop met die integratie. Vul nooit demo- of verzonnen gegevens in om de controle te laten slagen.

## Benodigde invoer

Vraag mij interactief om:

1. DirectAdmin-accountgebruiker en de lege documentroot voor `studio.collabrains.de`.
2. Publiek IPv4/IPv6 van de hoofdserver en DNS-toegang voor `collabrains.de`.
3. Bestaande MySQL/MariaDB-database, gebruiker, host en wachtwoord.
4. WordPress-netwerktitel, beheerdersnaam, beheerders-e-mail en nieuw adminwachtwoord.
5. Oxxa API-gebruikersnaam, apart API-wachtwoord, identity handles en nameserver group (`nsgroup`).
6. DirectAdmin-basis-URL met poort `2222`, accountgebruikersnaam en nieuwe scoped Login Keys.

## Uitvoering

### 1. Controles en DNS

Controleer PHP 7.4+—bij voorkeur PHP 8.2/8.3—met `openssl`, `simplexml`, `curl`, `json` en `mysqli`. Controleer `curl`, `unzip`, schrijfrechten en HTTPS.

Leg alleen dit DNS-record aan of geef mij een exacte blokkade als ik dat zelf moet doen:

```text
studio.collabrains.de    A      <publiek-server-IPv4>
```

Voeg alleen AAAA toe als IPv6 correct naar dezelfde WordPress-server verwijst. Maak **geen wildcardrecord** en wijzig de bestaande hoofddomein-, www-, mail-, MX-, TXT- of nameserverrecords niet. De standaard subdirectory-sites gebruiken allemaal hetzelfde `studio.collabrains.de`-adres en certificaat. Kies in het script `subdirectories`; alleen een expliciete latere keuze voor `subdomains` vereist wildcard-DNS en een wildcard-vhost.

### 2. WordPress Multisite en Oxxa Studio

Ga naar de uitgepakte installatiekit en voer uit:

```bash
bash install.sh
```

Het script installeert WordPress, configureert standaard subdirectory Multisite zonder wildcard, installeert de plugin en het theme en voert lokale controles uit. Als WP-CLI ontbreekt mag het script de officiële WP-CLI PHAR van GitHub downloaden. Als een vereiste controle faalt, los de oorzaak op; omzeil de controle niet.

Controleer daarna:

- WordPress Network Admin is bereikbaar via HTTPS;
- de plugin is network-actief;
- `oxxa-studio-theme` is network-enabled;
- **Oxxa Studio → Setup guide** rapporteert Multisite, `manage_network`, OpenSSL, SimpleXML en HTTPS correct;
- een nieuwe testsite kan worden aangemaakt, maar verwijder die alleen als ik daar toestemming voor geef.

### 3. Echte Oxxa-koppeling

Bepaal het outbound-IP van de WordPress-server, bijvoorbeeld met:

```bash
curl -4 https://api.ipify.org; echo
```

Verifieer dat dit het werkelijke provider-source-IP is. Whitelist dit IP in My Oxxa → API. Gebruik het aparte Oxxa API-wachtwoord, niet het gewone accountwachtwoord.

Open in Network Admin **Oxxa Studio → Network settings → Oxxa** en configureer gebruikersnaam, API-wachtwoord, registrant/admin/tech/billing-identities en `nsgroup`. Laat test mode tijdens de eerste controle aan. Test en sla op.

Voer daarna alleen read-only synchronisaties uit:

- **Domains → Sync domains**;
- **SSL certificates → Sync SSL inventory**.

Vergelijk aantallen en enkele niet-geheime records met My Oxxa. “Oxxa test” is een API-testmodus en niet hetzelfde als demo-data. Verander geen auto-renew en registreer geen domein.

### 4. Echte DirectAdmin-koppeling voor WordPress

Maak onder het juiste hostingaccount op **User-level** een nieuwe Login Key met bijvoorbeeld naam `oxxa-studio-wordpress`.

Instellingen:

- `Allow HTM`: uit;
- alle brede `ALL_*`-groepen: uit;
- Allowed IP: alleen het geverifieerde outbound-IP van WordPress;
- moderne sessierechten voor `/api/session/user-config` en `/api/session/user-usage` toestaan als DirectAdmin die afzonderlijk toont;
- `CMD_API_SHOW_USER_CONFIG` en `CMD_API_SHOW_USER_USAGE` voor legacy-fallback toestaan;
- `CMD_API_POP` alleen toestaan als ik mailboxlisting en expliciete mailboxcreatie wil gebruiken.

Open **Network settings → DirectAdmin**. Voer alleen de basis-URL in, bijvoorbeeld `https://HOSTNAME:2222`, zonder `/evo`, commando of credentials. Test, sla op en voer **Hosting → Sync DirectAdmin** uit.

Controleer dat package, primair domein en usage met DirectAdmin overeenkomen en dat Hosting `modern REST API` of `legacy API` rapporteert. Beide zijn echte data. Controleer mailboxlisting alleen als `CMD_API_POP` bewust is toegestaan; maak geen mailbox aan.

### 5. Apart Oxxa SSL-serverprofiel

Maak een tweede Login Key voor Oxxa. Gebruik **Allow HTM uit**, minimale rechten en uitsluitend de Oxxa-source-IP’s die My Oxxa bij Serverprofielen toont. Zet die IP’s zo nodig ook op de serverfirewall-whitelist. Gebruik niet het WordPress-IP als vervanging.

Volg de actuele Oxxa-instructies voor deze mogelijke DirectAdmin-commando’s:

```text
CMD_API_SHOW_RESELLERS   # alleen admin waar Oxxa dit vereist
CMD_API_SHOW_USERS       # admin/reseller waar vereist
CMD_API_ADDITIONAL_DOMAINS
CMD_API_SHOW_USER_CONFIG
CMD_API_DNS_CONTROL
CMD_API_SSL
```

Gebruik alleen een 2FA-API-uitzondering voor deze sleutel als dat noodzakelijk is; schakel 2FA niet algemeen uit. Sla het profiel op in My Oxxa → Serverprofielen met de DirectAdmin-host, gebruikersnaam en tweede Login Key. Voer daarna opnieuw **SSL certificates → Sync SSL inventory** uit. Oxxa Studio leest dit profiel alleen; het maakt of wijzigt het profiel niet.

## Acceptatiecriteria

Rapporteer pas succes als alle van toepassing zijnde controles echt zijn geslaagd:

1. `https://studio.collabrains.de/wp-admin/network/` werkt via geldig HTTPS.
2. Oxxa Studio is network-actief en de Setup guide heeft geen onopgeloste blokkade.
3. Domains toont echte My Oxxa-records na expliciete sync.
4. SSL toont echte Oxxa-certificaten/producten/serverprofielen na expliciete sync.
5. Hosting toont echte DirectAdmin-accountgegevens en usage.
6. Er staat geen “Demo data” bij geconfigureerde providerdata; snapshots worden alleen door een nieuwe sync ververst.
7. Er zijn geen betaalde of onbedoelde mutaties uitgevoerd.
8. Geen enkel geheim staat in terminaloutput, logs, Git, screenshots of het eindrapport.

Als iets niet live werkt, schrijf **NIET GEVERIFIEERD** met de gesanitiseerde fout en de volgende benodigde actie. Vervang echte data nooit door mocks.

## Scope die niet als voltooid mag worden gerapporteerd

Deze release heeft nog geen algemene live adapters voor DirectAdmin DNS-zonebeheer, databases, FTP, hostingpakketprovisioning, backups, DirectAdmin `/api/wordpress/*`, betalingen of externe analytics. SSL-bestellen, annuleren en installeren vanuit Oxxa Studio zijn evenmin ingeschakeld. Vermeld deze grenzen in het eindrapport.

## Eindrapport

Geef een korte tabel met per onderdeel: `OK`, `NIET GEVERIFIEERD` of `BLOKKADE`, de uitgevoerde read-only test en resterende actie. Vermeld het beheer-URL en de gebruikte API-modus voor DirectAdmin. Vermeld geen geheimen en beweer geen succes op basis van mocks.

---

## Script handmatig starten

Upload en pak de installatiekit uit op de DirectAdmin-account, open SSH als die accountgebruiker en voer uit:

```bash
cd /pad/naar/oxxa-studio-installer
bash install.sh
```

Volg de verborgen wachtwoordprompts. Configureer daarna de providers in WordPress volgens bovenstaande stappen.
