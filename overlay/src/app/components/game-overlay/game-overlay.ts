import {Component, computed, ElementRef, inject, signal, viewChild} from "@angular/core";
import {OverlaySocket} from "../../services/overlay-socket";
import {AvailableActions} from "../available-actions/available-actions";
import {JokerNumbers} from "./joker-numbers/joker-numbers";
import {CardNumbers} from "./card-numbers/card-numbers";
import {ShopCardDescriptions} from "./shop-card-descriptions/shop-card-descriptions";
import {ShopCardNumbers} from "./shop-card-numbers/shop-card-numbers";
import {ShopPackNumbers} from "./shop-pack-numbers/shop-pack-numbers";
import {ShopVoucherNumbers} from "./shop-voucher-numbers/shop-voucher-numbers";
import {GameCycleState} from '@shared/game-cycle-state';
import {BlindDescriptions} from './blind-descriptions/blind-descriptions';

@Component({
  selector: "app-game-overlay",
  imports: [
    AvailableActions,
    JokerNumbers,
    CardNumbers,
    ShopCardDescriptions,
    ShopCardNumbers,
    ShopPackNumbers,
    ShopVoucherNumbers,
    BlindDescriptions,
  ],
  templateUrl: "./game-overlay.html",
})
export class GameOverlay {
  private readonly overlaySocket = inject(OverlaySocket);

  protected readonly captureVideoRef = viewChild<ElementRef<HTMLVideoElement>>("captureVideo");
  protected readonly captureStream = signal<MediaStream | null>(null);

  /** Relit directement le signal du service */
  protected readonly overlayInfo = this.overlaySocket.overlayInfo;

  protected readonly gameState = computed(() => this.overlayInfo()?.gameState ?? null);
  protected readonly availableActions = computed(() => this.overlayInfo()?.availableActions ?? []);

  async startCapture(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      this.captureStream.set(stream);
      const video = this.captureVideoRef()?.nativeElement;
      if (video) {
        video.srcObject = stream;
      }
    } catch (err) {
      console.error("Erreur capture :", err);
    }
  }

  stopCapture(): void {
    this.captureStream()?.getTracks().forEach((t) => t.stop());
    this.captureStream.set(null);
  }

  protected readonly GameCycleState = GameCycleState;
}

