CREATE DATABASE IF NOT EXISTS pan_tax_system;
USE pan_tax_system;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'Salaried',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pan_master_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pan_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    pan_status VARCHAR(50) DEFAULT 'Active',
    aadhaar_linked_status VARCHAR(50) DEFAULT 'Linked',
    aadhaar_last4 VARCHAR(4),
    mobile_last4 VARCHAR(4),
    email VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS pan_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pan_number VARCHAR(20) NOT NULL,
    name_on_pan VARCHAR(100),
    dob DATE,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    mismatch_reason TEXT,
    verified_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS financial_year_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    financial_year VARCHAR(20) UNIQUE NOT NULL,
    exemption_limit DECIMAL(10,2) NOT NULL,
    itr_due_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS form16_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    financial_year VARCHAR(20) NOT NULL,
    gross_salary DECIMAL(10,2) NOT NULL,
    deductions DECIMAL(10,2) DEFAULT 0,
    taxable_income DECIMAL(10,2),
    tds_deducted DECIMAL(10,2) DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tax_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    form16_id INT,
    financial_year VARCHAR(20),
    taxable_income DECIMAL(10,2),
    tax_payable VARCHAR(10),
    itr_required VARCHAR(10),
    refund_possible VARCHAR(10),
    analysis_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (form16_id) REFERENCES form16_details(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tax_analysis_id INT,
    task_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    due_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tax_analysis_id) REFERENCES tax_analysis(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type VARCHAR(50),
    file_path VARCHAR(255),
    ocr_text TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO pan_master_records
(pan_number, full_name, dob, pan_status, aadhaar_linked_status, aadhaar_last4, mobile_last4, email)
VALUES
('ABCDE1234F', 'Vedant Pawar', '2004-05-10', 'Active', 'Linked', '1234', '9876', 'vedant@example.com'),
('PQRSX5678L', 'Rahul Patil', '2003-08-15', 'Active', 'Not Linked', '4567', '1122', 'rahul@example.com'),
('LMNOP4321K', 'Sneha Deshmukh', '2002-12-20', 'Inactive', 'Linked', '7890', '3344', 'sneha@example.com')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    dob = VALUES(dob),
    pan_status = VALUES(pan_status),
    aadhaar_linked_status = VALUES(aadhaar_linked_status),
    aadhaar_last4 = VALUES(aadhaar_last4),
    mobile_last4 = VALUES(mobile_last4),
    email = VALUES(email);

INSERT INTO financial_year_rules
(financial_year, exemption_limit, itr_due_date)
VALUES
('2024-25', 300000.00, '2025-07-31'),
('2025-26', 300000.00, '2026-07-31')
ON DUPLICATE KEY UPDATE
    exemption_limit = VALUES(exemption_limit),
    itr_due_date = VALUES(itr_due_date);
