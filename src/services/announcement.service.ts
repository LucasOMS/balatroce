import { Injectable } from "@nestjs/common";
import { BehaviorSubject } from "rxjs";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gère l'affichage d'un message temporaire plein écran sur l'overlay
 * (ex : "Partie gagnée ! Bravo" lorsqu'un deck est terminé), de façon
 * similaire au message de redémarrage de {@link GameWatchdogService} mais
 * déclenché manuellement (par ex. par `GameCycleService`).
 */
@Injectable()
export class AnnouncementService {
  private readonly messageSubject = new BehaviorSubject<string | null>(null);
  /** Émet le message courant à afficher (`null` si aucun) */
  public readonly message$ = this.messageSubject.asObservable();

  public get current(): string | null {
    return this.messageSubject.value;
  }

  /** Affiche `message` pendant `durationMs` millisecondes, puis le masque. */
  public async announce(message: string, durationMs: number): Promise<void> {
    this.messageSubject.next(message);
    await sleep(durationMs);
    this.messageSubject.next(null);
  }
}

