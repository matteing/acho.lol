/** A dismissible UI surface coordinated by the site's Escape handler. */
export interface SurfaceController {
  isOpen(): boolean;
  close(): void;
}

export interface NavigationController extends SurfaceController {
  close(restoreFocus?: boolean): void;
  trigger: HTMLButtonElement;
}
