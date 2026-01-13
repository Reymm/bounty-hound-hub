import { createContext, useContext, useState, ReactNode } from 'react';
import { ReviewModal } from '@/components/ratings/ReviewModal';

interface ReviewModalContextType {
  openReviewModal: (bountyId: string) => void;
  closeReviewModal: () => void;
}

const ReviewModalContext = createContext<ReviewModalContextType | null>(null);

export function useReviewModal() {
  const context = useContext(ReviewModalContext);
  if (!context) {
    throw new Error('useReviewModal must be used within ReviewModalProvider');
  }
  return context;
}

interface ReviewModalProviderProps {
  children: ReactNode;
}

export function ReviewModalProvider({ children }: ReviewModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bountyId, setBountyId] = useState<string | null>(null);

  const openReviewModal = (id: string) => {
    setBountyId(id);
    setIsOpen(true);
  };

  const closeReviewModal = () => {
    setIsOpen(false);
    setBountyId(null);
  };

  return (
    <ReviewModalContext.Provider value={{ openReviewModal, closeReviewModal }}>
      {children}
      {bountyId && (
        <ReviewModal
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) closeReviewModal();
          }}
          bountyId={bountyId}
          onComplete={closeReviewModal}
        />
      )}
    </ReviewModalContext.Provider>
  );
}
