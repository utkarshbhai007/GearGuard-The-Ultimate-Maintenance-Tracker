# GearGuard: The Ultimate Maintenance Tracker

A comprehensive maintenance management system that allows companies to track their assets (machines, vehicles, computers) and manage maintenance requests efficiently. Built with modern web technologies and designed for scalability and performance.

## 🚀 Features

### Core Functionality
- **Equipment Management**: Track all company assets with detailed information
- **Team Management**: Organize maintenance teams by specialization
- **Maintenance Requests**: Handle both corrective and preventive maintenance
- **Real-time Updates**: Live notifications and status updates via WebSocket
- **Smart Automation**: Auto-fill logic and workflow automation

### Key Workflows
1. **The Breakdown Flow**: Emergency repair request handling
2. **The Routine Checkup Flow**: Scheduled preventive maintenance
3. **Smart Button Integration**: Quick access to equipment-specific requests
4. **Drag & Drop Kanban**: Visual request status management

### User Interface
- **Dashboard**: Overview of maintenance operations with key metrics
- **Kanban Board**: Visual workflow management with drag-and-drop
- **Calendar View**: Schedule and track preventive maintenance
- **Reports & Analytics**: Performance metrics and cost analysis
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🛠 Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MySQL** database with Sequelize ORM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Joi** for input validation
- **bcryptjs** for password hashing

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form management
- **Socket.IO Client** for real-time updates
- **Axios** for API communication

### Security & Performance
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **CORS** configuration
- **Database indexing** for optimal performance

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gearguard
```

### 2. Install Dependencies
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Database Setup
```bash
# Create MySQL database and tables
mysql -u root -p < database/setup.sql
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=gearguard
# DB_USER=root
# DB_PASSWORD=your_password
# JWT_SECRET=your_super_secret_jwt_key_here
# PORT=5000
# CLIENT_URL=http://localhost:3000
```

### 5. Start the Application
```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
# Server only
npm run server

# Client only (in another terminal)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Admin | admin@gearguard.com | password123 | Full system access |
| Manager | manager@gearguard.com | password123 | Team and equipment management |
| Technician | tech@gearguard.com | password123 | Request handling and updates |

## 📊 Database Schema

### Core Tables
- **users**: System users with role-based access
- **teams**: Maintenance teams with specializations
- **equipment**: Company assets and equipment
- **maintenance_requests**: Work orders and requests

### Key Relationships
- Users belong to teams
- Equipment is assigned to maintenance teams
- Requests link equipment, teams, and technicians
- Auto-fill logic connects equipment to appropriate teams

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Equipment
- `GET /api/equipment` - List all equipment
- `POST /api/equipment` - Create new equipment
- `GET /api/equipment/:id` - Get equipment details
- `GET /api/equipment/:id/maintenance-requests` - Get equipment requests

### Teams
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create new team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member

### Maintenance Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `GET /api/requests/kanban` - Get kanban board data
- `PATCH /api/requests/:id/status` - Update request status
- `PATCH /api/requests/:id/assign` - Assign request to technician

### Dashboard & Reports
- `GET /api/dashboard/overview` - Dashboard statistics
- `GET /api/dashboard/team-performance` - Team performance metrics
- `GET /api/dashboard/equipment-utilization` - Equipment usage reports
- `GET /api/dashboard/cost-analysis` - Cost analysis reports

## 🔄 Real-time Features

The application uses WebSocket connections for real-time updates:

- **Request Status Changes**: Live updates when requests move through workflow
- **New Request Notifications**: Instant alerts for new maintenance requests
- **Team Assignments**: Real-time updates when technicians are assigned
- **Equipment Status Changes**: Live updates for equipment condition changes

## 🎯 Key Business Logic

### Auto-fill Logic
When creating a maintenance request:
1. User selects equipment
2. System automatically fills maintenance team from equipment record
3. Default technician is pre-selected if assigned to equipment

### Workflow States
- **New**: Request created, awaiting assignment
- **In Progress**: Technician working on the request
- **Repaired**: Work completed successfully
- **Scrap**: Equipment marked for disposal

### Smart Features
- **Smart Buttons**: Equipment forms show maintenance request count
- **Overdue Detection**: Automatic flagging of overdue requests
- **Status Automation**: Equipment status updates based on request status
- **Team Filtering**: Role-based data filtering for technicians

## 📈 Performance Optimizations

- Database indexing on frequently queried columns
- Pagination for large data sets
- Efficient SQL queries with proper joins
- Frontend state management and caching
- Image optimization and lazy loading
- API response compression

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Secure HTTP headers

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 📦 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# The built files will be in client/build/
```

### Environment Variables for Production
```bash
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=gearguard_prod
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://your-domain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@gearguard.com
- Documentation: [Wiki](https://github.com/your-repo/gearguard/wiki)

## 🎉 Acknowledgments

- Built for the Odoo Hackathon
- Inspired by modern maintenance management needs
- Thanks to all contributors and testers

---

**GearGuard** - Keeping your equipment running smoothly! 🔧⚙️