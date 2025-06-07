import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RoomIcon from '@mui/icons-material/Room';
import GroupsIcon from '@mui/icons-material/Groups';
import SubjectIcon from '@mui/icons-material/Subject';

// This component displays a card for each game a judge is assigned to
const JudgeGameCard = ({ 
  game, 
  onClick 
}) => {
  // Format game time for display (e.g., "12:00 - 13:00")
  const formatTimeRange = () => {
    const startTime = new Date(game.startTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + game.duration);
    
    return `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <Card 
      elevation={3} 
      sx={{ 
        mb: 2,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
        }
      }}
    >
      <CardActionArea onClick={() => onClick(game)}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            APF Debate
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              {formatTimeRange()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <RoomIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              {game.location}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <GroupsIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2">
              {game.team1.name} vs {game.team2.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SubjectIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="body2" noWrap sx={{ maxWidth: '90%' }}>
              {game.theme}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Chip 
              label={game.status === 'pending' ? 'Awaiting Evaluation' : 'Evaluated'} 
              color={game.status === 'pending' ? 'primary' : 'success'} 
              size="small"
            />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default JudgeGameCard;