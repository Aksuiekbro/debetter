import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Heading, Text, Button, SimpleGrid, Flex, Spinner,
  Badge, Divider, useToast, useColorModeValue, Icon
} from '@chakra-ui/react';
import { FaTrophy, FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const TournamentCard = ({ tournament }) => {
  const navigate = useNavigate();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Get status color
  const statusColor = 
    tournament.status === 'upcoming' ? 'blue' :
    tournament.status === 'in_progress' ? 'orange' :
    tournament.status === 'completed' ? 'green' : 'red';
  
  // Format dates
  const startDate = new Date(tournament.startDate).toLocaleDateString();
  const endDate = new Date(tournament.endDate).toLocaleDateString();
  
  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg" 
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={() => navigate(`/tournaments/${tournament._id}`)}
    >
      <Flex justify="space-between" align="flex-start">
        <Heading size="md" mb={2}>{tournament.name}</Heading>
        <Badge colorScheme={statusColor}>
          {tournament.status.replace('_', ' ')}
        </Badge>
      </Flex>
      
      <Text noOfLines={2} mb={4} color="gray.600">
        {tournament.description}
      </Text>
      
      <Divider my={3} />
      
      <Flex align="center" mt={2}>
        <Icon as={FaCalendarAlt} color="blue.500" mr={2} />
        <Text fontSize="sm">{startDate} - {endDate}</Text>
      </Flex>
      
      <Flex align="center" mt={2}>
        <Icon as={FaMapMarkerAlt} color="red.500" mr={2} />
        <Text fontSize="sm">{tournament.location}</Text>
      </Flex>
      
      <Flex align="center" mt={2}>
        <Icon as={FaUsers} color="green.500" mr={2} />
        <Text fontSize="sm">{tournament.teams?.length || 0} Teams</Text>
      </Flex>
      
      {tournament.winner && (
        <Flex align="center" mt={2}>
          <Icon as={FaTrophy} color="yellow.500" mr={2} />
          <Text fontSize="sm" fontWeight="bold">Winner: {tournament.winner.name}</Text>
        </Flex>
      )}
    </Box>
  );
};

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    fetchTournaments();
  }, []);
  
  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tournaments');
      setTournaments(response.data);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournaments.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" thickness="4px" />
      </Flex>
    );
  }
  
  if (tournaments.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Heading size="lg" mb={4}>No Tournaments Found</Heading>
        <Text color="gray.600" mb={6}>There are currently no tournaments available.</Text>
        {isAuthenticated && user?.role === 'admin' && (
          <Button colorScheme="blue" onClick={() => navigate('/admin/tournaments/new')}>
            Create Tournament
          </Button>
        )}
      </Box>
    );
  }
  
  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="xl">Tournaments</Heading>
        {isAuthenticated && user?.role === 'admin' && (
          <Button colorScheme="blue" onClick={() => navigate('/admin/tournaments/new')}>
            Create Tournament
          </Button>
        )}
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {tournaments.map(tournament => (
          <TournamentCard key={tournament._id} tournament={tournament} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default Tournaments; 