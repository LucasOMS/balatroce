import {Component} from "@angular/core";
import {GameOverlay} from './components/game-overlay/game-overlay';

@Component({
  selector: "app-root",
  imports: [GameOverlay],
  templateUrl: `./app.html`,
})
export class App {
}
