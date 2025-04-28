import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import telegramTheme from './theme/telegramTheme';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Debates from './components/Debates';
import DebateDetails from './components/DebateDetails';
import Profile from './components/Profile';
import MyDebates from './components/MyDebates';
import TournamentManagement from './components/TournamentManagement';
import Tournaments from './components/Tournaments';
import TournamentDetail from './components/TournamentDetail';
import JudgePanel from './components/JudgePanel';
import ApfTabulation from './components/ApfTabulation';
import ApfJudgeEvaluation from './components/ApfJudgeEvaluation';
import TeamRegistrationForm from './components/TeamRegistrationForm';
import PostingDetails from './components/PostingDetails';
// import LandingPage from './components/LandingPage'; // Removed unused import
import CreateTournamentForm from './components/CreateTournamentForm';
import DebaterFeedbackDisplay from './components/DebaterFeedbackDisplay';
import NotificationSettings from './components/NotificationSettings'; // Import NotificationSettings
import ActiveJudgeInterface from './components/ActiveJudgeInterface'; // Import the new interface
import JudgeLeaderboard from './components/JudgeLeaderboard'; // Import JudgeLeaderboard
import HostDebate from './components/HostDebate'; // Import HostDebate component
import TestFeed from './components/TournamentManagement/TestFeed'; // Import TestFeed component

// Using the imported Telegram-inspired theme

// Layout component that includes Navbar and Outlet for nested routes
const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

function App() {
  const { user, loading } = useAuth(); // Get user and loading state

  // Render loading state or null while auth check is in progress
  if (loading) {
    // You might want a more sophisticated loading indicator here
    return <div>Loading authentication state...</div>;
  }

  // Once loading is false, render the main application
  return (
    <ThemeProvider theme={telegramTheme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page route */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* All other routes with Navbar */}
            <Route element={<MainLayout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/debates" element={<Debates />} />
              <Route path="/debates/:id" element={<DebateDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-debates" element={<MyDebates />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournaments/:id" element={<TournamentDetail />} />
              <Route
                path="/tournaments/:id/manage"
                element={ // Simplified: Only check if user is logged in. Backend middleware handles specific authorization.
                  !loading && user
                  ? <TournamentManagement />
                  : <Navigate to="/login" replace /> // Redirect to login if not authenticated
                }
              />
              <Route path="/tournaments/:id/judge-leaderboard" element={<JudgeLeaderboard />} />
              <Route path="/create-tournament" element={<CreateTournamentForm />} />
              <Route
                path="/judge-panel"
                element={
                  ['judge', 'admin'].includes(localStorage.getItem('userRole'))
                  ? <JudgePanel />
                  : <Navigate to="/home" replace />
                }
              />
              <Route path="/tabulation" element={<ApfTabulation />} />
              <Route path="/debates/:id/evaluate" element={<ApfJudgeEvaluation />} />
              <Route path="/debates/:id/register-team" element={<TeamRegistrationForm />} />
              <Route path="/debates/:id/postings/:postingId" element={<PostingDetails />} />
              <Route path="/feedback/:debateId/:postingId" element={<DebaterFeedbackDisplay />} />
              {/* Add Notification Settings Route */}
              <Route path="/settings/notifications" element={<NotificationSettings />} />
              <Route path="/judge/:debateId/:postingId" element={<ActiveJudgeInterface />} />
              {/* Add the route for hosting a new debate */}
              <Route path="/host" element={<Navigate to="/create-tournament" replace />} />
              <Route path="/test-feed" element={<TestFeed />} />
           </Route>
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
