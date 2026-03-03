import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routeConfig } from './routes';
import { AuthProvider } from '../lib/auth';

export default function App() {
  // Create the router inside the component so it is always mounted
  // within the AuthProvider tree — prevents useAuth context errors.
  const router = useMemo(() => createBrowserRouter(routeConfig), []);

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
