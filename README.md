# Club Management CMS

This project is a Club Management Content Management System (CMS) designed to manage club members, including user authentication, member information management, and role-based access control.

## Features

- User authentication (login and registration)
- Member management (add, update, delete members)
- Role-based access control for admin and members
- Responsive frontend built with React and Vite

## Project Structure

```
club-management-cms
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   ├── middleware
│   │   ├── config
│   │   └── app.js
│   ├── package.json
│   └── .env
└── frontend
    ├── src
    │   ├── components
    │   ├── services
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- MongoDB (or any other database of your choice)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the backend directory and install dependencies:
   ```
   cd backend
   npm install
   ```

3. Set up your environment variables in the `.env` file.

4. Navigate to the frontend directory and install dependencies:
   ```
   cd ../frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm run dev
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features.

## License

This project is licensed under the MIT License.