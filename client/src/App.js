import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Debates from './components/Debates';
import DebateDetails from './components/DebateDetails';
import HostDebate from './components/HostDebate';
import Profile from './components/Profile';
import MyDebates from './components/MyDebates';
import TournamentManagement from './components/TournamentManagement';
import Tournaments from './components/Tournaments';
import JudgePanel from './components/JudgePanel';
import ApfTabulation from './components/ApfTabulation';
import ApfJudgeEvaluation from './components/ApfJudgeEvaluation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#32CD32', // lime green
    },
    secondary: {
      main: '#76ff03', // lighter lime
    },
    background: {
      default: '#f0f7f0', // light lime tinted background
    }
  },
  typography: {
    h2: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/debates" element={<Debates />} />
            <Route path="/debates/:id" element={<DebateDetails />} />
            <Route path="/host-debate" element={<HostDebate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-debates" element={<MyDebates />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/tournaments/:id/manage" element={<TournamentManagement />} />
            <Route path="/judge-panel" element={<JudgePanel />} />
            <Route path="/tabulation" element={<ApfTabulation />} />
            <Route path="/debates/:id/evaluate" element={<ApfJudgeEvaluation />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
