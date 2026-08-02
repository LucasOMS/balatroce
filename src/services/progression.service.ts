import { Injectable, Logger } from "@nestjs/common";
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { dirname } from "path";
import { Deck } from "../enums/deck.enum";
import { Stake } from "../enums/stake.enum";
import { DIFFICULTIES, PLAY_SET, PROGRESSION_STATE_PATH } from "../config/progression.config";

interface ProgressionState {
  /** Index courant dans {@link PLAY_SET} */
  deckIndex: number;
  /** Index courant dans {@link DIFFICULTIES} */
  stakeIndex: number;
}

/**
 * Gère la progression de la boucle de jeu : on enchaîne tous les decks de
 * {@link PLAY_SET} pour la difficulté courante, puis on passe à la
 * difficulté suivante dans {@link DIFFICULTIES} et on recommence tous les
 * decks, jusqu'à avoir fait la difficulté la plus haute (puis on reboucle).
 *
 * L'état courant est persisté sur disque ({@link PROGRESSION_STATE_PATH})
 * pour pouvoir reprendre là où on s'était arrêté après un redémarrage de
 * l'application. Si le fichier n'existe pas, on repart du premier deck en
 * première difficulté.
 */
@Injectable()
export class ProgressionService {
  private readonly logger = new Logger(ProgressionService.name);
  private state: ProgressionState;

  constructor() {
    this.state = this.load();
  }

  /** Deck et difficulté actuellement en cours. */
  public getCurrent(): { deck: Deck; stake: Stake } {
    return {
      deck: PLAY_SET[this.state.deckIndex],
      stake: DIFFICULTIES[this.state.stakeIndex],
    };
  }

  /**
   * Passe au deck suivant (ou à la difficulté suivante si tous les decks de
   * la difficulté courante ont été joués). Sauvegarde le nouvel état.
   */
  public advance(): { deck: Deck; stake: Stake } {
    let { deckIndex, stakeIndex } = this.state;
    deckIndex++;
    if (deckIndex >= PLAY_SET.length) {
      deckIndex = 0;
      stakeIndex++;
      if (stakeIndex >= DIFFICULTIES.length) {
        // Toutes les difficultés ont été jouées avec tous les decks : on reboucle.
        stakeIndex = 0;
        this.logger.log("Progression complète ! On reboucle depuis le début.");
      }
    }
    this.state = { deckIndex, stakeIndex };
    this.save();
    return this.getCurrent();
  }

  /** Réinitialise la progression au premier deck en première difficulté. */
  public reset(): void {
    this.state = { deckIndex: 0, stakeIndex: 0 };
    this.save();
    this.logger.log("Progression réinitialisée.");
  }

  private load(): ProgressionState {
    try {
      if (existsSync(PROGRESSION_STATE_PATH)) {
        const raw = readFileSync(PROGRESSION_STATE_PATH, "utf-8");
        const parsed = JSON.parse(raw) as Partial<ProgressionState>;
        const deckIndex = clampIndex(parsed.deckIndex, PLAY_SET.length);
        const stakeIndex = clampIndex(parsed.stakeIndex, DIFFICULTIES.length);
        this.logger.log(
          `Progression chargée : deck ${PLAY_SET[deckIndex]}, difficulté ${DIFFICULTIES[stakeIndex]}.`,
        );
        return { deckIndex, stakeIndex };
      }
    } catch (err) {
      this.logger.warn(
        `Impossible de lire la sauvegarde de progression, on repart du début : ${(err as Error).message}`,
      );
    }
    const initial: ProgressionState = { deckIndex: 0, stakeIndex: 0 };
    this.save(initial);
    return initial;
  }

  private save(state: ProgressionState = this.state): void {
    try {
      mkdirSync(dirname(PROGRESSION_STATE_PATH), { recursive: true });
      writeFileSync(PROGRESSION_STATE_PATH, JSON.stringify(state, null, 2), "utf-8");
    } catch (err) {
      this.logger.warn(
        `Impossible de sauvegarder la progression : ${(err as Error).message}`,
      );
    }
  }
}

/** Supprime le fichier de progression (utilisé par le script de reset). */
export function deleteProgressionFile(): void {
  if (existsSync(PROGRESSION_STATE_PATH)) {
    unlinkSync(PROGRESSION_STATE_PATH);
  }
}

function clampIndex(value: number | undefined, length: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value >= length) {
    return 0;
  }
  return value;
}

