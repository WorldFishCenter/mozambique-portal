# Frontend Authentication System

This directory contains the frontend authentication components and services for the Mozambique Portal application.

## Structure

```
src/auth/
├── components/     # React components for authentication UI
├── context/        # React context for authentication state
├── hooks/          # Custom React hooks for authentication
├── services/       # API services and HTTP client
├── utils/          # Utility functions and constants
└── README.md       # This file
```

## Features

- React Context-based authentication state management
- Tabler UI-styled authentication components
- Automatic token refresh
- Protected route components
- Form validation
- Error handling and user feedback
- Local storage for token persistence

## Components

- `LoginForm` - User login form with Tabler styling
- `RegisterForm` - User registration form
- `ForgotPasswordForm` - Password recovery request form
- `ResetPasswordForm` - Password reset form
- `ProtectedRoute` - Route wrapper for authenticated access

## Context and Hooks

- `AuthContext` - Global authentication state
- `useAuth` - Hook for accessing authentication context
- `useAuthApi` - Hook for authentication API calls

## Services

- `authService` - HTTP client for authentication API calls
- `tokenService` - Token management and storage
- `validationService` - Form validation utilities

## Usage

### Basic Authentication Flow

```jsx
import { useAuth } from '../auth/context/AuthContext';

function LoginPage() {
  const { login, isLoading, error } = useAuth();

  const handleLogin = async (username, password) => {
    const success = await login(username, password);
    if (success) {
      // Redirect to dashboard
    }
  };

  // ... render login form
}
```

### Protected Routes

```jsx
import ProtectedRoute from '../auth/components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

## Styling

All authentication components use Tabler UI classes and components for consistent styling with the rest of the application.