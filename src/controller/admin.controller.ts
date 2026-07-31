import { Controller, Get } from "@nestjs/common";
import { GameWatchdogService } from "../services/game-watchdog.service";

/**
 * Endpoints d'administration / debug (dev uniquement), utilisés notamment par
 * command-emulation.ts pour tester des scénarios difficiles à provoquer
 * naturellement (ex: plantage du jeu détecté par le GameWatchdogService).
 */
@Controller("admin")
export class AdminController {
  constructor(private readonly gameWatchdogService: GameWatchdogService) {}

  /**
   * Déclenche manuellement la séquence de relance du jeu, comme si le
   * watchdog avait détecté que le jeu ne répondait plus : affichage du
   * message de redémarrage sur l'overlay (avant toute coupure), pause du
   * timer de vote Twitch Plays, arrêt puis relance de Balatro.
   * Sans effet si une relance est déjà en cours.
   * GET /admin/restart-game
   */
  @Get("restart-game")
  restartGame(): { ok: boolean; alreadyRestarting: boolean } {
    const alreadyRestarting = this.gameWatchdogService.isRestarting();
    void this.gameWatchdogService.triggerRestart();
    return { ok: true, alreadyRestarting };
  }
}

