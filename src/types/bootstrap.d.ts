// Type declarations for Bootstrap 5
interface PopoverOptions {
  animation?: boolean;
  container?: string | Element | false;
  content?: string | Element | ((this: HTMLElement) => string | Element);
  delay?: number | { show: number; hide: number };
  html?: boolean;
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  selector?: string | false;
  template?: string;
  title?: string | Element | ((this: HTMLElement) => string | Element);
  trigger?: string;
  fallbackPlacements?: string[];
  boundary?: string | Element;
  customClass?: string | (() => string);
  sanitize?: boolean;
  allowList?: Record<string, string[]>;
  sanitizeFn?: ((input: string) => string) | null;
  offset?: [number, number] | string;
  popperConfig?: ((defaultBsPopperConfig: any) => any) | null;
}

interface Popover {
  dispose(): void;
  enable(): void;
  disable(): void;
  toggleEnabled(): void;
  toggle(): void;
  show(): void;
  hide(): void;
  update(): void;
}

interface PopoverStatic {
  new (element: Element, options?: PopoverOptions): Popover;
  getInstance(element: Element): Popover | null;
  getOrCreateInstance(element: Element, options?: PopoverOptions): Popover;
}

interface Bootstrap {
  Popover: PopoverStatic;
}

declare global {
  interface Window {
    bootstrap?: Bootstrap;
  }
}

export {};
