CREATE SEQUENCE IF NOT EXISTS withdrawals_order_seq START 1000000;

ALTER TABLE withdrawals ADD COLUMN order_number integer NOT NULL DEFAULT nextval('withdrawals_order_seq');

ALTER TABLE withdrawals ADD COLUMN order_id text GENERATED ALWAYS AS ('WDR-' || lpad(order_number::text, 7, '0')) STORED;

CREATE UNIQUE INDEX idx_withdrawals_order_id ON withdrawals(order_id);