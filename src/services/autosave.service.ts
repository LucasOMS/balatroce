import { Injectable, Logger } from "@nestjs/common";
import { existsSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { BotService } from "./bot.service";
import { GameCycleState, GameState } from "../interfaces/game-state";

/**
 * Gère la sauvegarde/reprise automatique de la run en cours.
 *
 * Utilisé par :
 * - `GameWatchdogService`, qui recharge explicitement cette sauvegarde une
 *   fois le jeu relancé et de nouveau joignable (c'est le point d'entrée
 *   principal pour la reprise après un plantage).
 * - `GameCycleService`, qui l'alimente en continu (sauvegarde à chaque
 *   changement d'état hors menu) et s'en sert aussi en solution de repli si
 *   l'état MENU est atteint sans être passé par une relance détectée par le
 *   watchdog.
 */
@Injectable()
export class AutosaveService {
  /**
   * Chemin du fichier de sauvegarde automatique. Le chemin envoyé à l'API
   * BalatroBot utilise des slashs (nativefs), celui utilisé côté Node pour
   * vérifier/supprimer le fichier garde le format natif de l'OS.
   */
  private readonly pathFs =
    process.env.AUTOSAVE_PATH ?? join(tmpdir(), "balatroce-autosave.jkr");
  private readonly pathApi = this.pathFs.replaceAll("\\", "/");

  private readonly logger = new Logger(AutosaveService.name);

  constructor(private readonly botService: BotService) {}

  public hasAutosave(): boolean {
    return existsSync(this.pathFs);
  }

  /** Supprime la sauvegarde automatique (run terminée normalement). */
  public clear(): void {
    try {
      if (existsSync(this.pathFs)) {
        unlinkSync(this.pathFs);
      }
    } catch (err) {
      this.logger.warn(
        `Impossible de supprimer la sauvegarde automatique : ${(err as Error).message}`,
      );
    }
  }

  /**
   * Sauvegarde automatiquement la run en cours (si `state` n'est pas MENU).
   * Une erreur ici n'est jamais bloquante pour l'appelant.
   */
  public async trySave(state: GameState): Promise<void> {
    if (state.state === GameCycleState.MENU) {
      return;
    }
    try {
      await this.botService.save(this.pathApi);
    } catch (err) {
      this.logger.debug(
        `Sauvegarde automatique échouée (non bloquant) : ${(err as Error).message}`,
      );
    }
  }

  /**
   * Recharge la sauvegarde automatique si elle existe. Retourne `true` si un
   * chargement a bien été effectué. Laisse remonter l'erreur en cas d'échec
   * du chargement (contrairement à `trySave`, un échec ici est important :
   * l'appelant ne doit pas croire que la partie a repris).
   */
  public async loadIfPresent(): Promise<boolean> {
    if (!this.hasAutosave()) {
      return false;
    }
    this.logger.log(
      "Sauvegarde automatique détectée : rechargement de la partie en cours.",
    );
    await this.botService.load(this.pathApi);
    return true;
  }
}

