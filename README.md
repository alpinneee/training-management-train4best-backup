# Train4Best - Course Registration System

A comprehensive course registration and management system built with Next.js, TypeScript, and Prisma ORM.

## Features

- User authentication with role-based access control (Admin, Instructor, Participant)
- Course management and scheduling
- Participant registration and enrollment tracking
- Instructor management and assignment
- Certificate generation and validation
- Payment processing and verification
- Interactive dashboards with analytics
- Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MySQL
- **Authentication**: NextAuth.js, JWT
- **UI Components**: Material UI, Radix UI, shadcn/ui
- **Charts & Visualization**: Recharts
- **Email**: Nodemailer, Resend
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MySQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd traun4bst-new
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database connection in `.env.local`:
```
DATABASE_URL="mysql://username:password@localhost:3306/train4best"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Seed the database:
```bash
npx prisma db seed
```

7. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── api/             # API routes
│   ├── (auth)/          # Authentication pages
│   ├── dashboard/       # Admin dashboard
│   ├── participant/     # Participant pages
│   ├── instructure/     # Instructor pages
│   └── ...              # Other pages
├── components/          # React components
│   ├── common/          # Shared components
│   ├── forms/           # Form components
│   ├── ui/              # UI components
│   └── ...              # Other component categories
├── lib/                 # Utilities and configurations
│   ├── constants/       # Configuration constants
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript type definitions
├── contexts/            # React contexts
└── providers/           # Auth providers
```

## Core Features

### Authentication & Authorization
- Multi-role user system (Admin, Instructor, Participant)
- Secure login with NextAuth and JWT
- Role-based access control
- Password reset functionality

### Course Management
- Course creation and scheduling
- Course type categorization
- Class management with location, room, and quota settings
- Course material management

### Participant System
- Registration and enrollment tracking
- Payment verification
- Certificate issuance
- Performance evaluation

### Instructor System
- Instructor profile management
- Class assignment
- Student evaluation
- Certificate management

### Certificate System
- Automatic certificate generation
- Certificate validation
- Expiry tracking
- PDF generation

### Payment System
- Multiple payment method support
- Payment verification
- Receipt generation
- Bank account management

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/logout` - User logout

### Courses
- `GET /api/courses` - Get all courses
- `POST /api/courses` - Create new course
- `GET /api/courses/[id]` - Get course by ID
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

### Participants
- `GET /api/participant` - Get all participants
- `POST /api/participant` - Create participant
- `GET /api/participant/[id]` - Get participant by ID
- `GET /api/participant/dashboard` - Get participant dashboard data

### Instructors
- `GET /api/instructure` - Get all instructors
- `POST /api/instructure` - Create instructor
- `GET /api/instructure/[id]` - Get instructor by ID
- `GET /api/instructure/my-courses` - Get instructor's courses

### Certificates
- `GET /api/certificate` - Get all certificates
- `POST /api/certificate` - Create certificate
- `GET /api/certificate/[id]` - Get certificate by ID
- `GET /api/certificate-expired` - Get expired certificates

## Database Models

The project uses Prisma ORM with the following main models:
- User
- UserType
- Course
- CourseType
- Class
- Participant
- Instructure
- Certificate
- Payment
- BankAccount
- CourseMaterial
- Attendance
- ValueReport

## Testing

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Deployment

For production deployment:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
