'use client';
import { createContext, useContext } from 'react';
import type { Partner } from '@/lib/types';

interface PartnerContextType {
  partner: Partner | null;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export function usePartner() {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

export default PartnerContext;
