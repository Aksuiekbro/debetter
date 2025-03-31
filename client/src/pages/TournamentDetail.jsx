import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Text, Button, SimpleGrid, Flex, Spinner,
  Badge, Divider, useToast, useColorModeValue, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, FormControl, FormLabel,
  Input, NumberInput, NumberInputField, NumberDecrementStepper,
  NumberIncrementStepper, NumberInputStepper, Textarea, useDisclosure
} from '@chakra-ui/react';
import axios from 'axios';
import TournamentBracket from '../components/TournamentBracket';
import { useAuth } from '../contexts/AuthContext';

const TournamentDetail = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [notes, setNotes] = useState('');
  const toast = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tournaments/${id}`);
      setTournament(response.data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tournament details.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreUpdate = (roundIndex, matchIndex) => {
    const match = tournament.rounds[roundIndex].matches[matchIndex];
    setSelectedMatch({ roundIndex, matchIndex, match });
    
    // If this judge has already scored, prefill the form
    if (match.judgeScores) {
      const judgeScore = match.judgeScores.find(
        score => score.judge === user?._id
      );
      
      if (judgeScore) {
        setTeam1Score(judgeScore.team1Score);
        setTeam2Score(judgeScore.team2Score);
        setNotes(judgeScore.notes || '');
      } else {
        setTeam1Score(0);
        setTeam2Score(0);
        setNotes('');
      }
    }
    
    onOpen();
  };

  const handleSubmitScores = async () => {
    try {
      const { roundIndex, matchIndex } = selectedMatch;
      
      await axios.put(
        `/api/tournaments/${id}/scores/${roundIndex}/${matchIndex}`,
        {
          team1Score,
          team2Score,
          notes
        },
        {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        }
      );
      
      toast({
        title: 'Success',
        description: 'Scores updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchTournament(); // Refresh tournament data
      onClose();
      
    } catch (error) {
      console.error('Error updating scores:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update scores.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Determine if the user is a judge for this tournament
  const isJudge = isAuthenticated && 
    user?.role === 'judge' && 
    tournament?.judges?.some(judge => judge._id === user._id);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="300px">
        <Spinner size="xl" thickness="4px" />
      </Flex>
    );
  }

  if (!tournament) {
    return (
      <Box textAlign="center" p={5}>
        <Heading size="lg">Tournament not found</Heading>
        <Button mt={4} colorScheme="blue" onClick={() => navigate('/tournaments')}>
          Back to Tournaments
        </Button>
      </Box>
    );
  }

  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="xl">{tournament.name}</Heading>
          <Badge colorScheme={
            tournament.status === 'upcoming' ? 'blue' :
            tournament.status === 'in_progress' ? 'orange' :
            tournament.status === 'completed' ? 'green' : 'red'
          }>
            {tournament.status.replace('_', ' ')}
          </Badge>
        </Box>
        <Button colorScheme="blue" onClick={() => navigate('/tournaments')}>
          Back to Tournaments
        </Button>
      </Flex>

      <Box mb={6} p={4} borderWidth="1px" borderRadius="lg" bg={bgColor} borderColor={borderColor}>
        <Text fontSize="lg" fontWeight="bold">Description</Text>
        <Text mt={2}>{tournament.description}</Text>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
          <Box>
            <Text fontWeight="bold">Location</Text>
            <Text>{tournament.location}</Text>
          </Box>
          <Box>
            <Text fontWeight="bold">Dates</Text>
            <Text>
              {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <Divider my={6} />

      <Box mb={6}>
        <Heading size="lg" mb={4}>Tournament Bracket</Heading>
        <TournamentBracket 
          rounds={tournament.rounds} 
          isJudge={isJudge || (isAuthenticated && user?.role === 'admin')}
          onScoreUpdate={handleScoreUpdate}
        />
      </Box>

      {tournament.winner && (
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="green.50" borderColor="green.200" mb={6}>
          <Heading size="md" color="green.800">Tournament Winner</Heading>
          <Text fontSize="xl" fontWeight="bold" mt={2}>{tournament.winner.name}</Text>
        </Box>
      )}

      <Divider my={6} />

      <Box mb={6}>
        <Heading size="lg" mb={4}>Teams</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
          {tournament.teams.map((team) => (
            <Box 
              key={team.id}
              p={4} 
              borderWidth="1px" 
              borderRadius="lg"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Text fontWeight="bold">{team.name}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Scoring Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Score Match</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedMatch && (
              <>
                <Flex mb={4} justify="space-between">
                  <Box>
                    <Text fontWeight="bold">Team 1</Text>
                    <Text>{selectedMatch.match.team1?.name}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Team 2</Text>
                    <Text>{selectedMatch.match.team2?.name}</Text>
                  </Box>
                </Flex>

                <FormControl mb={4}>
                  <FormLabel>Team 1 Score</FormLabel>
                  <NumberInput min={0} max={100} value={team1Score} onChange={(_, value) => setTeam1Score(value)}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Team 2 Score</FormLabel>
                  <NumberInput min={0} max={100} value={team2Score} onChange={(_, value) => setTeam2Score(value)}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl mb={4}>
                  <FormLabel>Notes</FormLabel>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Enter any feedback or notes about the match"
                  />
                </FormControl>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmitScores}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default TournamentDetail; 