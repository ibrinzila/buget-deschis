export interface BudgetSector {
  id: string;
  name: string;
  nameRu: string;
  nameEn: string;
  code: string;
  approved: number; // millions MDL
  revised: number;
  actual: number;
  color: string;
  pct?: number;
}

export interface BudgetYearData {
  year: number;
  totalApproved: number;
  totalRevised: number;
  totalActual: number;
  executionRate: number;
  sectors: BudgetSector[];
}

export interface BudgetTrend {
  year: number;
  approved: number;
  actual: number;
  euFunds: number;
}

export interface Tender {
  id: string;
  ocid: string;
  title: string;
  titleRu: string;
  authority: string;
  authorityId: string;
  sector: string;
  sectorRo: string;
  value: number; // MDL
  currency: string;
  status: 'planning' | 'active' | 'awarded' | 'cancelled' | 'complete';
  method: 'open' | 'limited' | 'direct';
  publishedDate: string;
  deadlineDate: string;
  winner?: string;
  bids?: number;
}

export interface ProcurementStats {
  year: number;
  totalProcedures: number;
  totalVolumeMDL: number;
  activeTenders: number;
  awardedContracts: number;
  cancelledTenders: number;
  avgContractValue: number;
  competitiveRate: number;
}

export type Locale = 'ro' | 'ru' | 'en';
