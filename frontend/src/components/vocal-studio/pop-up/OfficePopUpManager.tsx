import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../../store/useAppStore';
import { useDocumentPictureInPicture } from '../../../hooks/useDocumentPictureInPicture';
import { OfficePitchRecallPopUp } from './OfficePitchRecallPopUp';

export const OfficePopUpManager: React.FC = () => {
  const {
    isOfficePopUpOpen,
    isOfficePopUpMinimized,
    officePopUpSize,
    currentOfficeQuestion,
    officeQuestionState,
    closeOfficePopUp,
  } = useAppStore();

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
        openPiP({ width: 380, height: 390, title: 'Brain Pro • Nhớ Cao Độ (Alt+Q)' }).then((win) => {
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
  }, [isOfficePopUpOpen, isSupported, isPipActive, openPiP, closePiP]);

  // Dynamically resize PiP window when minimized or resized
  useEffect(() => {
    if (pipWindow && !pipWindow.closed) {
      try {
        if (isOfficePopUpMinimized) {
          pipWindow.resizeTo(360, 140);
        } else if (officePopUpSize === 'expanded') {
          pipWindow.resizeTo(440, 480);
        } else {
          pipWindow.resizeTo(380, 390);
        }
      } catch (err) {
        // resizeTo can fail in sandboxed or untrusted contexts, ignore silently
      }
    }
  }, [pipWindow, isOfficePopUpMinimized, officePopUpSize]);

  // Tự động focus cửa sổ PiP khi có câu hỏi mới để người dùng có thể gõ phím ngay
  useEffect(() => {
    if (pipWindow && !pipWindow.closed && currentOfficeQuestion && officeQuestionState === 'waiting') {
      try {
        pipWindow.focus();
      } catch (err) {
        // ignore
      }
    }
  }, [pipWindow, currentOfficeQuestion, officeQuestionState]);

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
      <OfficePitchRecallPopUp
        onClose={() => {
          closePiP();
          closeOfficePopUp();
        }}
      />,
      pipWindow.document.body
    );
  }

  // Case B: In-App Floating Mini Dock Fallback (when PiP is unsupported or blocked)
  return (
    <div
      className={`fixed right-4 bottom-4 z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-slate-700/80 animate-fade-in transition-all duration-300 ${
        isOfficePopUpMinimized
          ? 'w-[360px] h-[90px]'
          : officePopUpSize === 'expanded'
          ? 'w-[440px] h-[480px]'
          : 'w-[380px] h-[390px]'
      }`}
      style={{
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 25px 0 rgba(16, 185, 129, 0.2)',
      }}
    >
      <OfficePitchRecallPopUp
        onClose={() => closeOfficePopUp()}
      />
    </div>
  );
};

