import {Component, computed, ElementRef, input, signal, viewChild} from "@angular/core";
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
import {JokerDescriptionsComponent} from './joker-descriptions/joker-descriptions.component';
import {OverlayInfo} from '@shared/overlay-info';
import {SealDescriptionsComponent} from './seal-descriptions/seal-descriptions.component';
import {PackOpeningComponent} from './pack-opening/pack-opening.component';
import {environment} from '../../../environments/environment';

@Component({
  selector: "app-game-overlay",
  imports: [
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
    JokerDescriptionsComponent,
    SealDescriptionsComponent,
    PackOpeningComponent,
  ],
  host: {class: 'block'},
  templateUrl: "./game-overlay.component.html",
})
export class GameOverlayComponent {
  protected readonly useChromaKeyBackground = environment.gameOverlay.useChromaKeyBackground;
  protected readonly captureVideoRef = viewChild<ElementRef<HTMLVideoElement>>("captureVideo");
  protected readonly captureStream = signal<MediaStream | null>(null);

  /** Relit directement le signal du service */
  public readonly overlayInfo = input.required<OverlayInfo | null>()

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
