import {Component, computed, ElementRef, inject, signal, viewChild} from "@angular/core";
import {OverlaySocket} from "../../services/overlay-socket";
import {AvailableActionsComponent} from "../available-actions/available-actions.component";
import {JokerNumbersComponent} from "./joker-numbers/joker-numbers.component";
import {CardNumbersComponent} from "./card-numbers/card-numbers.component";
import {ShopCardDescriptionsComponent} from "./shop-card-descriptions/shop-card-descriptions.component";
import {ShopCardNumbersComponent} from "./shop-card-numbers/shop-card-numbers.component";
import {ShopPackNumbersComponent} from "./shop-pack-numbers/shop-pack-numbers.component";
import {ShopVoucherDescriptionsComponent} from "./shop-voucher-descriptions/shop-voucher-descriptions.component";
import {GameCycleState} from '@shared/game-cycle-state';
import {BlindDescriptionsComponent} from './blind-descriptions/blind-descriptions.component';
import {ConsumableNumbersComponent} from './consumable-numbers/consumable-numbers.component';
import {ShopVoucherNumbersComponent} from './shop-voucher-numbers/shop-voucher-numbers.component';
import {ShopPackDescriptionsComponent} from './shop-pack-descriptions/shop-pack-descriptions.component';
import {ConsumableDescriptionsComponent} from './consumable-descriptions/consumable-descriptions.component';

@Component({
  selector: "app-game-overlay",
  imports: [
    AvailableActionsComponent,
    JokerNumbersComponent,
    CardNumbersComponent,
    ShopCardDescriptionsComponent,
    ShopCardNumbersComponent,
    ShopPackNumbersComponent,
    ShopVoucherDescriptionsComponent,
    BlindDescriptionsComponent,
    ConsumableNumbersComponent,
    ShopVoucherNumbersComponent,
    ShopPackDescriptionsComponent,
    ConsumableDescriptionsComponent,
  ],
  templateUrl: "./game-overlay.component.html",
})
export class GameOverlayComponent {
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

