ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS native_scheme TEXT;
COMMENT ON COLUMN payment_methods.native_scheme IS 'Deep link scheme to open the payment app, e.g. paytmmp://pay or phonepe://pay or tez://upi/pay';
