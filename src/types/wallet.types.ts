// ============================================
// Wallet Types
// ============================================

export type WalletCategory =
  | 'cash'
  | 'bank'
  | 'ewallet'
  | 'savings'
  | 'budget'
  | 'investment'
  | 'liability';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  wallet_category: WalletCategory;
  type?: string; // legacy field
  balance: number;
  provider: string | null;
  total_limit: number | null;
  used_limit: number | null;
  billing_cutoff_day: number | null;
  billing_due_offset_days: number | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateWalletDTO {
  name: string;
  icon: string;
  wallet_category: WalletCategory;
  balance?: number;
  provider?: string;
  total_limit?: number;
  billing_cutoff_day?: number;
  billing_due_offset_days?: number;
}

export interface UpdateWalletDTO extends Partial<CreateWalletDTO> {
  id: string;
}

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  admin_fee: number;
  date: string;
  notes: string | null;
  created_at: string;
  // Joined
  from_wallet?: Pick<Wallet, 'name' | 'icon'> | null;
  to_wallet?: Pick<Wallet, 'name' | 'icon'> | null;
}

export interface WalletTransferDTO {
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  admin_fee?: number;
  date?: string;
  notes?: string;
  description?: string;
  goal_id?: string | null;
}

export interface WalletCategoryInfo {
  label: string;
  icon: string;
  color: string;
}
