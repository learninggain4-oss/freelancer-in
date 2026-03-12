
-- Insert wallet type tiers
INSERT INTO public.wallet_types (name, description, icon_name, color, monthly_min_balance, wallet_max_capacity, transaction_limit, wallet_price, monthly_withdrawal_limit, monthly_transaction_limit, minimum_withdrawal, wallet_expiry, perks, upgrade_requirements, display_order)
VALUES
('Silver', 'Basic wallet tier - Free for everyone', 'Shield', '#94A3B8', 2500, 20000, 20000, 'Free', '1', '10', 500, 'Unlimited', ARRAY['Free Wallet','Help & Support','Unlimited Validity'], 'Available to all users by default', 1),
('Gold', 'Enhanced wallet with higher limits', 'Star', '#EAB308', 1500, 50000, 50000, '₹2,500/Yearly', '4', '30', 400, 'Unlimited', ARRAY['Higher Limits','Priority Support','4x Monthly Withdrawals'], 'Subscribe for ₹2,500/year to upgrade', 2),
('Platinum', 'Premium wallet for power users', 'Crown', '#A855F7', 1000, 100000, 100000, '₹4,000/Yearly', '8', '60', 200, 'Unlimited', ARRAY['Premium Limits','8x Withdrawals','₹1L Capacity','Low Min Withdrawal'], 'Subscribe for ₹4,000/year to upgrade', 3),
('Diamond', 'Ultimate wallet with unlimited access', 'Zap', '#3B82F6', 0, 0, 0, '₹6,000/Yearly', 'Unlimited', '60', 0, 'Unlimited', ARRAY['Unlimited Capacity','Unlimited Withdrawals','Zero Minimum','VIP Support'], 'Subscribe for ₹6,000/year to upgrade', 4);
