import {Component} from "@angular/core";
import {GameOverlayComponent} from './components/game-overlay/game-overlay.component';

@Component({
  selector: "app-root",
  imports: [GameOverlayComponent],
  templateUrl: `./app.html`,
})
export class App {
}
