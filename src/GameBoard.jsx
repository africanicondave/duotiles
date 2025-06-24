import { useEffect, useState, useRef } from "react";
import { Box, Grid, Button, Text } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";

const emojiThemes = {
  Animals: ["🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🦁"],
  Food: ["🍎", "🍔", "🍕", "🍣", "🍪", "🍩", "🍉", "🍇"],
  Smileys: ["😄", "😎", "😍", "😭", "😡", "😱", "😇", "🤯"],
  Party: ["🎉", "🎊", "🎈", "🎁", "🪩", "🍾", "🥂", "💃"],
  Sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🥊"],
};

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

const GameBoard = ({ selectedTheme, onGameWin }) => {
  const [tiles, setTiles] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turns, setTurns] = useState(0);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);
  const gameCompletedRef = useRef(false);
  const toast = useToast();


  useEffect(() => {
    if (!selectedTheme) return;

    const baseEmojis = emojiThemes[selectedTheme].slice(0, 8); // 8 pairs
    const allTiles = shuffleArray([...baseEmojis, ...baseEmojis]).map((emoji, index) => ({
      id: index,
      emoji,
      flipped: false,
      matched: false,
    }));

    setTiles(allTiles);
    setFlipped([]);
    setMatched([]);
    setTurns(0);
    setTime(0);
    setTimerActive(false);
    gameCompletedRef.current = false;
  }, [selectedTheme]);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

    const handleFlip = (index) => {
    if (flipped.length === 2 || tiles[index].flipped || tiles[index].matched) return;

    if (!timerActive) setTimerActive(true);

    const newTiles = [...tiles];
    newTiles[index].flipped = true;
    setTiles(newTiles);

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    // If two tiles are flipped, check for match
    if (newFlipped.length === 2) {
      setTurns((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;

      if (newTiles[firstIdx].emoji === newTiles[secondIdx].emoji) {
        // Match found
        newTiles[firstIdx].matched = true;
        newTiles[secondIdx].matched = true;
        setTiles(newTiles);
        setMatched((prev) => [...prev, firstIdx, secondIdx]);
        setTimeout(() => {
          setFlipped([]);
        }, 400); // short pause to appreciate match
      } else {
        // No match, flip back after 2 seconds
        setTimeout(() => {
          newTiles[firstIdx].flipped = false;
          newTiles[secondIdx].flipped = false;
          setTiles(newTiles);
          setFlipped([]);
        }, 2000);
      }
    }
  };
const resetGame = () => {
  const baseEmojis = emojiThemes[selectedTheme].slice(0, 8); // 8 pairs
  const allTiles = shuffleArray([...baseEmojis, ...baseEmojis]).map((emoji, index) => ({
    id: index,
    emoji,
    flipped: false,
    matched: false,
  }));

  setTiles(allTiles);
  setFlipped([]);
  setMatched([]);
  setTurns(0);
  setTime(0);
  setTimerActive(false);
  gameCompletedRef.current = false;
};


  useEffect(() => {
  const allMatched = matched.length === tiles.length && tiles.length > 0;
  if (allMatched && !gameCompletedRef.current) {
    gameCompletedRef.current = true;
    clearInterval(timerRef.current);
    setTimerActive(false);

    toast({
      title: "🎉 You Win!",
      description: `Great job! You finished in ${turns} turns and ${time} seconds.`,
      status: "success",
      duration: 8000,
      isClosable: true,
      position: "top",
      render: () => (
        <Box
          bg="purple.600"
          color="white"
          p={4}
          borderRadius="md"
          boxShadow="lg"
          textAlign="center"
        >
          <Text fontWeight="bold" fontSize="lg">🎉 You Win!</Text>
          <Text>Turns: {turns} — Time: {time}s</Text>
          <Button
            mt={3}
            size="sm"
            colorScheme="whiteAlpha"
            variant="outline"
            onClick={resetGame}
          >
            🔁 Play Again
          </Button>
        </Box>
      ),
    });

    if (typeof onGameWin === "function") {
      onGameWin({ turns, time });
    }
  }
}, [matched, tiles, turns, time, onGameWin, toast]);


  return (
    <Box
      mt={8}
      textAlign="center"
      bg="gray.50"
      p={6}
      borderRadius="12px"
      boxShadow="md"
      maxW="max-content"
      mx="auto"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Match the Emojis! Turns: {turns} ⏱ Time: {time}s
      </Text>
      <Grid templateColumns="repeat(4, 80px)" gap={4} justifyContent="center">
        {tiles.map((tile, idx) => (
  <Box
    key={tile.id}
    className="tile-container"
    onClick={() => handleFlip(idx)}
    cursor="pointer"
  >
    <Box className={`tile-inner ${tile.flipped || tile.matched ? "flipped" : ""}`}>
      <Box className="tile-front">❓</Box>
      <Box className="tile-back">{tile.emoji}</Box>
    </Box>
  </Box>
))}

      </Grid>
    </Box>
  );
};

export default GameBoard;
