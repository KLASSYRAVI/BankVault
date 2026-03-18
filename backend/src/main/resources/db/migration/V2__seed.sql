-- Passwords are plain text for NoOp testing
INSERT INTO users (id, username, email, password_hash, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'admin', 'admin@bank.com', 'Admin@123', 'ROLE_ADMIN'),
('22222222-2222-2222-2222-222222222222', 'customer1', 'cust1@bank.com', 'Customer@123', 'ROLE_CUSTOMER'),
('33333333-3333-3333-3333-333333333333', 'customer2', 'cust2@bank.com', 'Customer@123', 'ROLE_CUSTOMER');

INSERT INTO accounts (id, user_id, account_number, account_type, balance) VALUES
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'CHK1000000000001', 'CHECKING', 5000.00),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'CHK1000000000002', 'CHECKING', 3000.00);
