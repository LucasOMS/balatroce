import { Controller, Get } from "@nestjs/common";
import { OverlayService } from "../services/overlay.service";
import { OverlayInfo } from "../../shared/overlay-info";

@Controller("overlay")
export class OverlayController {
  constructor(private readonly overlayService: OverlayService) {}

  /** Retourne l'état overlay courant en interrogeant le bot */
  @Get("state")
  async getState(): Promise<OverlayInfo> {
    return this.overlayService.getCurrentInfo();
  }
}
