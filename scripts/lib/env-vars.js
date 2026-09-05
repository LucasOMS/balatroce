// Liste centralisée de toutes les variables d'environnement utilisées par le
// serveur balatroce. Utilisée par setup.js, configure-env.js et reset-env.js.
//
// Chaque entrée :
// - name        : nom de la variable d'environnement
// - description : explication simple, affichée à l'utilisateur
// - default     : valeur utilisée par le serveur si la variable n'est pas définie

module.exports = [
    {
        name: "TWITCH_CHANNEL",
        description: "Nom de la chaîne Twitch à surveiller (sans le #).",
        default: "(aucune, obligatoire sauf en mode test)",
    },
    {
        name: "TWITCH_MOCK",
        description:
            "Si 'true', désactive la connexion réelle à Twitch (utile pour tester sans compte).",
        default: "false",
    },
    {
        name: "STREAMLABS_SOCKET_TOKEN",
        description: "Jeton de connexion à la websocket Streamlabs (pour détecter les dons).",
        default: "(aucun, obligatoire sauf en mode test)",
    },
    {
        name: "STREAMLABS_MOCK",
        description: "Si 'true', désactive la connexion réelle à Streamlabs (mode test).",
        default: "false",
    },
    {
        name: "STREAMLABS_STREAMER_MAP",
        description:
            "Table JSON avancée {\"memberId\": \"pseudoTwitch\"} pour les dons multi-streamers (caritatifs).",
        default: "(aucune)",
    },
    {
        name: "MODE_PHASE_DURATION_MS",
        description:
            "Durée (en millisecondes) d'une phase avant de basculer automatiquement entre les modes Démocratie et Anarchie.",
        default: "600000",
    },
    {
        name: "MODE_DONATION_THRESHOLD",
        description:
            "Montant de dons cumulés (depuis le dernier changement) qui déclenche un changement de mode immédiat.",
        default: "50",
    },
    {
        name: "TWITCH_VOTE_DURATION_MS",
        description: "Durée (en millisecondes) de la période de vote du chat pour choisir une action.",
        default: "25000",
    },
    {
        name: "TWITCH_VOTE_DELAY_MS",
        description:
            "Durée (en millisecondes) du délai après la fin du vote, pour laisser passer les messages en retard.",
        default: "7500",
    },
    {
        name: "ANARCHY_BIAS_ENABLED",
        description:
            "Si 'true', favorise l'action la plus votée lors des tirages au sort en mode Anarchie.",
        default: "true",
    },
    {
        name: "ANARCHY_BIAS_TARGET_SHARE",
        description:
            "Part des votes (entre 0 et 1) à partir de laquelle le biais du mode Anarchie s'applique pleinement.",
        default: "0.9",
    },
    {
        name: "ANARCHY_BIAS_TARGET_PROBABILITY",
        description:
            "Probabilité cible (entre 0 et 1) de tirer l'action la plus votée en mode Anarchie.",
        default: "0.7",
    },
    {
        name: "BOT_REQUEST_TIMEOUT_MS",
        description: "Temps maximum (en millisecondes) d'attente d'une réponse du jeu Balatro.",
        default: "5000",
    },
    {
        name: "ROUND_EVAL_SETTLE_DELAY_MS",
        description:
            "Délai (en millisecondes) attendu après la fin d'une manche avant d'encaisser, pour laisser le jeu finir d'animer l'écran de décompte des gains (sinon risque de plantage).",
        default: "2500",
    },
    {
        name: "WATCHDOG_CHECK_INTERVAL_MS",
        description: "Intervalle (en millisecondes) entre deux vérifications que le jeu répond bien.",
        default: "5000",
    },
    {
        name: "WATCHDOG_FAILURE_THRESHOLD",
        description: "Nombre d'échecs consécutifs avant de considérer que le jeu a planté et de le relancer.",
        default: "3",
    },
    {
        name: "WATCHDOG_PRE_KILL_DELAY_MS",
        description:
            "Délai (en millisecondes) entre l'affichage du message de reprise et la fermeture du jeu.",
        default: "2000",
    },
    {
        name: "WATCHDOG_KILL_TO_LAUNCH_DELAY_MS",
        description: "Délai (en millisecondes) entre la fermeture et la relance du jeu.",
        default: "3000",
    },
    {
        name: "WATCHDOG_RETRY_MS",
        description: "Délai (en millisecondes) avant de revérifier le jeu après une relance.",
        default: "5000",
    },
    {
        name: "AUTOSAVE_PATH",
        description: "Emplacement du fichier de sauvegarde automatique utilisé après une relance du jeu.",
        default: "<dossier temporaire de Windows>\\balatroce-autosave.jkr",
    },
    {
        name: "AUTO_LAUNCH_GAME",
        description: "Si 'false', désactive le lancement automatique de Balatro au démarrage du serveur.",
        default: "true",
    },
    {
        name: "PORT",
        description: "Port d'écoute du serveur balatroce.",
        default: "3000",
    },
    {
        name: "PROGRESSION_PATH",
        description: "Emplacement du fichier qui mémorise la progression (deck / difficulté en cours).",
        default: "data\\progression-state.json",
    },
    {
        name: "STATS_PATH",
        description: "Emplacement du fichier de statistiques.",
        default: "data\\stats.json",
    },
    {
        name: "STATS_PLAYER_LOG_PATH",
        description: "Emplacement du journal des commandes envoyées par les joueurs.",
        default: "data\\player-commands.log",
    },
];


