import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useVocalStudioStore } from '../../../store/vocalStudioStore';
import { useDocumentPictureInPicture } from '../../../hooks/useDocumentPictureInPicture';
import { OfficeMiniPlayerPopUp } from './OfficeMiniPlayerPopUp';

export const OfficePopUpManager: React.FC = () => {
  const {
    isOfficePopUpOpen,
    closeOfficePopUp,
    openStudio,
    officeLayout,
  } = useVocalStudioStore();

  const {
    isSupported,
    pipWindow,
    isOpen: isPipActive,
    openPiP,
    closePiP,
  } = useDocumentPictureInPicture();

  const prevOfficePopUpOpen = useRef(isOfficePopUpOpen);

  // When store triggers isOfficePopUpOpen = true, attempt to open Document PiP if supported
  useEffect(() => {
    if (isOfficePopUpOpen && !prevOfficePopUpOpen.current) {
      if (isSupported && !isPipActive) {
        const width = officeLayout === 'ribbon' ? 420 : 380;
        const height = officeLayout === 'ribbon' ? 110 : 350;
        openPiP({ width, height }).then((win) => {
          if (!win) {
            console.log('Document PiP window rejected or blocked, falling back to In-App Floating Player.');
          }
        });
      }
    } else if (!isOfficePopUpOpen && prevOfficePopUpOpen.current) {
      if (isPipActive) {
        closePiP();
      }
    }
    prevOfficePopUpOpen.current = isOfficePopUpOpen;
  }, [isOfficePopUpOpen, isSupported, isPipActive, officeLayout, openPiP, closePiP]);

  // When PiP window is closed externally (by user clicking native X button)
  useEffect(() => {
    if (isPipActive && !pipWindow) {
      closeOfficePopUp();
    }
  }, [isPipActive, pipWindow, closeOfficePopUp]);

  if (!isOfficePopUpOpen) return null;

  // Case A: Rendered into Document Picture-in-Picture window via React Portal
  if (pipWindow) {
    return createPortal(
      <OfficeMiniPlayerPopUp
        onClose={() => {
          closePiP();
          closeOfficePopUp();
        }}
        onMaximize={() => {
          closePiP();
          closeOfficePopUp();
          openStudio();
        }}
      />,
      pipWindow.document.body
    );
  }

  // Case B: In-App Floating Mini Dock Fallback (when PiP is unsupported or inside tab)
  const isRibbon = officeLayout === 'ribbon';

  return (
    <div
      className={`fixed right-4 bottom-4 z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 animate-fade-in transition-all duration-200 ${
        isRibbon ? 'w-[420px] h-[105px]' : 'w-[370px] h-[340px]'
      }`}
      style={{
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 25px 0 rgba(16, 185, 129, 0.15)',
      }}
    >
      <OfficeMiniPlayerPopUp
        onClose={() => closeOfficePopUp()}
        onMaximize={() => {
          closeOfficePopUp();
          openStudio();
        }}
      />
    </div>
  );
};
