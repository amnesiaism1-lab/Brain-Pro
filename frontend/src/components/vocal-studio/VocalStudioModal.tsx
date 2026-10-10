import React from 'react';
import { VocalStudio } from './VocalStudio';

interface VocalStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPreflightModal?: () => void;
}

/**
 * VocalStudioModal
 * Fullscreen Studio shell wrapper maintaining 100% backward compatibility
 * with ExerciseDetailModal and VocalPitchMatchGame.
 */
export const VocalStudioModal: React.FC<VocalStudioModalProps> = ({
  isOpen,
  onClose,
  onOpenPreflightModal,
}) => {
  return (
    <VocalStudio
      isOpen={isOpen}
      onClose={onClose}
      onOpenPreflightModal={onOpenPreflightModal}
    />
  );
};
