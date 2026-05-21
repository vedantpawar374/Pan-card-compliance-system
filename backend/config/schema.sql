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
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_rule_note TEXT,
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
    ais_tis_verified VARCHAR(10) DEFAULT 'No',
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
    estimated_tax_amount DECIMAL(10,2) DEFAULT 0,
    itr_required VARCHAR(10),
    tds_deducted DECIMAL(10,2) DEFAULT 0,
    refund_possible VARCHAR(10),
    refund_amount DECIMAL(10,2) DEFAULT 0,
    tax_due_amount DECIMAL(10,2) DEFAULT 0,
    ais_tis_verification_required VARCHAR(10) DEFAULT 'No',
    pan_aadhaar_issue VARCHAR(10) DEFAULT 'No',
    overall_compliance_status VARCHAR(20) DEFAULT 'Pending',
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
('LMNOP4321K', 'Sneha Deshmukh', '2002-12-20', 'Inactive', 'Linked', '7890', '3344', 'sneha@example.com'),
('ZYXWV9876P', 'Ananya Sharma', '1990-02-11', 'Active', 'Linked', '2345', '9988', 'ananya.sharma@example.com'),
('QWERT1234A', 'Rohan Singh', '1985-07-23', 'Active', 'Not Linked', '6789', '5566', 'rohan.singh@example.com'),
('ASDFG5678B', 'Priya Mehta', '1992-11-02', 'Active', 'Linked', '1122', '6677', 'priya.mehta@example.com'),
('ZXCVB4321C', 'Karan Verma', '1988-04-18', 'Inactive', 'Not Linked', '3344', '2233', 'karan.verma@example.com'),
('POIUY8765D', 'Neha Joshi', '1995-09-29', 'Active', 'Linked', '5566', '8899', 'neha.joshi@example.com'),
('LKJHG1234E', 'Amit Kumar', '1980-12-01', 'Active', 'Linked', '7788', '4455', 'amit.kumar@example.com'),
('MNBVC5678F', 'Sonal Gupta', '1983-03-15', 'Inactive', 'Linked', '9900', '1122', 'sonal.gupta@example.com'),
('QAZWS1234G', 'Deepak Nair', '1991-05-30', 'Active', 'Not Linked', '2233', '7788', 'deepak.nair@example.com'),
('EDCRF5678H', 'Meera Reddy', '1989-08-24', 'Active', 'Linked', '4455', '3344', 'meera.reddy@example.com'),
('RFVTC4321J', 'Vikram Patel', '1979-10-10', 'Inactive', 'Not Linked', '6677', '9900', 'vikram.patel@example.com'),
('TGGBY8765K', 'Radha Nain', '1994-01-05', 'Active', 'Linked', '8899', '5566', 'radha.nain@example.com'),
('YHNUJ1234L', 'Siddharth Jain', '1987-02-28', 'Active', 'Not Linked', '1001', '2233', 'siddharth.jain@example.com'),
('UJMKI5678M', 'Nisha Kapoor', '1993-06-21', 'Active', 'Linked', '3322', '6677', 'nisha.kapoor@example.com'),
('IKOLP4321N', 'Ritu Saxena', '1984-09-12', 'Inactive', 'Linked', '5544', '8899', 'ritu.saxena@example.com'),
('OLPQM8765O', 'Sunil Thomas', '1977-11-30', 'Active', 'Not Linked', '7766', '1100', 'sunil.thomas@example.com'),
('APWSX1234P', 'Ayesha Khan', '1996-03-08', 'Active', 'Linked', '9988', '3322', 'ayesha.khan@example.com'),
('SDERF5678Q', 'Harish Chandra', '1982-07-16', 'Active', 'Not Linked', '2211', '5544', 'harish.chandra@example.com'),
('FGTGB4321R', 'Simran Kaur', '1990-10-04', 'Inactive', 'Linked', '4433', '7766', 'simran.kaur@example.com'),
('HNBVF8765S', 'Anil Desai', '1978-01-19', 'Active', 'Linked', '6655', '9988', 'anil.desai@example.com'),
('JMKLO1234T', 'Ritika Bhatt', '1997-04-27', 'Active', 'Not Linked', '8877', '1100', 'ritika.bhatt@example.com'),
('KLPAS5678U', 'Tarun Joshi', '1986-05-14', 'Active', 'Linked', '0099', '3322', 'tarun.joshi@example.com'),
('ZSXED4321V', 'Bina Shah', '1981-08-25', 'Inactive', 'Not Linked', '2211', '5544', 'bina.shah@example.com'),
('XEDCV8765W', 'Naveen Reddy', '1992-12-31', 'Active', 'Linked', '4433', '7766', 'naveen.reddy@example.com'),
('CFTGB1234X', 'Geeta Yadav', '1994-02-13', 'Active', 'Linked', '6655', '9988', 'geeta.yadav@example.com'),
('VFRBN5678Y', 'Kunal Bhatia', '1989-06-09', 'Inactive', 'Not Linked', '8877', '1100', 'kunal.bhatia@example.com'),
('BGVFC4321Z', 'Priyanka Rao', '1991-07-18', 'Active', 'Linked', '0099', '3322', 'priyanka.rao@example.com'),
('NHYTR8765A', 'Aadil Sheikh', '1983-09-29', 'Active', 'Not Linked', '2211', '5544', 'aadil.sheikh@example.com'),
('MJUHY1234B', 'Shweta Sinha', '1987-11-04', 'Inactive', 'Linked', '4433', '7766', 'shweta.sinha@example.com'),
('IKOLP5678C', 'Vimal Ghosh', '1995-01-22', 'Active', 'Linked', '6655', '9988', 'vimal.ghosh@example.com'),
('QWSAZ4321D', 'Tanvi Mishra', '1998-03-03', 'Active', 'Not Linked', '8877', '1100', 'tanvi.mishra@example.com'),
('EDCRF8765E', 'Rakesh Tiwari', '1980-05-11', 'Active', 'Linked', '0099', '3322', 'rakesh.tiwari@example.com'),
('RFVGB1234F', 'Isha Nanda', '1993-06-29', 'Inactive', 'Linked', '2211', '5544', 'isha.nanda@example.com'),
('TGBVF5678G', 'Manish Yadav', '1988-08-06', 'Active', 'Not Linked', '4433', '7766', 'manish.yadav@example.com'),
('YHNJU4321H', 'Preeti Jain', '1997-10-17', 'Active', 'Linked', '6655', '9988', 'preeti.jain@example.com'),
('UJMKO8765I', 'Sandeep Rao', '1984-12-26', 'Active', 'Linked', '8877', '1100', 'sandeep.rao@example.com'),
('IKMLO1234J', 'Neelam Verma', '1990-02-08', 'Inactive', 'Not Linked', '0099', '3322', 'neelam.verma@example.com'),
('OLPKI5678K', 'Aarav Sharma', '1996-05-20', 'Active', 'Linked', '2211', '5544', 'aarav.sharma@example.com'),
('PASDF4321L', 'Maya Singh', '1982-07-07', 'Active', 'Not Linked', '4433', '7766', 'maya.singh@example.com'),
('QAZXC8765M', 'Jatin Kapoor', '1991-09-18', 'Active', 'Linked', '6655', '9988', 'jatin.kapoor@example.com'),
('WSXED1234N', 'Karina Das', '1995-11-29', 'Inactive', 'Linked', '8877', '1100', 'karina.das@example.com'),
('EDCFR5678O', 'Ashok Nair', '1986-01-10', 'Active', 'Not Linked', '0099', '3322', 'ashok.nair@example.com'),
('RFVGT4321P', 'Sakshi Jain', '1994-03-22', 'Active', 'Linked', '2211', '5544', 'sakshi.jain@example.com'),
('TGBHY8765Q', 'Dilip Mehta', '1979-05-30', 'Active', 'Linked', '4433', '7766', 'dilip.mehta@example.com'),
('YHNUJ1234R', 'Kavita Sethi', '1993-08-12', 'Inactive', 'Not Linked', '6655', '9988', 'kavita.sethi@example.com')
ON DUPLICATE KEY UPDATE
    full_name = VALUES(full_name),
    dob = VALUES(dob),
    pan_status = VALUES(pan_status),
    aadhaar_linked_status = VALUES(aadhaar_linked_status),
    aadhaar_last4 = VALUES(aadhaar_last4),
    mobile_last4 = VALUES(mobile_last4),
    email = VALUES(email);

INSERT INTO financial_year_rules
(financial_year, exemption_limit, tax_rate, tax_rule_note, itr_due_date)
VALUES
('2024-25', 300000.00, 5.00, 'Simplified rule for mini-project tax analysis.', '2025-07-31'),
('2025-26', 300000.00, 7.50, 'Salaried user rule for FY 2025-26.', '2026-07-31'),
('2026-27', 300000.00, 10.00, 'Expanded tax rate for FY 2026-27.', '2027-07-31')
ON DUPLICATE KEY UPDATE
    exemption_limit = VALUES(exemption_limit),
    tax_rate = VALUES(tax_rate),
    tax_rule_note = VALUES(tax_rule_note),
    itr_due_date = VALUES(itr_due_date);
