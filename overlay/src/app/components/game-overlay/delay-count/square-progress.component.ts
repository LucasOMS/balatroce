import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  numberAttribute,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Frame-style progress indicator — direct translation of Android FrameProgressView.
 *
 * A thick border around the host drains symmetrically from top-center
 * down both sides toward bottom-center.
 *
 * Layout: absolutely positioned segments (no CSS grid) so that the 4
 * corner pieces can be *bigger* than the straight-edge thickness and
 * overlap into the content area — this is required to draw a proper
 * rounded corner (see below). The 6 straight-edge segments and the
 * content area are inset by `thickness` as usual.
 *
 * Each segment's gradient position is driven by the `--seg-p` custom
 * property (0%→100%), computed directly from the `progression` input
 * (0 to 1) weighted by each segment's real pixel distance (straight edges
 * vs quarter-circle corner arcs), so the wipe always looks visually linear
 * regardless of the frame's aspect ratio.
 *
 * `progression` is expected to be driven by the consumer at a high enough
 * frequency (ideally every animation frame, with the exact real-time
 * value) that no CSS transition/easing is needed here — deliberately so:
 * a CSS transition applied independently per DOM element causes visible
 * desync at segment boundaries (one segment finishing noticeably later or
 * earlier than its neighbour starts), since each element's transition
 * "chases" its own target on its own schedule. Applying `--seg-p` directly
 * from the same `progression` value for all 10 segments in the same
 * render guarantees they always line up exactly, and also means a
 * backward jump (the consumer resetting `progression`, e.g. a new
 * countdown starting) never animates — there is simply nothing to ease.
 *
 * Corner rounding: for a corner to be a proper arc, its bounding box must
 * be at least as big as the arc's *outer* radius (a quarter circle of
 * radius R exactly fits an R×R box when centered on one of its corners).
 * Since the arc is centered on the corner cell's *inner* corner (matching
 * the conic-gradient pivot used for the color wipe), the box — and the
 * outer radius itself — must be `2 * radius`:
 * - corner box size = outer radius = `2 * radius`
 * - inner radius (the hole) = outer radius - `thickness`
 * A `mask-image` (radial-gradient "ring", centered on that same inner
 * pivot) then clips each corner box down to just that annulus quarter,
 * letting the content show through the hole and the page show through
 * outside the outer arc.
 *
 * Colors: filled = primary-975, emptied = primary-990
 */
@Component({
  selector: 'app-square-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'block w-full h-full pointer-events-none touch-none'},
  template: `
    <div
      #frame
      class="frame relative w-full h-full"
      [style.border-radius.px]="radius()"
    >
      <!-- Straight edges -->
      <div
        class="seg seg-top-left absolute top-0"
        [style.left.px]="cornerSize()"
        [style.width.px]="halfEdgeLength()"
        [style.height.px]="thickness()"
        [style.--seg-p.%]="segP(0)"
      ></div>
      <div
        class="seg seg-top-right absolute top-0"
        [style.right.px]="cornerSize()"
        [style.width.px]="halfEdgeLength()"
        [style.height.px]="thickness()"
        [style.--seg-p.%]="segP(0)"
      ></div>
      <div
        class="seg seg-left absolute left-0"
        [style.top.px]="cornerSize()"
        [style.width.px]="thickness()"
        [style.height.px]="sideLength()"
        [style.--seg-p.%]="segP(2)"
      ></div>
      <div
        class="seg seg-right absolute right-0"
        [style.top.px]="cornerSize()"
        [style.width.px]="thickness()"
        [style.height.px]="sideLength()"
        [style.--seg-p.%]="segP(2)"
      ></div>
      <div
        class="seg seg-bottom-left absolute bottom-0"
        [style.left.px]="cornerSize()"
        [style.width.px]="halfEdgeLength()"
        [style.height.px]="thickness()"
        [style.--seg-p.%]="segP(4)"
      ></div>
      <div
        class="seg seg-bottom-right absolute bottom-0"
        [style.right.px]="cornerSize()"
        [style.width.px]="halfEdgeLength()"
        [style.height.px]="thickness()"
        [style.--seg-p.%]="segP(4)"
      ></div>

      <!-- Content, inset by the border thickness -->
      <div
        class="absolute min-h-0 min-w-0"
        [style.inset.px]="thickness()"
        [style.border-radius.px]="innerRadius()"
      >
        <ng-content />
      </div>

      <!-- Corners: bigger box (2×radius), overlapping into the content area, clipped by a mask -->
      <div
        class="seg seg-corner-tl absolute top-0 left-0"
        [style.width.px]="cornerSize()"
        [style.height.px]="cornerSize()"
        [style.--seg-p.%]="segP(1)"
        [style.mask-image]="cornerMasks().tl"
        [style.-webkit-mask-image]="cornerMasks().tl"
      ></div>
      <div
        class="seg seg-corner-tr absolute top-0 right-0"
        [style.width.px]="cornerSize()"
        [style.height.px]="cornerSize()"
        [style.--seg-p.%]="segP(1)"
        [style.mask-image]="cornerMasks().tr"
        [style.-webkit-mask-image]="cornerMasks().tr"
      ></div>
      <div
        class="seg seg-corner-bl absolute bottom-0 left-0"
        [style.width.px]="cornerSize()"
        [style.height.px]="cornerSize()"
        [style.--seg-p.%]="segP(3)"
        [style.mask-image]="cornerMasks().bl"
        [style.-webkit-mask-image]="cornerMasks().bl"
      ></div>
      <div
        class="seg seg-corner-br absolute bottom-0 right-0"
        [style.width.px]="cornerSize()"
        [style.height.px]="cornerSize()"
        [style.--seg-p.%]="segP(3)"
        [style.mask-image]="cornerMasks().br"
        [style.-webkit-mask-image]="cornerMasks().br"
      ></div>
    </div>
  `,
  styles: [`
    @property --seg-p {
      syntax: '<percentage>';
      initial-value: 0%;
      inherits: false;
    }

    .frame {
      overflow: hidden;
    }

    .seg {
      background-color: var(--progress-color);
    }

    /*
     * Drain path (per side, symmetric):
     *   top-center → outward → TL/TR corner (arc) → side down → BL/BR corner (arc) → inward → bottom-center
     *
     * Linear segments: --seg-p 0→100% maps directly to the gradient stop.
     * Corner arcs: --seg-p 0→100% maps to 0→25% of the conic (= 90° quarter).
     */

    /* Top edge: empty wipes outward from center */
    .seg-top-left {
      background: linear-gradient(in oklab to left, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }

    .seg-top-right {
      background: linear-gradient(in oklab to right, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }

    /* Corners: conic quarter-arc, pivot at inner corner, scaled to 25% of circle */
    .seg-corner-tl {
      background: conic-gradient(from 270deg at 100% 100%, var(--progress-color) calc((100% - var(--seg-p)) * 0.25), var(--frame-color) calc((100% - var(--seg-p)) * 0.25));
    }

    .seg-corner-tr {
      background: conic-gradient(from 0deg at 0% 100%, var(--frame-color) calc(var(--seg-p) * 0.25), var(--progress-color) calc(var(--seg-p) * 0.25));
    }

    .seg-corner-bl {
      background: conic-gradient(from 180deg at 100% 0%, var(--progress-color) calc((100% - var(--seg-p)) * 0.25), var(--frame-color) calc((100% - var(--seg-p)) * 0.25));
    }

    .seg-corner-br {
      background: conic-gradient(from 90deg at 0% 0%, var(--frame-color) calc(var(--seg-p) * 0.25), var(--progress-color) calc(var(--seg-p) * 0.25));
    }

    /* Side edges: empty wipes top to bottom */
    .seg-left {
      background: linear-gradient(in oklab to bottom, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }

    .seg-right {
      background: linear-gradient(in oklab to bottom, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }

    /* Bottom edge: empty wipes inward toward center */
    .seg-bottom-left {
      background: linear-gradient(in oklab to right, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }

    .seg-bottom-right {
      background: linear-gradient(in oklab to left, var(--frame-color) var(--seg-p), var(--progress-color) var(--seg-p));
    }
  `],
})
export class SquareProgressComponent implements AfterViewInit, OnDestroy {
  /** Progression du décompte, de 0 (début) à 1 (terminé). */
  public readonly progression = input(0, {transform: numberAttribute});

  /**
   * Rayon (px) de l'arrondi du cadre.
   *
   * Note : le rayon EXTÉRIEUR réel de l'arc de coin (et donc la taille de
   * la boîte du coin) vaut `2 * radius` — voir `cornerSize`.
   */
  public readonly radius = input(16, {transform: numberAttribute});

  /** Épaisseur (px) du cadre. */
  public readonly thickness = input(24, {transform: numberAttribute});

  private readonly frameRef = viewChild.required<ElementRef<HTMLElement>>('frame');
  private readonly frameWidth = signal(0);
  private readonly frameHeight = signal(0);
  private resizeObserver?: ResizeObserver;

  /** Rayon extérieur réel de l'arc de coin = taille (px) de la boîte de coin. */
  protected readonly cornerSize = computed(() => 2 * Math.max(0, this.radius()));

  /** Rayon (px) de l'arrondi intérieur (trou central), déduit de l'épaisseur du cadre. */
  protected readonly innerRadius = computed(() => Math.max(0, this.cornerSize() - this.thickness()));

  /** Longueur (px) d'une moitié de bord droit horizontal (haut/bas). */
  protected readonly halfEdgeLength = computed(() => Math.max(0, this.frameWidth() / 2 - this.cornerSize()));

  /** Longueur (px) d'un bord droit vertical (gauche/droite). */
  protected readonly sideLength = computed(() => Math.max(0, this.frameHeight() - 2 * this.cornerSize()));

  /** Distance réelle (px) de chacun des 5 segments symétriques du chemin de vidage. */
  private readonly distances = computed(() => {
    const topHalf = this.halfEdgeLength();
    // Le chemin visuellement "vidé" au niveau du coin suit le milieu de
    // l'anneau (entre rayon intérieur et extérieur), pas le rayon
    // extérieur — sinon le coin se voit attribuer plus de temps que ce
    // qu'il occupe réellement visuellement, ce qui désynchronise sa fin
    // par rapport au début du segment suivant.
    const middleRadius = (this.cornerSize() + this.innerRadius()) / 2;
    const cornerArc = (Math.PI * middleRadius) / 2; // quarter-circle arc length
    const side = this.sideLength();
    const bottomHalf = this.halfEdgeLength();

    return [topHalf, cornerArc, side, cornerArc, bottomHalf];
  });

  /** Fractions cumulées (0..1) marquant le début/fin de chaque segment le long du chemin total. */
  private readonly breakpoints = computed(() => {
    const distances = this.distances();
    const total = distances.reduce((a, b) => a + b, 0) || 1;

    const bp = [0];
    let acc = 0;
    for (const d of distances) {
      acc += d;
      bp.push(acc / total);
    }
    return bp;
  });

  /** Progression locale (0..1) de chacun des 5 segments, dérivée de `progression()`. */
  private readonly segmentProgress = computed(() => {
    const p = Math.min(1, Math.max(0, this.progression()));
    const bp = this.breakpoints();

    return bp.slice(0, -1).map((start, i) => {
      const end = bp[i + 1];
      if (end <= start) {
        return p >= end ? 1 : 0;
      }
      return Math.min(1, Math.max(0, (p - start) / (end - start)));
    });
  });

  /** Masques (anneau arrondi extérieur/intérieur) pour chacun des 4 coins. */
  protected readonly cornerMasks = computed(() => {
    const outer = this.cornerSize();

    if (outer <= 0) {
      return {tl: 'none', tr: 'none', bl: 'none', br: 'none'};
    }

    const inner = this.innerRadius();
    const build = (pos: string) =>
      `radial-gradient(circle at ${pos}, transparent ${inner}px, white ${inner}px, white ${outer}px, transparent ${outer}px)`;

    // Le pivot correspond à celui du conic-gradient pour le même coin : le
    // coin *intérieur* de la cellule (celui qui touche la zone de contenu),
    // pas le coin extérieur du cadre.
    return {
      tl: build('100% 100%'),
      tr: build('0% 100%'),
      bl: build('100% 0%'),
      br: build('0% 0%'),
    };
  });

  protected segP(index: number): number {
    return this.segmentProgress()[index] * 100;
  }

  ngAfterViewInit(): void {
    const frame = this.frameRef().nativeElement;

    this.resizeObserver = new ResizeObserver(([entry]) => {
      const {width, height} = entry.contentRect;
      this.frameWidth.set(width);
      this.frameHeight.set(height);
    });
    this.resizeObserver.observe(frame);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
