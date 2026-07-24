# Balatroce

Pilotez **Balatro** à l'aide de commandes textuelles via un serveur NestJS. Le projet communique avec le
mod [BalatroBot](https://github.com/coder/balatrobot) en JSON-RPC 2.0 over HTTP.

---

## Prérequis

### 1. Balatro

- **Balatro** (v1.0.1+) — achetez le jeu sur [Steam](https://store.steampowered.com/app/2379780/Balatro/)

### 2. Lovely Injector

- **Lovely Injector** (v0.8.0+) — suivez
  le [guide d'installation](https://github.com/ethangreen-dev/lovely-injector#manual-installation)

### 3. Steamodded

- **Steamodded** (v1.0.0-beta-1221a+) — suivez le [guide d'installation](https://github.com/Steamodded/smods/wiki)

### 4. BalatroBot (mod Lua)

- Téléchargez la dernière version sur la [page des releases](https://github.com/coder/balatrobot/releases) ou clonez le
  dépôt
- Copiez les fichiers suivants dans le dossier **Mods** de Balatro :

```
Mods/
└── balatrobot/
    ├── balatrobot.json
    ├── balatrobot.lua
    └── src/lua/
```

| Plateforme           | Chemin du dossier Mods                                                                                        |
|----------------------|---------------------------------------------------------------------------------------------------------------|
| Windows              | `%AppData%\Balatro\Mods\balatrobot\`                                                                          |
| macOS                | `~/Library/Application Support/Balatro/Mods/balatrobot/`                                                      |
| Linux (Steam/Proton) | `~/.local/share/Steam/steamapps/compatdata/2379780/pfx/drive_c/users/steamuser/AppData/Roaming/Balatro/Mods/` |
| Linux (natif)        | `~/.config/love/Mods/balatrobot/`                                                                             |

### 5. uv (Python)

- **uv** (v0.9.21+) — suivez le [guide d'installation](https://docs.astral.sh/uv)

### 6. Node.js

- **Node.js** v18+ (recommandé : v22)

---

## Installation du projet

```bash
git clone https://github.com/LucasOMS/balatroce.git
cd balatroce
npm install
```

---

## Lancer le projet

### Étape 1 — Démarrer le serveur BalatroBot

```bash
uvx balatrobot serve
```

> Cette commande lance le serveur proxy qui relaie les requêtes JSON-RPC vers Balatro.

### Étape 2 — Lancer Balatro

Lancez Balatro via Steam. Le mod BalatroBot doit se charger automatiquement (vous pouvez vérifier dans les logs du jeu).

### Étape 3 — Lancer balatroce

```bash
# Mode développement (avec rechargement automatique)
npm run start:dev

# Mode production
npm run build
npm run start:prod
```

Le serveur NestJS démarre sur le port **3000** par défaut.

---

## Vérifier la connexion

### 1. Vérifier que BalatroBot répond

Avec `curl` (ou Postman), vérifiez que le mod est bien connecté :

```bash
curl -X POST http://127.0.0.1:12346 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "method": "health", "id": 1}'
```

**Réponse attendue :**

```json
{
    "jsonrpc": "2.0",
    "result": {
        "status": "ok"
    },
    "id": 1
}
```

### 2. Vérifier que balatroce est démarré

```bash
curl http://localhost:3000
```

Cela retourne l'état actuel du jeu. Vous devriez recevoir un objet JSON avec le champ `state` (ex: `"MENU"`,
`"SELECTING_HAND"`, etc.).

### 3. Simuler une commande

```bash
# Sélectionner la blind (équivalent à !selectionner)
curl "http://localhost:3000/simulate/!selectionner"

# Jouer les cartes 1 et 3 (équivalent à !jouer 1 3)
curl "http://localhost:3000/simulate/!jouer_1_3"
```

> **Note :** Remplacez les espaces par des `_` dans l'URL.

---

## Commandes disponibles

| Commande          | Paramètres                                | Exemple                | Description                             |
|-------------------|-------------------------------------------|------------------------|-----------------------------------------|
| `!jouer`          | Positions des cartes à jouer (1-5 cartes) | `!jouer 2 3 5`         | Jouer des cartes                        |
| `!retirer`        | Positions des cartes à défausser          | `!retirer 2 3 5 7`     | Défausser des cartes                    |
| `!selectionner`   | _(aucun)_                                 | `!selectionner`        | Sélectionner la blind                   |
| `!passer`         | _(aucun)_                                 | `!passer`              | Passer la blind (Small/Big seulement)   |
| `!arranger`       | Nouvelle ordre des cartes en main         | `!arranger 2 3 1`      | Réorganiser la main                     |
| `!arrangerconso`  | Nouvel ordre des consommables             | `!arrangerconso 2 1`   | Réorganiser les consommables            |
| `!arrangerjokers` | Nouvel ordre des jokers                   | `!arrangerjokers 2 1`  | Réorganiser les jokers                  |
| `!vendreconso`    | Position du consommable à vendre          | `!vendreconso 1`       | Vendre un consommable                   |
| `!vendrejoker`    | Position du joker à vendre                | `!vendrejoker 1`       | Vendre un joker                         |
| `!conso`          | Position du consommable à utiliser        | `!conso 2`             | Utiliser un consommable                 |
| `!acheter`        | Position de la carte à acheter            | `!acheter 2`           | Acheter une carte/joker dans le magasin |
| `!achetercoupon`  | Position du coupon à acheter              | `!achetercoupon 1`     | Acheter un voucher dans le magasin      |
| `!quitter`        | _(aucun)_                                 | `!quitter`             | Quitter le magasin                      |
| `!changer`        | _(aucun)_                                 | `!changer`             | Relancer le magasin (reroll)            |
| `!commencer`      | Deck Stake [Seed]                         | `!commencer RED WHITE` | Démarrer une partie                     |

> **Note :** Tous les indices sont **1-based** (la première carte est à la position `1`).

### Decks disponibles pour `!commencer`

`RED`, `BLUE`, `YELLOW`, `GREEN`, `BLACK`, `MAGIC`, `NEBULA`, `GHOST`, `ABANDONED`, `CHECKERED`, `ZODIAC`, `PAINTED`,
`ANAGLYPH`, `PLASMA`, `ERRATIC`

### Stakes disponibles pour `!commencer`

`WHITE`, `RED`, `GREEN`, `BLACK`, `BLUE`, `PURPLE`, `ORANGE`, `GOLD`

### Tester facilement une commande

Lancer l'utilitaire command-emulation avec `npm run emulate-commands` qui demande une commande à envoyer au serveur. La
commande est exécutée immédiatement.

L'utilitaire propose deux modes (commande `mode <admin|twitch>`) :

- **`admin`** (par défaut) : les commandes sont directement exécutées par le serveur (comme `!simulate/...`),
  sans passer par le système de vote. Pratique pour avancer rapidement pendant le développement.
- **`twitch`** : les commandes sont envoyées comme si elles venaient du chat Twitch (via `TestController`), et
  entrent donc dans le système de vote (Twitch Plays). Utilisez `user <pseudo>` pour changer l'utilisateur simulé.

---

## Twitch Plays (vote sur les actions du chat)

Le projet permet de piloter Balatro en laissant les viewers Twitch voter pour l'action à effectuer.

### Fonctionnement

1. **`TwitchMessageCollectorService`** se connecte au chat Twitch (via [tmi.js](https://github.com/tmijs/tmi.js)) et
   enregistre le dernier message (en minuscules) de chaque utilisateur qui commence par un mot-clé d'action valide.
2. **`TwitchActionDeciderService`** maintient un timer de vote. À la fin de la période de vote, il unifie les messages
   équivalents (ex: `!jouer 2 1 3` et `!jouer 1 2 3` comptent comme la même action), calcule le nombre de votes par
   action, puis utilise une stratégie pour décider de l'ordre de préférence des actions :
   - **`DemocracyStrategy`** : renvoie les actions de la plus votée à la moins votée.
   - **`AnarchyStrategy`** : tire au sort les actions avec une probabilité pondérée par leur nombre de votes.
3. **`GameCycleService`** reçoit la liste ordonnée d'actions et exécute la première qui est valide dans l'état de jeu
   courant.
4. **`OverlaySocketService`** diffuse, indépendamment du reste de l'overlay, l'état du vote (`état du timer`, `sa fin
   si en cours`, `le décompte des votes`) via l'événement WebSocket `twitch:vote-update`.

### Variables d'environnement

| Variable                  | Description                                                             | Défaut                                       |
|----------------------------|--------------------------------------------------------------------------|----------------------------------------------|
| `TWITCH_CHANNEL`           | Nom de la chaîne Twitch à écouter (sans le `#`)                          | _(aucun)_                                    |
| `TWITCH_CLIENT_ID`         | Client ID de l'application Twitch (voir "Authentification" ci-dessous)   | _(aucun)_                                    |
| `TWITCH_CLIENT_SECRET`     | Client Secret de la même application Twitch                              | _(aucun)_                                    |
| `TWITCH_REDIRECT_URI`      | URL de callback OAuth, doit être enregistrée dans l'application Twitch   | `http://localhost:3000/auth/twitch/callback` |
| `TWITCH_MOCK`              | Si `true`, désactive la connexion Twitch réelle (voir section debug)     | `false`                                      |
| `TWITCH_VOTE_DURATION_MS`  | Durée (ms) de la période de vote                                         | `20000`                                      |
| `TWITCH_VOTE_DELAY_MS`     | Durée (ms) du délai entre deux votes (messages "en retard")              | `5000`                                       |
| `TWITCH_VOTE_STRATEGY`     | Stratégie de décision : `democracy` ou `anarchy`                         | `democracy`                                  |

Ces variables peuvent être définies dans votre shell, ou via un fichier `.env` chargé au démarrage avec
`node --env-file=.env` (Node 20+).

> ⚠️ Le pseudo et le token OAuth du compte qui va parler dans le chat **ne sont pas** des variables d'environnement :
> ils sont récupérés via le flow d'authentification ci-dessous et stockés dans le fichier `twitch-auth.json`
> (déjà ignoré par git).

### Authentification Twitch (récupérer le token OAuth)

1. Créez une application sur la [console développeur Twitch](https://dev.twitch.tv/console/apps) :
   - **Nom** : ce que vous voulez (ex: `balatroce`)
   - **OAuth Redirect URLs** : `http://localhost:3000/auth/twitch/callback` (ou la valeur de `TWITCH_REDIRECT_URI`)
   - **Category** : Chat Bot
   - Récupérez le **Client ID**, et générez un **Client Secret**
2. Renseignez `TWITCH_CLIENT_ID` et `TWITCH_CLIENT_SECRET` dans votre environnement.
3. Démarrez le serveur (`npm run start:dev`), puis ouvrez dans un navigateur :

   ```
   http://localhost:3000/auth/twitch/login
   ```

4. Connectez-vous avec le compte Twitch qui doit parler dans le chat (peut être votre propre compte, ou un compte
   bot dédié), puis autorisez l'application.
5. Vous êtes redirigé vers `/auth/twitch/callback`, qui affiche une page de confirmation et enregistre le token dans
   `twitch-auth.json` à la racine du projet. Redémarrez le serveur si celui-ci tournait déjà pendant l'authentification.

Vous pouvez vérifier l'état de l'authentification à tout moment :

```bash
curl http://localhost:3000/auth/twitch/status
# { "authenticated": true, "username": "monpseudo" }
```

Si le token expire, `TwitchMessageCollectorService` tente automatiquement de le rafraîchir grâce au refresh token
stocké dans le même fichier. Si le rafraîchissement échoue, ré-ouvrez simplement `/auth/twitch/login`.

### Tester en local sans Twitch (mode mock)

Lancez le serveur avec `npm run start:mock` (équivalent à `TWITCH_MOCK=true npm run start:dev`) : le serveur démarre
normalement mais ne se connecte pas réellement à Twitch. Vous pouvez alors simuler des messages de chat via :

```bash
curl "http://localhost:3000/debug/twitch/monpseudo/!jouer_1_2_3"
```

ou plus simplement avec `npm run emulate-commands` en `mode twitch` (voir ci-dessus).

---

## Commandes non encore supportées

Les commandes suivantes correspondent à des fonctionnalités de l'API BalatroBot qui ne sont **pas encore implémentées**
dans balatroce :

| Méthode API         | Description                                                   | Commande suggérée               |
|---------------------|---------------------------------------------------------------|---------------------------------|
| `pack`              | Sélectionner une carte dans un booster pack ouvert, ou passer | `!pack <index>` / `!passerpack` |
| `buy` (avec `pack`) | Acheter un booster pack dans le magasin                       | `!acheterpack <position>`       |
| `save`              | Sauvegarder la partie en cours                                | `!sauvegarder <chemin>`         |
| `load`              | Charger une partie sauvegardée                                | `!charger <chemin>`             |
| `add`               | Ajouter une carte (debug/tests)                               | `!ajouter <cle>`                |
| `screenshot`        | Prendre une capture d'écran du jeu                            | `!screenshot <chemin>`          |
| `set`               | Modifier des valeurs en jeu (argent, mains, etc.)             | `!definir money=100`            |

> ⚠️ **Supprimé :** La commande `!acheterutiliser` (buy and use) n'existe plus dans l'API BalatroBot. Achetez d'abord
> avec `!acheter`, puis utilisez avec `!conso`.

---

## Dépannage

| Problème                              | Solution                                                                              |
|---------------------------------------|---------------------------------------------------------------------------------------|
| `Could not reach BalatroBot API`      | Vérifiez que Balatro est lancé et que le port `12346` est bien en écoute              |
| `Mod not loading`                     | Vérifiez que Lovely Injector et Steamodded sont bien installés                        |
| Port `12346` déjà utilisé             | Utilisez `uvx balatrobot serve --port PORT` et mettez à jour `BotHttpService.baseUrl` |
| `Connection refused` sur le port 3000 | Vérifiez que balatroce tourne avec `npm run start:dev`                                |
