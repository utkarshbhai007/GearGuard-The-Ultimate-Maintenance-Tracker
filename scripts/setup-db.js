const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🔄 Setting up GearGuard database...');
    
    // Connect to MySQL without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    // Create database
    console.log('📦 Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'gearguard'}\``);
    console.log('✅ Database created successfully');

    // Close connection and reconnect to the specific database
    await connection.end();
    
    const dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gearguard',
      multipleStatements: true
    });

    console.log('🏗️  Creating tables and inserting sample data...');
    
    // Create tables one by one
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS teams (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        specialization ENUM('mechanical', 'electrical', 'it_support', 'general', 'hvac', 'plumbing') NOT NULL DEFAULT 'general',
        color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS users (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS equipment (
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
        \`condition\` ENUM('excellent', 'good', 'fair', 'poor', 'critical') NOT NULL DEFAULT 'good',
        purchase_cost DECIMAL(10, 2),
        image_url VARCHAR(255),
        notes TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (maintenance_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
        FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        subject VARCHAR(200) NOT NULL,
        description TEXT,
        equipment_id INT NOT NULL,
        team_id INT NOT NULL,
        request_type ENUM('corrective', 'preventive') NOT NULL DEFAULT 'corrective',
        priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
        status ENUM('new', 'in_progress', 'repaired', 'scrap') NOT NULL DEFAULT 'new',
        scheduled_date TIMESTAMP NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        duration_hours DECIMAL(5, 2),
        assigned_to INT,
        created_by INT NOT NULL,
        cost DECIMAL(10, 2),
        parts_used JSON,
        resolution_notes TEXT,
        attachments JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
      )`
    ];

    for (const statement of createStatements) {
      await dbConnection.execute(statement);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_team_id ON equipment(maintenance_team_id)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category)',
      'CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status)',
      'CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON maintenance_requests(equipment_id)',
      'CREATE INDEX IF NOT EXISTS idx_requests_team_id ON maintenance_requests(team_id)',
      'CREATE INDEX IF NOT EXISTS idx_requests_status ON maintenance_requests(status)',
      'CREATE INDEX IF NOT EXISTS idx_requests_priority ON maintenance_requests(priority)',
      'CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON maintenance_requests(assigned_to)',
      'CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON maintenance_requests(scheduled_date)'
    ];

    for (const index of indexes) {
      try {
        await dbConnection.execute(index);
      } catch (err) {
        // Ignore if index already exists
      }
    }

    // Insert sample data
    console.log('📝 Inserting sample data...');
    
    // Insert teams
    await dbConnection.execute(`
      INSERT IGNORE INTO teams (name, description, specialization, color) VALUES
      ('Mechanical Team', 'Handles all mechanical equipment maintenance', 'mechanical', '#EF4444'),
      ('Electrical Team', 'Responsible for electrical systems and equipment', 'electrical', '#F59E0B'),
      ('IT Support', 'Manages computers and IT infrastructure', 'it_support', '#3B82F6'),
      ('General Maintenance', 'Handles general facility maintenance', 'general', '#10B981'),
      ('HVAC Team', 'Heating, ventilation, and air conditioning specialists', 'hvac', '#8B5CF6')
    `);

    // Insert users (password is hashed for 'password123')
    await dbConnection.execute(`
      INSERT IGNORE INTO users (username, email, password, first_name, last_name, role, team_id, phone) VALUES
      ('admin', 'admin@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Admin', 'User', 'admin', NULL, '+1-555-0001'),
      ('manager1', 'manager@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'John', 'Manager', 'manager', 1, '+1-555-0002'),
      ('tech1', 'tech@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Mike', 'Technician', 'technician', 1, '+1-555-0003'),
      ('tech2', 'tech2@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'Sarah', 'Johnson', 'technician', 2, '+1-555-0004'),
      ('tech3', 'tech3@gearguard.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VjPoyNdO2', 'David', 'Wilson', 'technician', 3, '+1-555-0005')
    `);

    // Insert equipment
    await dbConnection.execute(`
      INSERT IGNORE INTO equipment (name, serial_number, category, department, location, maintenance_team_id, assigned_technician_id, manufacturer, model, purchase_date, \`condition\`, created_by) VALUES
      ('CNC Machine #001', 'CNC-2023-001', 'machinery', 'Production', 'Factory Floor A-1', 1, 3, 'Haas Automation', 'VF-2', '2023-01-15', 'good', 2),
      ('Forklift #001', 'FL-2022-001', 'vehicle', 'Warehouse', 'Loading Dock B', 1, 3, 'Toyota', '8FGU25', '2022-06-10', 'excellent', 2),
      ('Server Rack #001', 'SRV-2023-001', 'computer', 'IT', 'Data Center Room 1', 3, 5, 'Dell', 'PowerEdge R740', '2023-03-20', 'excellent', 2),
      ('HVAC Unit #001', 'HVAC-2021-001', 'facility', 'Building Maintenance', 'Rooftop Building A', 5, NULL, 'Carrier', '50TCQ', '2021-08-15', 'fair', 2),
      ('Printer #001', 'PRT-2023-001', 'computer', 'Office', 'Office Floor 2', 3, 5, 'HP', 'LaserJet Pro M404n', '2023-02-28', 'good', 2)
    `);

    // Insert maintenance requests
    await dbConnection.execute(`
      INSERT IGNORE INTO maintenance_requests (subject, description, equipment_id, team_id, request_type, priority, status, scheduled_date, assigned_to, created_by) VALUES
      ('Oil leak in CNC Machine', 'Machine is leaking oil from the hydraulic system', 1, 1, 'corrective', 'high', 'new', NOW(), 3, 2),
      ('Preventive maintenance for Forklift', 'Scheduled 500-hour maintenance check', 2, 1, 'preventive', 'medium', 'new', DATE_ADD(NOW(), INTERVAL 3 DAY), 3, 2),
      ('Server overheating issue', 'Server temperature alerts triggered', 3, 3, 'corrective', 'critical', 'in_progress', NOW(), 5, 2),
      ('HVAC filter replacement', 'Quarterly filter replacement due', 4, 5, 'preventive', 'low', 'new', DATE_ADD(NOW(), INTERVAL 7 DAY), NULL, 2),
      ('Printer paper jam', 'Frequent paper jams reported by users', 5, 3, 'corrective', 'medium', 'new', NOW(), 5, 2)
    `);

    // Update foreign key references for created_by in teams
    await dbConnection.execute('UPDATE teams SET created_by = 1 WHERE id IN (1, 2, 3, 4, 5)');

    console.log('✅ Database setup completed successfully!');
    console.log('🎉 You can now start the application with: npm run dev');
    console.log('\n📋 Demo accounts:');
    console.log('   Admin: admin@gearguard.com / password123');
    console.log('   Manager: manager@gearguard.com / password123');
    console.log('   Technician: tech@gearguard.com / password123');
    
    await dbConnection.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Make sure MySQL is running and your credentials in .env are correct');
    console.log('💡 Current settings:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   User: ${process.env.DB_USER || 'root'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'gearguard'}`);
    process.exit(1);
  }
}

setupDatabase();