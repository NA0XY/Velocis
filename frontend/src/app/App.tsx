import { useMemo } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routeConfig } from './routes';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider } from '../lib/theme';
import { TutorialProvider } from '../lib/tutorial';
import { TutorialOverlay } from './components/TutorialOverlay';

export default function App() {
  // Create the router inside the component so it is always mounted
  // within the AuthProvider tree — prevents useAuth context errors.
  const router = useMemo(() => createBrowserRouter(routeConfig), []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <TutorialProvider>
          <RouterProvider router={router} />
          {/* TutorialOverlay renders fixed/full-screen on top of everything */}
          <TutorialOverlay />
        </TutorialProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
