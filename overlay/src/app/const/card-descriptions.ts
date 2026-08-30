import {Card, CardSet, GameState} from "@shared/game-state"
import {PlayingCardColor, SUITS} from "../utils/performed-action-display";

export const JOKER_DESCRIPTIONS: Record<string, string> = {
  "j_joker": '<span class="text-mult">+4</span> Multi.',
  "j_greedy_joker": 'Les cartes <span class="text-diamond">♦ Carreau</span> jouées octroient <span class="text-mult">+3</span> Multi.',
  "j_lusty_joker": 'Les cartes <span class="text-heart">♥ Cœur</span> jouées octroient <span class="text-mult">+3</span> Multi.',
  "j_wrathful_joker": 'Les cartes <span class="text-spades">♠ Pique</span> jouées octroient <span class="text-mult">+3</span> Multi.',
  "j_gluttenous_joker": 'Les cartes <span class="text-clubs">♣ Trèfle</span> jouées octroient <span class="text-mult">+3</span> Multi.',
  "j_jolly": '<span class="text-mult">+8</span> Multi. si la main contient une Paire',
  "j_zany": '<span class="text-mult">+12</span> Multi. si la main contient un Brelan',
  "j_mad": '<span class="text-mult">+10</span> Multi. si la main contient une Double paire',
  "j_crazy": '<span class="text-mult">+12</span> Multi. si la main contient une Suite',
  "j_droll": '<span class="text-mult">+10</span> Multi. si la main contient une Couleur',
  "j_sly": '<span class="text-chips">+50</span> Jetons si la main contient une Paire',
  "j_wily": '<span class="text-chips">+100</span> Jetons si la main contient un Brelan',
  "j_clever": '<span class="text-chips">+80</span> Jetons si la main contient une Double paire',
  "j_devious": '<span class="text-chips">+100</span> Jetons si la main contient une Suite',
  "j_crafty": '<span class="text-chips">+80</span> Jetons si la main contient une Couleur',
  "j_half": '<span class="text-mult">+20</span> Multi. si la main jouée contient 3 cartes ou moins',
  "j_stencil": '<span class="mult-mult">×1&nbsp;multi</span> par emplacement Joker vide (compte comme vide)',
  "j_four_fingers": 'Les Couleurs et les Suites peuvent être réalisées avec 4 cartes seulement',
  "j_mime": 'Redéclenche toutes les cartes en main',
  "j_credit_card": 'Permet d\'accumuler jusqu\'à <span class="text-money">-20$</span> de dettes',
  "j_ceremonial": 'Quand une Blinde est sélectionnée, détruit le Joker à sa droite et ajoute le double de sa valeur de vente au Multi. de façon permanente',
  "j_banner": '<span class="text-chips">+30</span> Jetons par défausse restante',
  "j_mystic_summit": '<span class="text-mult">+15</span> Multi. quand il reste 0 défausse',
  "j_marble": 'Ajoute une carte Pierre au jeu quand une Blinde est sélectionnée',
  "j_loyalty_card": '<span class="mult-mult">×4&nbsp;multi</span> toutes les 6 mains jouées',
  "j_8_ball": '<span class="text-probability">1/4</span> de créer une carte de Tarot pour chaque 8 joué et marquant',
  "j_misprint": 'Ajoute entre <span class="text-mult">0</span> et <span class="text-mult">+23</span> Multi. de façon aléatoire',
  "j_dusk": 'Redéclenche toutes les cartes marquantes de la main finale de la manche',
  "j_raised_fist": 'Ajoute le double de la valeur de la carte la plus faible en main au Multi.',
  "j_chaos": '1 relance gratuite par magasin',
  "j_fibonacci": 'Chaque As, 2, 3, 5 ou 8 joué octroie <span class="text-mult">+8</span> Multi.',
  "j_steel_joker": '<span class="mult-mult">×0.20&nbsp;multi</span> pour chaque carte Acier dans le jeu complet',
  "j_scary_face": 'Les cartes Figure jouées octroient <span class="text-chips">+30</span> Jetons',
  "j_abstract": '<span class="text-mult">+3</span> Multi. pour chaque Joker',
  "j_delayed_grat": 'Gagnez <span class="text-money">2$</span> par défausse si aucune n\'est utilisée à la fin de la manche',
  "j_hack": 'Redéclenche les 2, 3, 4 et 5',
  "j_pareidolia": 'Toutes les cartes sont considérées comme des Figures',
  "j_gros_michel": '<span class="text-mult">+15</span> Multi., <span class="text-probability">1/6</span> d\'être détruit en fin de manche',
  "j_even_steven": 'Les cartes paires (2,4,6,8,10) jouées octroient <span class="text-mult">+4</span> Multi.',
  "j_odd_todd": 'Les cartes impaires (As,3,5,7,9) jouées octroient <span class="text-chips">+31</span> Jetons',
  "j_scholar": 'Les As joués octroient <span class="text-chips">+20</span> Jetons et <span class="text-mult">+4</span> Multi.',
  "j_business": 'Les cartes Figure ont <span class="text-probability">1/2</span> chance d\'octroyer <span class="text-money">2$</span>',
  "j_supernova": 'Ajoute au Multi. le nombre de fois où la main de poker jouée a déjà été jouée',
  "j_ride_the_bus": '<span class="text-mult">+1</span> Multi. par main jouée consécutivement sans carte Figure marquante',
  "j_space": '<span class="text-probability">1/4</span> d\'augmenter le niveau de la main de poker jouée',
  "j_egg": 'Gagne <span class="text-money">3$</span> de valeur de vente à la fin de chaque manche',
  "j_burglar": 'Quand une Blinde est sélectionnée, gagnez +3 mains et perdez toutes vos défausses',
  "j_blackboard": '<span class="mult-mult">×3&nbsp;multi</span> si toutes les cartes en main sont noires (Pique ou Trèfle)',
  "j_runner": '<span class="text-chips">+15</span> Jetons si la main jouée contient une Suite',
  "j_ice_cream": '<span class="text-chips">+100</span> Jetons, <span class="text-chips">-5</span> Jetons par main jouée',
  "j_dna": 'Si la première main de la manche ne contient qu\'une carte, ajoute une copie permanente au jeu',
  "j_splash": 'Toutes les cartes jouées comptent pour le score',
  "j_blue_joker": '<span class="text-chips">+2</span> Jetons pour chaque carte restante dans le jeu',
  "j_sixth_sense": 'Si la première main de la manche est un 6 seul, le détruit et crée une carte Spectrale',
  "j_constellation": '<span class="mult-mult">×0.1&nbsp;multi</span> par carte Planète utilisée',
  "j_hiker": 'Chaque carte jouée gagne <span class="text-chips">+5</span> Jetons de façon permanente en marquant',
  "j_faceless": 'Gagnez <span class="text-money">5$</span> si 3 cartes Figure ou plus sont défaussées en même temps',
  "j_green_joker": '<span class="text-mult">+1</span> Multi. par main jouée, <span class="text-mult">-1</span> Multi. par défausse',
  "j_superposition": 'Crée une carte de Tarot si la main jouée contient un As et une Suite',
  "j_todo_list": 'Gagnez <span class="text-money">5$</span> si la main jouée correspond à la main de poker demandée (change chaque manche)',
  "j_cavendish": '<span class="mult-mult">×3&nbsp;multi</span>, mais <span class="text-probability">1/1000</span> d\'être détruit en fin de manche',
  "j_card_sharp": '<span class="mult-mult">×3&nbsp;multi</span> si la main de poker jouée a déjà été jouée dans cette manche',
  "j_red_card": '<span class="text-mult">+3</span> Multi. pour chaque Paquet Booster passé',
  "j_madness": 'Quand une Blinde est sélectionnée, gagne <span class="mult-mult">×0.5&nbsp;multi</span> et détruit un Joker au hasard',
  "j_square": '<span class="text-chips">+4</span> Jetons si la main jouée contient exactement 4 cartes',
  "j_seance": 'Si la main jouée est une Quinte flush, crée une carte Spectrale',
  "j_riff_raff": 'Crée 2 Jokers communs quand une Blinde est sélectionnée',
  "j_vampire": 'Gagne <span class="mult-mult">×0.1&nbsp;multi</span> par carte Améliorée jouée et supprime l\'amélioration',
  "j_shortcut": 'Permet de créer des Suites avec des écarts de valeur de 1 (ex: 10 8 6 5 3)',
  "j_hologram": 'Gagne <span class="mult-mult">×0.25&nbsp;multi</span> par carte à jouer ajoutée à votre jeu',
  "j_vagabond": 'Crée une carte de Tarot si la main est jouée avec <span class="text-money">4$</span> ou moins',
  "j_baron": 'Chaque Roi tenu en main octroie <span class="mult-mult">×1.5&nbsp;multi</span>',
  "j_cloud_9": 'Gagnez <span class="text-money">1$</span> pour chaque 9 dans votre jeu complet en fin de manche',
  "j_rocket": 'Gagnez <span class="text-money">1$</span> en fin de manche, augmente de <span class="text-money">2$</span> par Boss Blinde vaincue',
  "j_obelisk": '<span class="mult-mult">×0.2&nbsp;multi</span> par main jouée consécutivement sans jouer votre main de poker la plus jouée',
  "j_midas_mask": 'Toutes les cartes Figure jouées deviennent des cartes Or',
  "j_luchador": 'Vendez cette carte pour désactiver l\'effet de la Boss Blinde en cours',
  "j_photograph": 'La première carte Figure marquante octroie <span class="mult-mult">×2&nbsp;multi</span>',
  "j_gift": 'Ajoute <span class="text-money">1$</span> à la valeur de vente de chaque Joker et consommable en fin de manche',
  "j_turtle_bean": '+5 à la taille de la main, réduit de 1 chaque manche',
  "j_erosion": '<span class="text-mult">+4</span> Multi. pour chaque carte en dessous de 52 dans le jeu complet',
  "j_reserved_parking": 'Chaque carte Figure en main a <span class="text-probability">1/2</span> chance d\'octroyer <span class="text-money">1$</span>',
  "j_mail": 'Gagnez <span class="text-money">5$</span> pour chaque carte d\'une valeur donnée défaussée (change chaque manche)',
  "j_to_the_moon": 'Gagnez <span class="text-money">1$</span> d\'intérêt supplémentaire par tranche de <span class="text-money">5$</span> en fin de manche',
  "j_hallucination": 'Quand un Paquet Booster est ouvert, <span class="text-probability">1/2</span> d\'obtenir une carte de Tarot',
  "j_fortune_teller": '<span class="text-mult">+1</span> Multi. par carte de Tarot utilisée durant la partie (effet rétroactif)',
  "j_juggler": 'Taille de la main +1',
  "j_drunkard": '+1 défausse',
  "j_stone": 'Gagne <span class="text-chips">+25</span> Jetons pour chaque carte Pierre dans le jeu complet',
  "j_golden": 'Gagnez <span class="text-money">4$</span> à la fin de chaque manche',
  "j_lucky_cat": 'Gagne <span class="mult-mult">×0.25&nbsp;multi</span> chaque fois qu\'une carte Chance se déclenche avec succès',
  "j_baseball": 'Les Jokers Peu communs octroient chacun <span class="mult-mult">×1.5&nbsp;multi</span>',
  "j_bull": '<span class="text-chips">+2</span> Jetons pour chaque dollar possédé',
  "j_diet_cola": 'Vendez cette carte pour créer une Étiquette double gratuite',
  "j_trading": 'Si la première défausse de la manche ne contient qu\'une carte, la détruit et gagne <span class="text-money">3$</span>',
  "j_flash": '<span class="text-mult">+2</span> Multi. par relance effectuée dans le magasin',
  "j_popcorn": '<span class="text-mult">+20</span> Multi., <span class="text-mult">-4</span> Multi. par manche jouée',
  "j_trousers": '<span class="text-mult">+2</span> Multi. si la main contient une Double paire (commence à 0)',
  "j_ancient": '<span class="mult-mult">×1.5&nbsp;multi</span> pour chaque carte marquante d\'une couleur donnée (change chaque manche)',
  "j_ramen": '<span class="mult-mult">×2&nbsp;multi</span>, réduit de <span class="mult-mult">×0.01&nbsp;multi</span> par carte défaussée',
  "j_walkie_talkie": 'Chaque 10 ou 4 joué octroie <span class="text-chips">+10</span> Jetons et <span class="text-mult">+4</span> Multi.',
  "j_selzer": 'Redéclenche toutes les cartes jouées pendant les 10 prochaines mains',
  "j_castle": 'Octroie <span class="text-chips">+3</span> Jetons par carte d\'une couleur donnée défaussée (change chaque manche)',
  "j_smiley": 'Les cartes Figure jouées octroient <span class="text-mult">+5</span> Multi.',
  "j_campfire": 'Gagne <span class="mult-mult">×0.25&nbsp;multi</span> par carte vendue, réinitialisé à la victoire sur une Boss Blinde (commence à ×1)',
  "j_ticket": 'Les cartes Or jouées octroient <span class="text-money">4$</span> en marquant des points',
  "j_mr_bones": 'Empêche la mort si les Jetons marqués constituent au moins 25% des Jetons requis (s\'autodétruit)',
  "j_acrobat": '<span class="mult-mult">×3&nbsp;multi</span> à la dernière main jouée de la manche',
  "j_sock_and_buskin": 'Redéclenche toutes les cartes Figure jouées',
  "j_swashbuckler": 'Ajoute la valeur de vente des autres Jokers au Multi.',
  "j_troubadour": '+2 à la taille de la main, -1 main',
  "j_certificate": 'Ajoute une carte à jouer aléatoire avec un sceau aléatoire dans la main en début de manche',
  "j_smeared": 'Les Cœurs et les Carreaux comptent pour une même couleur, de même pour les Piques et les Trèfles',
  "j_throwback": '<span class="mult-mult">×0.25&nbsp;multi</span> par Blinde passée durant la partie (commence à ×1)',
  "j_hanging_chad": 'Redéclenche 2 fois la première carte marquante',
  "j_rough_gem": 'Les cartes <span class="text-diamond">♦ Carreau</span> marquantes octroient <span class="text-money">1$</span>',
  "j_bloodstone": 'Les cartes <span class="text-heart">♥ Cœur</span> marquantes ont <span class="text-probability">1/2</span> chance d\'octroyer <span class="mult-mult">×1.5&nbsp;multi</span>',
  "j_arrowhead": 'Les cartes <span class="text-spades">♠ Pique</span> marquantes octroient <span class="text-chips">+50</span> Jetons',
  "j_onyx_agate": 'Les cartes <span class="text-clubs">♣ Trèfle</span> marquantes octroient <span class="text-mult">+7</span> Multi.',
  "j_glass": 'Gagne <span class="mult-mult">×0.75&nbsp;multi</span> par carte Verre détruite (commence à ×1)',
  "j_ring_master": 'Les cartes Joker, Tarot, Planète et Spectrales peuvent apparaître plusieurs fois',
  "j_flower_pot": '<span class="mult-mult">×3&nbsp;multi</span> si la main jouée contient une carte de chaque couleur',
  "j_blueprint": 'Copie l\'effet du Joker situé à sa droite',
  "j_wee": 'Gagne <span class="text-chips">+8</span> Jetons pour chaque 2 joué marquant (commence à 0)',
  "j_merry_andy": '+3 défausses, -1 à la taille de la main',
  "j_oops": 'Double toutes les probabilités (1/3 devient 2/3 par exemple)',
  "j_idol": '<span class="mult-mult">×2&nbsp;multi</span> pour chaque carte spécifique marquante (change chaque manche)',
  "j_seeing_double": '<span class="mult-mult">×2&nbsp;multi</span> si la main jouée contient une carte Trèfle et une carte d\'une autre couleur, toutes deux marquantes',
  "j_matador": 'Gagnez <span class="text-money">8$</span> si la main jouée déclenche la capacité de la Boss Blinde',
  "j_hit_the_road": 'Octroie <span class="mult-mult">×0.5&nbsp;multi</span> par Valet défaussé durant la manche',
  "j_duo": '<span class="mult-mult">×2&nbsp;multi</span> si la main jouée contient une Paire',
  "j_trio": '<span class="mult-mult">×3&nbsp;multi</span> si la main jouée contient un Brelan',
  "j_family": '<span class="mult-mult">×4&nbsp;multi</span> si la main jouée contient un Carré',
  "j_order": '<span class="mult-mult">×3&nbsp;multi</span> si la main jouée contient une Suite',
  "j_tribe": '<span class="mult-mult">×2&nbsp;multi</span> si la main jouée contient une Couleur',
  "j_stuntman": '<span class="text-chips">+250</span> Jetons, -2 à la taille de la main',
  "j_invisible": 'Après 2 manches, vendez ce Joker pour dupliquer un Joker aléatoire (sans édition négative)',
  "j_brainstorm": 'Copie l\'effet du Joker le plus à gauche',
  "j_satellite": 'Gagnez <span class="text-money">1$</span> en fin de manche pour chaque carte Planète unique utilisée durant la partie',
  "j_shoot_the_moon": '<span class="text-mult">+13</span> Multi. pour chaque Reine en main',
  "j_drivers_license": '<span class="mult-mult">×3&nbsp;multi</span> si votre jeu complet contient au moins 16 cartes améliorées',
  "j_cartomancer": 'Crée une carte de Tarot lorsqu\'une Blinde est sélectionnée',
  "j_astronomer": 'Toutes les cartes Planète et les Paquets Céleste sont gratuits dans le magasin',
  "j_burnt": 'Augmente le niveau de la première main de poker défaussée à chaque manche',
  "j_bootstraps": '<span class="text-mult">+2</span> Multi. par tranche de <span class="text-money">5$</span> possédée',
  "j_caino": 'Gagne <span class="mult-mult">×1&nbsp;multi</span> à chaque carte Figure détruite (commence à ×1)',
  "j_triboulet": 'Les Rois et les Reines octroient <span class="mult-mult">×2&nbsp;multi</span> lorsqu\'ils marquent des points',
  "j_yorick": 'Gagne <span class="mult-mult">×1&nbsp;multi</span> toutes les 23 cartes défaussées',
  "j_chicot": 'Annule l\'effet de chaque Boss Blinde',
  "j_perkeo": 'Crée une copie négative d\'un consommable aléatoire en votre possession à la fin du magasin',
}

export const TAROT_DESCRIPTIONS: Record<string, string> = {
  "c_fool": 'Crée la carte de Tarot ou de Planète utilisée en dernier durant cette partie (Le Mat exclu)',
  "c_magician": 'Améliore 2 cartes sélectionnées en Carte Chance',
  "c_high_priestess": 'Crée jusqu\'à 2 cartes Planète aléatoires (selon la place disponible)',
  "c_empress": 'Améliore 2 cartes sélectionnées en Carte Multi',
  "c_emperor": 'Crée jusqu\'à 2 cartes de Tarot aléatoires (selon la place disponible)',
  "c_heirophant": 'Améliore 2 cartes sélectionnées en Carte Bonus',
  "c_lovers": 'Améliore 1 carte sélectionnée en Carte Libre',
  "c_chariot": 'Améliore 1 carte sélectionnée en Carte Acier',
  "c_justice": 'Améliore 1 carte sélectionnée en Carte Verre',
  "c_hermit": 'Double l\'argent (<span class="text-money">20$</span> au maximum)',
  "c_wheel_of_fortune": '<span class="text-probability">1/4</span> d\'ajouter une édition Aluminium, Holographique ou Polychrome à un Joker au hasard',
  "c_strength": 'Augmente la valeur d\'un maximum de 2 cartes sélectionnées de 1',
  "c_hanged_man": 'Détruit un maximum de 2 cartes sélectionnées',
  "c_death": 'Sélectionnez 2 cartes, la carte de gauche devient la carte de droite',
  "c_temperance": 'Octroie la valeur de vente totale de tous les Jokers actuels (<span class="text-money">50$</span> au maximum)',
  "c_devil": 'Améliore 1 carte sélectionnée en Carte Or',
  "c_tower": 'Améliore 1 carte sélectionnée en Carte Pierre',
  "c_star": 'Convertit jusqu\'à 3 cartes sélectionnées en <span class="text-diamond">♦ Carreau</span>',
  "c_moon": 'Convertit jusqu\'à 3 cartes sélectionnées en <span class="text-clubs">♣ Trèfle</span>',
  "c_sun": 'Convertit jusqu\'à 3 cartes sélectionnées en <span class="text-heart">♥ Cœur</span>',
  "c_judgement": 'Crée une carte Joker aléatoire (selon la place disponible)',
  "c_world": 'Convertit jusqu\'à 3 cartes sélectionnées en <span class="text-spades">♠ Pique</span>',
}

export const PLANET_DESCRIPTIONS: Record<string, string> = {
  "c_mercury": 'Niveau supérieur Paire. <span class="text-mult">+1</span> Multi. et <span class="text-chips">+15</span> Jetons',
  "c_venus": 'Niveau supérieur Brelan. <span class="text-mult">+2</span> Multi. et <span class="text-chips">+20</span> Jetons',
  "c_earth": 'Niveau supérieur Full House. <span class="text-mult">+2</span> Multi. et <span class="text-chips">+25</span> Jetons',
  "c_mars": 'Niveau supérieur Carré. <span class="text-mult">+3</span> Multi. et <span class="text-chips">+30</span> Jetons',
  "c_jupiter": 'Niveau supérieur Couleur. <span class="text-mult">+2</span> Multi. et <span class="text-chips">+15</span> Jetons',
  "c_saturn": 'Niveau supérieur Suite. <span class="text-mult">+2</span> Multi. et <span class="text-chips">+25</span> Jetons',
  "c_uranus": 'Niveau supérieur Double paire. <span class="text-mult">+1</span> Multi. et <span class="text-chips">+20</span> Jetons',
  "c_neptune": 'Niveau supérieur Quinte flush. <span class="text-mult">+3</span> Multi. et <span class="text-chips">+40</span> Jetons',
  "c_pluto": 'Niveau supérieur Carte Haute. <span class="text-mult">+1</span> Multi. et <span class="text-chips">+10</span> Jetons',
  "c_planet_x": 'Niveau supérieur Cinq cartes identiques. <span class="text-mult">+3</span> Multi. et <span class="text-chips">+35</span> Jetons',
  "c_ceres": 'Niveau supérieur Flush House. <span class="text-mult">+3</span> Multi. et <span class="text-chips">+40</span> Jetons',
  "c_eris": 'Niveau supérieur Flush Five. <span class="text-mult">+3</span> Multi. et <span class="text-chips">+40</span> Jetons',
}

export const SPECTRAL_DESCRIPTIONS: Record<string, string> = {
  "c_familiar": 'Détruit 1 carte aléatoire en main, ajoute 3 cartes Figure Améliorées aléatoires à votre main',
  "c_grim": 'Détruit 1 carte aléatoire en main, ajoute 2 As Améliorés aléatoires à votre main',
  "c_incantation": 'Détruit 1 carte aléatoire en main, ajoute 4 cartes numérotées Améliorées aléatoires à votre main',
  "c_talisman": 'Ajoute un Sceau Or à 1 carte sélectionnée en main',
  "c_aura": 'Ajoute un effet Aluminium, Holographique ou Polychrome à 1 carte sélectionnée en main',
  "c_wraith": 'Crée un Joker Rare aléatoire, met votre argent à <span class="text-money">0$</span>',
  "c_sigil": 'Convertit toutes les cartes en main en une seule couleur aléatoire',
  "c_ouija": 'Convertit toutes les cartes en main en une seule valeur aléatoire (-1 à la taille de la main)',
  "c_ectoplasm": 'Ajoute Négatif à un Joker aléatoire (-1 à la taille de la main)',
  "c_immolate": 'Détruit 5 cartes aléatoires en main, gagnez <span class="text-money">20$</span>',
  "c_ankh": 'Crée une copie d\'un Joker aléatoire, détruit tous les autres Jokers (retire le Négatif de la copie)',
  "c_deja_vu": 'Ajoute un Sceau Rouge à 1 carte sélectionnée en main',
  "c_hex": 'Ajoute Polychrome à un Joker aléatoire, détruit tous les autres Jokers',
  "c_trance": 'Ajoute un Sceau Bleu à 1 carte sélectionnée en main',
  "c_medium": 'Ajoute un Sceau Violet à 1 carte sélectionnée en main',
  "c_cryptid": 'Crée 2 copies d\'une carte sélectionnée en main',
  "c_soul": 'Crée un Joker Légendaire (selon la place disponible)',
  "c_black_hole": 'Augmente le niveau de chaque main de poker de 1',
}

export const VOUCHER_DESCRIPTIONS: Record<string, string> = {
  "v_overstock_norm": '+1 emplacement de carte disponible dans le magasin',
  "v_clearance_sale": 'Toutes les cartes et paquets du magasin sont vendus avec 25% de réduction',
  "v_hone": 'Les cartes Aluminium, Holographiques et Polychromes apparaissent 2x plus souvent',
  "v_reroll_surplus": 'Les relances du magasin coûtent <span class="text-money">2$</span> de moins',
  "v_crystal_ball": '+1 emplacement de consommable',
  "v_telescope": 'Les Paquets Célestes contiennent toujours la carte Planète pour votre main de poker la plus jouée',
  "v_grabber": 'Gagne de façon permanente +1 main par manche',
  "v_wasteful": 'Gagne de façon permanente +1 défausse par manche',
  "v_tarot_merchant": 'Les cartes de Tarot apparaissent 2x plus souvent dans le magasin',
  "v_planet_merchant": 'Les cartes Planète apparaissent 2x plus souvent dans le magasin',
  "v_seed_money": 'Augmente le plafond des intérêts perçus par manche de <span class="text-money">10$</span>',
  "v_blank": 'Ne fait rien',
  "v_magic_trick": 'Les cartes à jouer peuvent être achetées dans le magasin',
  "v_hieroglyph": '-1 Mise initiale, -1 main par manche',
  "v_directors_cut": 'Relance la Boss Blinde 1 fois par Ante, <span class="text-money">10$</span> par relance',
  "v_paint_brush": '+1 à la taille de la main',
  "v_overstock_plus": '+1 emplacement de carte disponible dans le magasin (4 cartes au total)',
  "v_liquidation": 'Toutes les cartes et paquets du magasin sont vendus avec 50% de réduction',
  "v_glow_up": 'Les cartes Aluminium, Holographiques et Polychromes apparaissent 4x plus souvent',
  "v_reroll_glut": 'Les relances du magasin coûtent <span class="text-money">2$</span> de moins supplémentaires',
  "v_omen_globe": 'Les cartes Spectrales peuvent apparaître dans n\'importe quel Paquet Arcana',
  "v_observatory": 'Les cartes Planète de votre zone Consommable octroient <span class="mult-mult">×1.5&nbsp;multi</span> pour leur main de poker spécifique',
  "v_nacho_tong": 'Gagne de façon permanente +1 main supplémentaire par manche',
  "v_recyclomancy": 'Gagne de façon permanente +1 défausse supplémentaire par manche',
  "v_tarot_tycoon": 'Les cartes de Tarot apparaissent 4x plus souvent dans le magasin',
  "v_planet_tycoon": 'Les cartes Planète apparaissent 4x plus souvent dans le magasin',
  "v_money_tree": 'Augmente encore le plafond des intérêts perçus par manche de <span class="text-money">20$</span>',
  "v_antimatter": '+1 emplacement de Joker',
  "v_illusion": 'Les cartes à jouer du magasin peuvent avoir une amélioration, un sceau et/ou une édition',
  "v_petroglyph": '-1 Mise initiale (à nouveau), -1 défausse par manche',
  "v_retcon": 'Relance la Boss Blinde un nombre illimité de fois, <span class="text-money">10$</span> par relance',
  "v_palette": '+1 à la taille de la main (à nouveau)',
}

const CONSUMABLE_DESCRIPTIONS: Record<string, string> = {
  ...TAROT_DESCRIPTIONS,
  ...PLANET_DESCRIPTIONS,
  ...SPECTRAL_DESCRIPTIONS,
}

const ALL_DESCRIPTIONS: Record<string, string> = {
  ...JOKER_DESCRIPTIONS,
  ...CONSUMABLE_DESCRIPTIONS,
  ...VOUCHER_DESCRIPTIONS,
}

/** Résout la description française statique d'une carte avec repli sur l'effet fourni par le jeu. */
export function getCardDescription(card: Card, hands?: GameState['hands']): string {
  let description = ALL_DESCRIPTIONS[card.key] ?? card.value.effect ?? '';
  if (card.set === CardSet.PLANET && hands) {
    let handLevel: number = 1;
    switch (card.key) {
      case 'c_mercury':
        handLevel = hands['Pair']?.level ?? 1;
        break;
      case 'c_venus':
        handLevel = hands['Three of a Kind']?.level ?? 1;
        break;
      case 'c_earth':
        handLevel = hands['Full House']?.level ?? 1;
        break;
      case 'c_mars':
        handLevel = hands['Four of a Kind']?.level ?? 1;
        break;
      case 'c_jupiter':
        handLevel = hands['Flush']?.level ?? 1;
        break;
      case 'c_saturn':
        handLevel = hands['Straight']?.level ?? 1;
        break;
      case 'c_uranus':
        handLevel = hands['Two Pair']?.level ?? 1;
        break;
      case 'c_neptune':
        handLevel = hands['Straight Flush']?.level ?? 1;
        break;
      case 'c_pluto':
        handLevel = hands['High Card']?.level ?? 1;
        break;
      case 'c_planet_x':
        handLevel = hands['Five of a Kind']?.level ?? 1;
        break;
      case 'c_ceres':
        handLevel = hands['Flush House']?.level ?? 1;
        break;
      case 'c_eris':
        handLevel = hands['Flush Five']?.level ?? 1;
        break;
    }
    description = `(niv. ${handLevel}) ${description}`
  }

  return description;
}

/** Une carte à jouer standard (Standard, éventuellement améliorée) est considérée
 * comme "modifiée" si elle porte une amélioration, un sceau et/ou une édition. */
export function isModifiedPlayingCard(card: Card): boolean {
  if (![CardSet.DEFAULT, CardSet.ENHANCED].includes(card.set)) {
    return false;
  }
  return card.set === CardSet.ENHANCED
    || card.modifier.seal !== null
    || card.modifier.edition !== null;
}

export interface PlayingCardValueDisplay {
  rank: string;
  suit: string;
  color: PlayingCardColor;
}

/** Formate le rang et la couleur (♥♦♣♠) d'une carte à jouer, pour un affichage
 * compact permettant de savoir de quelle carte il s'agit malgré la description. */
export function getPlayingCardValueDisplay(card: Card): PlayingCardValueDisplay | null {
  const suit = card.value.suit ? SUITS[card.value.suit.toUpperCase()] : undefined;
  if (!suit || !card.value.rank) {
    return null;
  }
  return {
    rank: card.value.rank.toUpperCase() === "T" ? "10" : card.value.rank.toUpperCase(),
    suit: suit.symbol,
    color: suit.color,
  };
}

