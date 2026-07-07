import { useContext } from 'react';
import { CompanyContext } from '../contexts/companyContextInstance';

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}
