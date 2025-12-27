-- GearGuard Database Setup Script
-- This script creates the database and tables for the GearGuard maintenance management system
-- Production-ready with optimized indexes, constraints, views, and triggers

-- Create database
CREATE DATABASE IF NOT EXISTS gearguard;
USE gearguard;

-- Create teams table
CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    specialization ENUM('mechanical', 'electrical', 'it_support', 'general', 'hvac', 'plumbing') NOT NULL DEFAULT 'general',
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_teams_specialization (specialization),
    INDEX idx_teams_active (is_active),
    INDEX idx_teams_created_by (created_by)
);

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'manager', 'technician', 'user') NOT NULL DEFAULT 'user',
    team_id INT,
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role),
    INDEX idx_users_team_id (team_id),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_login (last_login),
    FULLTEXT idx_users_search (first_name, last_name, email, username)
);

-- Create equipment table
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    category ENUM('machinery', 'vehicle', 'computer', 'tool', 'facility', 'other') NOT NULL DEFAULT 'other',
    department VARCHAR(100) NOT NULL,
    assigned_employee VARCHAR(100),
    location VARCHAR(200) NOT NULL,
    purchase_date DATE,
    warranty_expiry DATE,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    specifications JSON,
    maintenance_team_id INT NOT NULL,
    assigned_technician_id INT,
    status ENUM('active', 'maintenance', 'out_of_order', 'scrapped') NOT NULL DEFAULT 'active',
    condition ENUM('excellent', 'good', 'fair', 'poor', 'critical') NOT NULL DEFAULT 'good',
    purchase_cost DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    depreciation_rate DECIMAL(5, 2) DEFAULT 10.00,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    maintenance_interval_days INT DEFAULT 90,
    downtime_hours DECIMAL(8, 2) DEFAULT 0,
    total_maintenance_cost DECIMAL(10, 2) DEFAULT 0,
    image_url VARCHAR(255),
    qr_code VARCHAR(255),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_equipment_serial (serial_number),
    INDEX idx_equipment_category (category),
    INDEX idx_equipment_department (department),
    INDEX idx_equipment_location (location),
    INDEX idx_equipment_team_id (maintenance_team_id),
    INDEX idx_equipment_technician (assigned_technician_id),
    INDEX idx_equipment_status (status),
    INDEX idx_equipment_condition (condition),
    INDEX idx_equipment_warranty (warranty_expiry),
    INDEX idx_equipment_next_maintenance (next_maintenance_date),
    INDEX idx_equipment_created_at (created_at),
    FULLTEXT idx_equipment_search (name, serial_number, manufacturer, model, location)
);

-- Create maintenance_requests table
CREATE TABLE maintenance_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(200) NOT NULL,
    description TEXT,
    equipment_id INT NOT NULL,
    team_id INT NOT NULL,
    request_type ENUM('corrective', 'preventive', 'emergency', 'inspection') NOT NULL DEFAULT 'corrective',
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
    status ENUM('new', 'assigned', 'in_progress', 'on_hold', 'completed', 'cancelled', 'repaired', 'scrap') NOT NULL DEFAULT 'new',
    scheduled_date TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    duration_hours DECIMAL(5, 2),
    estimated_hours DECIMAL(5, 2),
    assigned_to INT,
    created_by INT NOT NULL,
    approved_by INT,
    cost DECIMAL(10, 2),
    labor_cost DECIMAL(10, 2),
    parts_cost DECIMAL(10, 2),
    parts_used JSON,
    tools_used JSON,
    resolution_notes TEXT,
    completion_percentage INT DEFAULT 0,
    progress_notes TEXT,
    estimated_completion TIMESTAMP NULL,
    attachments JSON,
    before_images JSON,
    after_images JSON,
    customer_satisfaction INT CHECK (customer_satisfaction BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_requests_equipment_id (equipment_id),
    INDEX idx_requests_team_id (team_id),
    INDEX idx_requests_assigned_to (assigned_to),
    INDEX idx_requests_created_by (created_by),
    INDEX idx_requests_status (status),
    INDEX idx_requests_priority (priority),
    INDEX idx_requests_type (request_type),
    INDEX idx_requests_scheduled_date (scheduled_date),
    INDEX idx_requests_created_at (created_at),
    INDEX idx_requests_completion (completion_percentage),
    FULLTEXT idx_requests_search (subject, description, resolution_notes)
);

-- Create notifications table for real-time updates
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    category ENUM('maintenance', 'equipment', 'team', 'system') DEFAULT 'system',
    related_id INT,
    related_type ENUM('equipment', 'request', 'user', 'team'),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_unread (user_id, is_read),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_category (category),
    INDEX idx_notifications_created_at (created_at)
);

-- Create audit_logs table for tracking changes
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user_id (user_id),
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at)
);

-- Create system_settings table
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_settings_key (setting_key),
    INDEX idx_settings_public (is_public)
);

-- Create maintenance_schedules table for recurring maintenance
CREATE TABLE maintenance_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    equipment_id INT NOT NULL,
    schedule_name VARCHAR(200) NOT NULL,
    description TEXT,
    interval_days INT NOT NULL,
    interval_type ENUM('days', 'weeks', 'months', 'years', 'hours', 'cycles') DEFAULT 'days',
    interval_value INT NOT NULL,
    last_performed DATE,
    next_due DATE NOT NULL,
    assigned_team_id INT,
    estimated_duration DECIMAL(5, 2),
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_schedules_equipment_id (equipment_id),
    INDEX idx_schedules_next_due (next_due),
    INDEX idx_schedules_team_id (assigned_team_id),
    INDEX idx_schedules_active (is_active)
);

-- Create useful views for reporting and analytics
CREATE VIEW v_equipment_summary AS
SELECT 
    e.id,
    e.name,
    e.serial_number,
    e.category,
    e.department,
    e.location,
    e.status,
    e.condition,
    e.purchase_cost,
    e.current_value,
    e.downtime_hours,
    e.total_maintenance_cost,
    t.name as team_name,
    u.first_name as technician_first_name,
    u.last_name as technician_last_name,
    COUNT(mr.id) as total_requests,
    COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN mr.status IN ('new', 'assigned', 'in_progress') THEN 1 END) as active_requests,
    AVG(mr.duration_hours) as avg_repair_time,
    SUM(mr.cost) as total_maintenance_spent
FROM equipment e
LEFT JOIN teams t ON e.maintenance_team_id = t.id
LEFT JOIN users u ON e.assigned_technician_id = u.id
LEFT JOIN maintenance_requests mr ON e.id = mr.equipment_id
GROUP BY e.id;

CREATE VIEW v_team_performance AS
SELECT 
    t.id,
    t.name,
    t.specialization,
    COUNT(DISTINCT u.id) as team_size,
    COUNT(DISTINCT e.id) as equipment_count,
    COUNT(mr.id) as total_requests,
    COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN mr.status IN ('new', 'assigned', 'in_progress') THEN 1 END) as active_requests,
    AVG(mr.duration_hours) as avg_completion_time,
    SUM(mr.cost) as total_costs,
    AVG(mr.customer_satisfaction) as avg_satisfaction
FROM teams t
LEFT JOIN users u ON t.id = u.team_id AND u.is_active = TRUE
LEFT JOIN equipment e ON t.id = e.maintenance_team_id
LEFT JOIN maintenance_requests mr ON t.id = mr.team_id
WHERE t.is_active = TRUE
GROUP BY t.id;

CREATE VIEW v_maintenance_dashboard AS
SELECT 
    COUNT(CASE WHEN mr.status = 'new' THEN 1 END) as new_requests,
    COUNT(CASE WHEN mr.status = 'in_progress' THEN 1 END) as in_progress_requests,
    COUNT(CASE WHEN mr.status = 'completed' THEN 1 END) as completed_requests,
    COUNT(CASE WHEN mr.priority = 'critical' AND mr.status NOT IN ('completed', 'cancelled') THEN 1 END) as critical_requests,
    COUNT(CASE WHEN e.status = 'out_of_order' THEN 1 END) as equipment_down,
    COUNT(CASE WHEN e.next_maintenance_date <= CURDATE() THEN 1 END) as overdue_maintenance,
    AVG(mr.duration_hours) as avg_repair_time,
    SUM(mr.cost) as total_maintenance_cost
FROM maintenance_requests mr
LEFT JOIN equipment e ON mr.equipment_id = e.id
WHERE mr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Create stored procedures for common operations
DELIMITER //

CREATE PROCEDURE sp_create_maintenance_request(
    IN p_subject VARCHAR(200),
    IN p_description TEXT,
    IN p_equipment_id INT,
    IN p_team_id INT,
    IN p_priority ENUM('low', 'medium', 'high', 'critical'),
    IN p_request_type ENUM('corrective', 'preventive', 'emergency', 'inspection'),
    IN p_created_by INT,
    OUT p_request_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    INSERT INTO maintenance_requests (
        subject, description, equipment_id, team_id, 
        priority, request_type, created_by
    ) VALUES (
        p_subject, p_description, p_equipment_id, p_team_id,
        p_priority, p_request_type, p_created_by
    );
    
    SET p_request_id = LAST_INSERT_ID();
    
    -- Update equipment status if critical
    IF p_priority = 'critical' THEN
        UPDATE equipment 
        SET status = 'maintenance' 
        WHERE id = p_equipment_id;
    END IF;
    
    COMMIT;
END //

CREATE PROCEDURE sp_complete_maintenance_request(
    IN p_request_id INT,
    IN p_resolution_notes TEXT,
    IN p_cost DECIMAL(10, 2),
    IN p_parts_used JSON,
    IN p_completed_by INT
)
BEGIN
    DECLARE v_equipment_id INT;
    DECLARE v_duration DECIMAL(5, 2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Get equipment ID and calculate duration
    SELECT equipment_id, 
           TIMESTAMPDIFF(HOUR, started_at, NOW()) 
    INTO v_equipment_id, v_duration
    FROM maintenance_requests 
    WHERE id = p_request_id;
    
    -- Update the request
    UPDATE maintenance_requests 
    SET status = 'completed',
        completed_at = NOW(),
        duration_hours = v_duration,
        resolution_notes = p_resolution_notes,
        cost = p_cost,
        parts_used = p_parts_used,
        completion_percentage = 100
    WHERE id = p_request_id;
    
    -- Update equipment
    UPDATE equipment 
    SET status = 'active',
        last_maintenance_date = CURDATE(),
        next_maintenance_date = DATE_ADD(CURDATE(), INTERVAL maintenance_interval_days DAY),
        total_maintenance_cost = total_maintenance_cost + p_cost
    WHERE id = v_equipment_id;
    
    COMMIT;
END //

DELIMITER ;

-- Create triggers for audit logging
DELIMITER //

CREATE TRIGGER tr_users_audit_insert 
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (NEW.id, 'INSERT', 'users', NEW.id, JSON_OBJECT(
        'username', NEW.username,
        'email', NEW.email,
        'role', NEW.role,
        'team_id', NEW.team_id
    ));
END //

CREATE TRIGGER tr_users_audit_update 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'users', NEW.id, 
        JSON_OBJECT(
            'username', OLD.username,
            'email', OLD.email,
            'role', OLD.role,
            'team_id', OLD.team_id
        ),
        JSON_OBJECT(
            'username', NEW.username,
            'email', NEW.email,
            'role', NEW.role,
            'team_id', NEW.team_id
        )
    );
END //

CREATE TRIGGER tr_equipment_audit_update 
AFTER UPDATE ON equipment
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NULL, 'UPDATE', 'equipment', NEW.id, 
        JSON_OBJECT(
            'status', OLD.status,
            'condition', OLD.condition,
            'location', OLD.location
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'condition', NEW.condition,
            'location', NEW.location
        )
    );
END //

CREATE TRIGGER tr_maintenance_requests_audit_update 
AFTER UPDATE ON maintenance_requests
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (NEW.assigned_to, 'UPDATE', 'maintenance_requests', NEW.id, 
        JSON_OBJECT(
            'status', OLD.status,
            'priority', OLD.priority,
            'assigned_to', OLD.assigned_to
        ),
        JSON_OBJECT(
            'status', NEW.status,
            'priority', NEW.priority,
            'assigned_to', NEW.assigned_to
        )
    );
END //

DELIMITER ;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('system_name', 'GearGuard Maintenance System', 'string', 'System display name', TRUE),
('version', '1.0.0', 'string', 'Current system version', TRUE),
('maintenance_mode', 'false', 'boolean', 'System maintenance mode', FALSE),
('registration_enabled', 'true', 'boolean', 'Allow new user registration', FALSE),
('max_file_size', '10485760', 'number', 'Maximum file upload size in bytes', FALSE),
('session_timeout', '604800', 'number', 'Session timeout in seconds (7 days)', FALSE),
('backup_frequency', 'daily', 'string', 'Database backup frequency', FALSE),
('email_notifications', 'true', 'boolean', 'Enable email notifications', FALSE),
('push_notifications', 'true', 'boolean', 'Enable push notifications', FALSE),
('maintenance_reminders', 'true', 'boolean', 'Enable maintenance reminders', FALSE),
('default_maintenance_interval', '90', 'number', 'Default maintenance interval in days', FALSE);

-- Insert sample data
-- Insert teams
INSERT INTO teams (name, description, specialization, color) VALUES
('Mechanical Team', 'Handles all mechanical equipment maintenance', 'mechanical', '#EF4444'),
('Electrical Team', 'Responsible for electrical systems and equipment', 'electrical', '#F59E0B'),
('IT Support', 'Manages computers and IT infrastructure', 'it_support', '#3B82F6'),
('General Maintenance', 'Handles general facility maintenance', 'general', '#10B981'),
('HVAC Team', 'Heating, ventilation, and air conditioning specialists', 'hvac', '#8B5CF6');

-- Insert users (passwords are hashed for 'password123')
INSERT INTO users (username, email, password, first_name, last_name, role, team_id, phone) VALUES
('admin', 'admin@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Admin', 'User', 'admin', NULL, '+1-555-0001'),
('manager1', 'manager@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'John', 'Manager', 'manager', 1, '+1-555-0002'),
('tech1', 'tech@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Mike', 'Technician', 'technician', 1, '+1-555-0003'),
('tech2', 'tech2@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Sarah', 'Johnson', 'technician', 2, '+1-555-0004'),
('tech3', 'tech3@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'David', 'Wilson', 'technician', 3, '+1-555-0005');

-- Insert equipment
INSERT INTO equipment (name, serial_number, category, department, location, maintenance_team_id, assigned_technician_id, manufacturer, model, purchase_date, condition, next_maintenance_date, created_by) VALUES
('CNC Machine #001', 'CNC-2023-001', 'machinery', 'Production', 'Factory Floor A-1', 1, 3, 'Haas Automation', 'VF-2', '2023-01-15', 'good', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 2),
('Forklift #001', 'FL-2022-001', 'vehicle', 'Warehouse', 'Loading Dock B', 1, 3, 'Toyota', '8FGU25', '2022-06-10', 'excellent', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 2),
('Server Rack #001', 'SRV-2023-001', 'computer', 'IT', 'Data Center Room 1', 3, 5, 'Dell', 'PowerEdge R740', '2023-03-20', 'excellent', DATE_ADD(CURDATE(), INTERVAL 60 DAY), 2),
('HVAC Unit #001', 'HVAC-2021-001', 'facility', 'Building Maintenance', 'Rooftop Building A', 5, NULL, 'Carrier', '50TCQ', '2021-08-15', 'fair', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 2),
('Printer #001', 'PRT-2023-001', 'computer', 'Office', 'Office Floor 2', 3, 5, 'HP', 'LaserJet Pro M404n', '2023-02-28', 'good', DATE_ADD(CURDATE(), INTERVAL 90 DAY), 2);

-- Insert maintenance requests
INSERT INTO maintenance_requests (subject, description, equipment_id, team_id, request_type, priority, status, scheduled_date, assigned_to, created_by) VALUES
('Oil leak in CNC Machine', 'Machine is leaking oil from the hydraulic system', 1, 1, 'corrective', 'high', 'new', NOW(), 3, 2),
('Preventive maintenance for Forklift', 'Scheduled 500-hour maintenance check', 2, 1, 'preventive', 'medium', 'new', DATE_ADD(NOW(), INTERVAL 3 DAY), 3, 2),
('Server overheating issue', 'Server temperature alerts triggered', 3, 3, 'corrective', 'critical', 'in_progress', NOW(), 5, 2),
('HVAC filter replacement', 'Quarterly filter replacement due', 4, 5, 'preventive', 'low', 'new', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, 2),
('Printer paper jam', 'Frequent paper jams reported by users', 5, 3, 'corrective', 'medium', 'new', NOW(), 5, 2);

-- Insert maintenance schedules
INSERT INTO maintenance_schedules (equipment_id, schedule_name, description, interval_days, interval_type, interval_value, next_due, assigned_team_id, estimated_duration, created_by) VALUES
(1, 'CNC Monthly Inspection', 'Monthly inspection and lubrication', 30, 'days', 30, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, 2.0, 2),
(2, 'Forklift Service', 'Quarterly service and safety check', 90, 'days', 90, DATE_ADD(CURDATE(), INTERVAL 90 DAY), 1, 4.0, 2),
(3, 'Server Maintenance', 'Monthly server maintenance and updates', 30, 'days', 30, DATE_ADD(CURDATE(), INTERVAL 30 DAY), 3, 1.5, 2),
(4, 'HVAC Filter Change', 'Quarterly filter replacement', 90, 'days', 90, DATE_ADD(CURDATE(), INTERVAL 90 DAY), 5, 1.0, 2);

-- Update foreign key references for created_by in teams
UPDATE teams SET created_by = 1 WHERE id IN (1, 2, 3, 4, 5);

COMMIT;