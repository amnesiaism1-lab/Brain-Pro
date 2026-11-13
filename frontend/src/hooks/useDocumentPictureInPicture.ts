import { useState, useCallback, useEffect, useRef } from 'react';

export interface PiPOptions {
  width?: number;
  height?: number;
  title?: string;
}

export function useDocumentPictureInPicture() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const pipWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
    setIsSupported(supported);
  }, []);

  const copyStylesToWindow = useCallback((targetWindow: Window) => {
    // 1. Copy link elements (external stylesheets like Google fonts, icon sets)
    document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const clonedLink = targetWindow.document.createElement('link');
      clonedLink.rel = 'stylesheet';
      clonedLink.href = (link as HTMLLinkElement).href;
      targetWindow.document.head.appendChild(clonedLink);
    });

    // 2. Copy inline style tags (Vite Tailwind injects styles into style tags)
    document.querySelectorAll('style').forEach((style) => {
      const clonedStyle = targetWindow.document.createElement('style');
      clonedStyle.textContent = style.textContent;
      targetWindow.document.head.appendChild(clonedStyle);
    });

    // 3. Fallback: Copy raw CSSRules for dynamically inserted stylesheets
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        if (sheet.cssRules && !sheet.href) {
          const styleEl = targetWindow.document.createElement('style');
          Array.from(sheet.cssRules).forEach((rule) => {
            styleEl.appendChild(targetWindow.document.createTextNode(rule.cssText));
          });
          targetWindow.document.head.appendChild(styleEl);
        }
      } catch (err) {
        // Ignore CORS-restricted cross-domain stylesheets
      }
    });
  }, []);

  const openPiP = useCallback(async (options: PiPOptions = {}) => {
    const width = options.width || 380;
    const height = options.height || 360;
    const title = options.title || 'Brain Exercises • Office Mini Studio';

    if (typeof window === 'undefined' || !('documentPictureInPicture' in window)) {
      console.warn('Document Picture-in-Picture is not supported in this browser. Fallback will be triggered.');
      return null;
    }

    try {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.focus();
        return pipWindowRef.current;
      }

      // @ts-ignore Document Picture-in-Picture API
      const win = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      });

      win.document.title = title;
      copyStylesToWindow(win);

      // Base body styling
      win.document.body.className = 'bg-slate-950 text-slate-100 overflow-hidden select-none m-0 p-0 font-sans antialiased';

      const handlePageHide = () => {
        setPipWindow(null);
        pipWindowRef.current = null;
      };

      win.addEventListener('pagehide', handlePageHide);

      setPipWindow(win);
      pipWindowRef.current = win;
      return win;
    } catch (err) {
      console.error('Failed to open Document Picture-in-Picture window:', err);
      return null;
    }
  }, [copyStylesToWindow]);

  const closePiP = useCallback(() => {
    if (pipWindowRef.current && !pipWindowRef.current.closed) {
      pipWindowRef.current.close();
    }
    setPipWindow(null);
    pipWindowRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (pipWindowRef.current && !pipWindowRef.current.closed) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return {
    isSupported,
    pipWindow,
    isOpen: !!pipWindow,
    openPiP,
    closePiP,
  };
}
