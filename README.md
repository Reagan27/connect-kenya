# Connect Kenya - Community Events Platform

A full-stack web application for discovering, creating, and managing community events across Kenya. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

### For Users
- **Event Discovery**: Browse events across all 47 counties of Kenya
- **Event Creation**: Create and publish your own events
- **Event Registration**: Join events with simple registration process
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live event information and attendee counts

### For Administrators
- **Event Management**: Approve, edit, or delete events
- **User Management**: View and manage registered users
- **Analytics Dashboard**: Track event performance and user engagement
- **Content Moderation**: Review and approve event submissions

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet.js, bcryptjs, rate limiting
- **Validation**: express-validator
- **Logging**: Winston

## Prerequisites

Before running this project, make sure you have:

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/connect-kenya.git
   cd connect-kenya
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=connect_kenya
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=your_jwt_secret_key
   ALLOWED_ORIGINS=http://localhost:3000
   ```

4. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE connect_kenya;
   ```

5. **Start the application**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Database Schema

The application automatically creates the following tables:

- **users**: User accounts and authentication
- **counties**: Kenya's 47 counties
- **areas**: Sub-counties and constituencies
- **events**: Event information and details
- **event_attendees**: Event registration records

## Default Admin Account

After first setup, use these credentials to access the admin panel:

- **Email**: `admin@connectkenya.com`
- **Password**: `admin123`

**Important**: Change the default admin password immediately after first login.

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Events
- `GET /api/events` - Get all approved events
- `POST /api/events` - Create new event (requires auth)
- `POST /api/events/:id/join` - Join an event

### Geography
- `GET /api/counties` - Get all counties
- `GET /api/areas?county=CountyName` - Get areas by county

### Admin (requires admin role)
- `GET /api/admin/events` - Get all events
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event

## Project Structure

```
connect-kenya/
├── server.js              # Main server file
├── public/
│   └── index.html         # Frontend application
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables
└── README.md             # This file
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `DB_HOST`: PostgreSQL host (default: localhost)
- `DB_PORT`: PostgreSQL port (default: 5432)
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: Secret key for JWT tokens
- `ALLOWED_ORIGINS`: CORS allowed origins

### Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- Helmet.js security headers
- SQL injection prevention with parameterized queries

## Usage

### Creating an Event

1. Register or login to your account
2. Click "Create Event" button
3. Fill in event details:
   - Title and description
   - Category (sports, social, business, etc.)
   - Location (county and area)
   - Date and time
   - Price (0 for free events)
   - Contact information
   - M-Pesa transaction code for payment

### Joining an Event

1. Browse events on the homepage
2. Click on any event to view details
3. Click "Join Event" button
4. Enter your name and phone number
5. Receive confirmation

### Admin Management

1. Login with admin credentials
2. Access admin dashboard
3. Review pending events
4. Manage users and content
5. View analytics and reports

## Development

### Running in Development Mode

```bash
# Install nodemon for auto-restart
npm install -g nodemon

# Start with auto-restart
nodemon server.js
```

### Database Reset

To reset the database (useful for development):

```sql
DROP DATABASE connect_kenya;
CREATE DATABASE connect_kenya;
```

Then restart the application to recreate tables.

## Deployment

### Heroku Deployment

1. Create a Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy the code

```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### Production Considerations

- Use environment variables for all sensitive data
- Set up SSL/HTTPS
- Configure proper CORS origins
- Set up database backups
- Monitor application logs
- Use a process manager like PM2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Ensure database exists

2. **JWT Token Issues**
   - Clear browser localStorage
   - Check JWT_SECRET is set
   - Verify token hasn't expired

3. **Events Not Loading**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check database contains sample data

### Logs and Debugging

The application uses Winston for logging. Check console output for:
- Database connection status
- Authentication attempts
- API request errors
- Server startup messages

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support or questions:
- Create an issue on GitHub
- Email: support@connectkenya.com
- Check the troubleshooting section above

## Roadmap

Future enhancements planned:
- Mobile app (React Native)
- Event photos and media upload
- Payment integration (M-Pesa API)
- Email notifications
- Social sharing features
- Event reviews and ratings
- Calendar integration
- Multi-language support
