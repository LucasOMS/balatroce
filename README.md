# Balatroce

Pilotez **Balatro** à l'aide de commandes textuelles, avec possibilité de laisser les viewers Twitch voter pour
l'action à effectuer.

---

## 🚀 Installation (pour les streamers)

Quatre scripts sont fournis **à la racine du projet** pour installer, démarrer et configurer le projet **sans
avoir besoin de connaissances techniques**. Il suffit de double-cliquer dessus.

### 1. `setup.bat` — Installation complète

À lancer **une seule fois**, à l'installation du projet. Ce script :

1. Installe **Node.js 22** s'il n'est pas déjà présent (via `winget` ou `Chocolatey` selon ce qui est disponible sur
   le PC — si aucun des deux n'est disponible, le script explique comment l'installer manuellement).
2. Installe les dépendances du projet et le compile (`npm install` puis `npm run build`).
3. Configure les variables d'environnement nécessaires au fonctionnement du serveur, **de façon permanente** (plus
   besoin de les re-saisir à chaque redémarrage du PC). Il vous sera demandé votre jeton **Streamlabs**
   (`STREAMLABS_SOCKET_TOKEN`), disponible sur
   [le tableau de bord Streamlabs](https://streamlabs.com/dashboard#/settings/api-settings).
4. Vérifie que **Balatro** est installé (dossier `%AppData%\Balatro`). S'il ne l'est pas, le script vous demande de
   l'installer et de le lancer une première fois, puis attend que vous appuyiez sur Entrée pour continuer.
5. Copie les mods nécessaires (dossier `ressources/Mods`) dans le dossier de Balatro.
6. Installe la sauvegarde de départ (`npm run load-save`).

> Une fois terminé, démarrez le serveur avec `start-server.bat`.

### 2. `start-server.bat` — Démarrer le serveur

À utiliser à chaque session de stream. Il compile la dernière version du serveur si besoin, puis démarre le
serveur balatroce (`npm run start:prod`) et l'overlay (`npm run start:prod` dans le dossier `overlay/`) dans deux
fenêtres séparées.

### 3. `configure-env.bat` — Modifier un réglage

À utiliser à chaque fois que vous voulez changer un réglage (durée d'un vote, seuil de don, chaîne Twitch, etc.).

- Naviguez dans la liste avec les flèches **↑** / **↓**.
- Validez votre choix avec **Entrée** ou **Espace**.
- Entrez la nouvelle valeur (la valeur actuelle et une description s'affichent pour vous aider).
- Si le serveur est déjà démarré, il est **redémarré automatiquement** pour appliquer le changement.
- Choisissez `Quitter` dans le menu pour terminer.

### 4. `reset-env.bat` — Tout réinitialiser

Retire **toutes** les variables d'environnement configurées pour balatroce (utile en cas de problème, ou pour
repartir de zéro avant une réinstallation). Le serveur est redémarré automatiquement s'il était déjà lancé.

> ℹ️ Après une modification via `configure-env.bat` ou `reset-env.bat`, il est recommandé d'ouvrir un **nouveau**
> terminal si vous en avez d'autres d'ouverts ailleurs : les fenêtres déjà ouvertes ne voient pas toujours
> immédiatement les nouvelles valeurs.

---

## 📋 Variables d'environnement

Liste complète des variables d'environnement lues par le serveur balatroce, avec leur description et leur valeur
utilisée si elles ne sont pas définies (fallback). Ces variables peuvent être définies via `configure-env.bat`
(recommandé pour les non-développeurs), via votre shell, ou via un fichier `.env` chargé avec
`node --env-file=.env` (Node 20+).

| Variable                            | Description                                                                                              | Valeur par défaut                                |
|--------------------------------------|------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| `TWITCH_CHANNEL`                    | Nom de la chaîne Twitch à surveiller (sans le `#`)                                                        | _(aucune, obligatoire sauf en mode test)_        |
| `TWITCH_MOCK`                       | Si `true`, désactive la connexion réelle à Twitch (mode test)                                             | `false`                                          |
| `STREAMLABS_SOCKET_TOKEN`           | Jeton de connexion à la websocket Streamlabs (détection des dons)                                          | _(aucun, obligatoire sauf en mode test)_         |
| `STREAMLABS_MOCK`                   | Si `true`, désactive la connexion réelle à Streamlabs (mode test)                                          | `false`                                          |
| `STREAMLABS_STREAMER_MAP`           | Table JSON `{"memberId": "pseudoTwitch"}` pour résoudre le streamer ciblé par un don (événements caritatifs) | _(aucune)_                                       |
| `MODE_PHASE_DURATION_MS`            | Durée (ms) d'une phase avant de basculer automatiquement entre Démocratie et Anarchie                     | `600000` (10 min)                                |
| `MODE_DONATION_THRESHOLD`           | Montant de dons cumulés (depuis le dernier changement) déclenchant un changement de mode immédiat        | `50`                                              |
| `TWITCH_VOTE_DURATION_MS`           | Durée (ms) de la période de vote du chat                                                                  | `20000`                                          |
| `TWITCH_VOTE_DELAY_MS`              | Durée (ms) du délai après le vote, pour laisser passer les messages en retard                              | `5000`                                           |
| `ANARCHY_BIAS_ENABLED`              | Si `true`, favorise l'action la plus votée lors des tirages au sort en mode Anarchie                       | `true`                                           |
| `ANARCHY_BIAS_TARGET_SHARE`         | Part des votes (0-1) à partir de laquelle le biais du mode Anarchie s'applique pleinement                  | `0.9`                                            |
| `ANARCHY_BIAS_TARGET_PROBABILITY`   | Probabilité cible (0-1) de tirer l'action la plus votée en mode Anarchie                                    | `0.7`                                            |
| `BOT_REQUEST_TIMEOUT_MS`            | Timeout (ms) d'une requête vers l'API BalatroBot                                                           | `5000`                                           |
| `ROUND_EVAL_SETTLE_DELAY_MS`        | Délai (ms) attendu après la fin d'une manche avant d'encaisser, pour laisser le jeu finir d'animer l'écran de décompte des gains (évite un plantage) | `2500`                                           |
| `WATCHDOG_CHECK_INTERVAL_MS`        | Intervalle (ms) entre deux vérifications que le jeu répond bien                                            | `5000`                                           |
| `WATCHDOG_FAILURE_THRESHOLD`        | Nombre d'échecs consécutifs avant de considérer que le jeu a planté et de le relancer                      | `3`                                               |
| `WATCHDOG_PRE_KILL_DELAY_MS`        | Délai (ms) entre l'affichage du message overlay et l'arrêt du jeu                                          | `2000`                                           |
| `WATCHDOG_KILL_TO_LAUNCH_DELAY_MS`  | Délai (ms) entre l'arrêt et la relance du jeu                                                              | `3000`                                           |
| `WATCHDOG_RETRY_MS`                 | Délai (ms) avant de resonder l'API après une relance                                                       | `5000`                                           |
| `AUTOSAVE_PATH`                     | Chemin du fichier de sauvegarde automatique utilisé pour la reprise après une relance                     | `<dossier temp de l'OS>/balatroce-autosave.jkr`  |
| `AUTO_LAUNCH_GAME`                  | Si `false`, désactive le lancement automatique de Balatro au démarrage du serveur                          | `true`                                           |
| `PORT`                              | Port d'écoute du serveur balatroce                                                                          | `3000`                                           |
| `PROGRESSION_PATH`                  | Chemin du fichier de progression (deck/difficulté en cours)                                                | `data/progression-state.json`                    |
| `STATS_PATH`                        | Chemin du fichier de statistiques                                                                          | `data/stats.json`                                |
| `STATS_PLAYER_LOG_PATH`             | Chemin du journal des commandes envoyées par les joueurs                                                    | `data/player-commands.log`                       |


