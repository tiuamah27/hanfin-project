# HanFin Project - Database Schema Documentation (Real)

Dokumentasi ini adalah hasil *pull* (tarikan) langsung dari database Supabase Anda yang asli.

## 1. profiles
Menyimpan profil pengguna.
* `id` (String, PK)
* `name` (String)
* `avatar_url` (String, nullable)
* `role` (String)
* `created_at` (String, nullable)

## 2. wallets
Menyimpan informasi dompet.
* `id` (String, PK)
* `user_id` (String, nullable, FK ke profiles)
* `name` (String)
* `icon` (String, nullable)
* `color` (String, nullable)
* `wallet_category` (String, nullable)
* `type` (String)
* `balance` (Number, nullable)
* `provider` (String, nullable)
* `total_limit` (Number, nullable)
* `used_limit` (Number, nullable)
* `billing_cutoff_day` (Number, nullable)
* `billing_due_offset_days` (Number, nullable)
* `is_active` (Boolean, nullable)
* `created_at` (String, nullable)

## 3. categories
Menyimpan kategori transaksi.
* `id` (String, PK)
* `name` (String)
* `type` (String)
* `icon` (String, nullable)
* `color` (String, nullable)
* `is_default` (Boolean, nullable)
* `budget_group_id` (String, nullable, FK ke budget_groups)

## 4. transactions
Rekam mutasi kas.
* `id` (String, PK)
* `user_id` (String, FK ke profiles)
* `wallet_id` (String, FK ke wallets)
* `category_id` (String, nullable, FK ke categories)
* `type` (String)
* `amount` (Number)
* `date` (String)
* `description` (String, nullable)
* `notes` (String, nullable)
* `tags` (Array of Strings, nullable)
* `budget_item_id` (String, nullable, FK ke budget_items)
* `goal_id` (String, nullable, FK ke goals)
* `is_split` (Boolean, nullable)
* `split_type` (String, nullable)
* `split_with` (String, nullable, FK ke profiles)
* `split_percentage_payer` (Number, nullable)
* `split_percentage_other` (Number, nullable)
* `installment_total_month` (Number, nullable)
* `paylater_bill_group_id` (String, nullable)
* `provider` (String, nullable)
* `created_at` (String, nullable)
* `updated_at` (String, nullable)

## 5. paylater_bills
Menyimpan data tagihan PayLater.
* `id` (String, PK)
* `user_id` (String, nullable)
* `wallet_id` (String, nullable, FK ke wallets)
* `transaction_id` (String, nullable, FK ke transactions)
* `provider` (String)
* `amount` (Number)
* `total_amount` (Number, nullable)
* `paid_amount` (Number, nullable)
* `remaining_amount` (Number, nullable)
* `status` (String)
* `billing_date` (String)
* `due_date` (String)
* `period_start` (String, nullable)
* `period_end` (String, nullable)
* `installment_group_id` (String, nullable)
* `created_at` (String, nullable)

## 6. paylater_bill_items
Menyimpan rincian cicilan per tagihan.
* `id` (String, PK)
* `bill_id` (String, nullable, FK ke paylater_bills)
* `transaction_id` (String, nullable, FK ke transactions)
* `installment_number` (Number)
* `installment_total` (Number)
* `amount` (Number)
* `created_at` (String, nullable)

## 7. Tabel Lainnya
Terdapat beberapa tabel spesifik lain yang terekam:
* `bills`: Tagihan langganan (Netflix, PLN, dll).
* `budget_groups`: Pengelompokan budget.
* `budget_items`: Rincian budget.
* `goals`: Tabungan berjangka.
* `goal_contributions`: Riwayat pengisian tabungan (menarik uang dari dompet).
* `wallet_transfers`: Riwayat transfer antar dompet (termasuk biaya admin).
