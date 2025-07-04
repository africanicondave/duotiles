import { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Link } from "react-router-dom";
import {
  Box,
  Button,
  Center,
  Input,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  useToast,
  Divider,
  Spinner,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { db } from "./firebase";
import PrivacyPolicy from "./PrivacyPolicy";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const emojiThemes = {
  Animals: ["🐶", "🐱", "🦁", "🐵", "🐸", "🐼", "🐔", "🐷"],       // Free

  Food: ["🍎", "🍔", "🍕", "🍣", "🍩", "🍪", "🍫", "🍇"],           // Premium
  Smileys: ["😀", "😂", "😍", "😎", "😭", "😡", "😴", "🤓"],        // Premium
  Party: ["🎉", "🎈", "🎂", "🎊", "🍾", "🪩", "🥳", "🎵"],         // Premium
  Sports: ["⚽", "🏀", "🎾", "🏓", "🥊", "🏐", "🏸", "⛳"],         // Premium
  Weather: ["☀️", "🌧️", "⛈️", "❄️", "🌪️", "🌈", "🌤️", "🌙"],    // Premium
  Travel: ["✈️", "🚗", "🚢", "🚀", "🛵", "🚉", "🚲", "🚁"],         // Premium
  Nature: ["🌳", "🌵", "🌸", "🌻", "🍁", "🍂", "🌼", "🌾"],         // Premium
  Tech: ["💻", "📱", "🖥️", "⌚", "🖱️", "📷", "🎧", "🔋"],           // Premium
  Fantasy: ["🐉", "🧚", "🧙", "🧞", "🧛", "🧜", "🧟", "👽"],         // Premium
  Space: ["🌍", "🌕", "🪐", "🚀", "👨‍🚀", "🛰️", "🌌", "☄️"],       // Premium
  Jobs: ["👨‍🏫", "👩‍🍳", "👨‍⚕️", "👩‍🚒", "👷‍♂️", "👨‍🔬", "🕵️", "💼"], // Premium
  Music: ["🎵", "🎶", "🎧", "🎤", "🎷", "🎸", "🥁", "🎻"],           // Premium
  Zodiac: ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏"],             // Premium
  Vehicles: ["🚗", "🛵", "🚜", "🚂", "🚕", "🚌", "🚛", "🚓"],         // Premium
  Spooky: ["🎃", "👻", "🧟", "🕷️", "🧛", "🦇", "🧙", "💀"],          // Premium
  Love: ["❤️", "💖", "💘", "💝", "💕", "💗", "💓", "💞"],           // Premium
  Fruits: ["🍎", "🍉", "🍓", "🍍", "🍌", "🥭", "🍒", "🍇"],         // Premium
  Ocean: ["🐬", "🐳", "🦈", "🐠", "🐙", "🦀", "🪸", "🌊"],           // Premium
  Buildings: ["🏠", "🏢", "🏰", "🏟️", "🏛️", "🗽", "🗼", "🕌"],       // Premium
};


export default function App() {
  const [playerName, setPlayerName] = useState("");
    // Check if redirected from Stripe success page
  

  const [inputName, setInputName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [theme, setTheme] = useState("Animals"); // ✅ The only free theme
  const [selectedEmojis, setSelectedEmojis] = useState([]);
  const [tiles, setTiles] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turns, setTurns] = useState(0);
  const [time, setTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [gameStats, setGameStats] = useState({
    bestTime: null,
    bestTurns: null,
    gamesPlayed: 0,
  });
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showWinToast, setShowWinToast] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [usedThemes, setUsedThemes] = useState(() => {
  const saved = localStorage.getItem("duotiles_usedThemes");
  return saved ? JSON.parse(saved) : [];
});


  const toast = useToast();
  const flipSound = useRef(null);
  const matchSound = useRef(null);
  const winSound = useRef(null);
  const timerRef = useRef(null);

  const latestTime = useRef(0);
  const latestTurns = useRef(0);

  useEffect(() => {
    flipSound.current = new Audio("/sounds/flip.mp3");
    matchSound.current = new Audio("/sounds/match.mp3");
    winSound.current = new Audio("/sounds/win.mp3");
  }, []);
  useEffect(() => {
  const splashTimer = setTimeout(() => {
    setShowSplash(false);
  }, 2500); // 1.0 seconds

  return () => clearTimeout(splashTimer);
}, []);

  useEffect(() => {
  setLoadingScores(true);
  const unsubscribe = fetchLeaderboard();
  return () => unsubscribe && unsubscribe();
}, []);


  useEffect(() => {
    const stored = localStorage.getItem("duotiles_player");
    if (stored) {
      setPlayerName(stored);
      setInputName(stored);
    } else {
      const random = "Player" + Math.floor(Math.random() * 10000);
      setPlayerName(random);
      setInputName(random);
      localStorage.setItem("duotiles_player", random);
    }

    const savedStats = localStorage.getItem("duotiles_stats");
    if (savedStats) {
      setGameStats(JSON.parse(savedStats));
    }

    const soundPref = localStorage.getItem("duotiles_sound");
    if (soundPref !== null) {
      setSoundEnabled(soundPref === "true");
    }
  }, []);

  useEffect(() => {
    const emojis = [...emojiThemes[theme]];
    setSelectedEmojis(emojis);
    const mixed = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, i) => ({ id: i, emoji }));

    setTiles(mixed);
    setFlipped([]);
    setMatched([]);
    setTurns(0);
    setTime(0);
    latestTime.current = 0;
    latestTurns.current = 0;
    setTimerActive(false);
    setGameCompleted(false);
  }, [theme]);

  useEffect(() => {
    if (timerActive && tiles.length > 0) {
      timerRef.current = setInterval(() => {
        setTime((prev) => {
          const updated = prev + 1;
          latestTime.current = updated;
          return updated;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, tiles]);

  useEffect(() => {
    if (flipped.length === 2) {
      const [first, second] = flipped;
      if (tiles[first].emoji === tiles[second].emoji) {
        if (soundEnabled) matchSound.current?.play();
        setMatched((prev) => [...prev, tiles[first].emoji]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
      setTurns((prev) => {
        const updated = prev + 1;
        latestTurns.current = updated;
        return updated;
      });
    }
  }, [flipped, tiles]);

  useEffect(() => {
  if (
    !gameCompleted &&
    matched.length === selectedEmojis.length &&
    selectedEmojis.length > 0
  ) {
    setGameCompleted(true);
    clearInterval(timerRef.current);
    setTimerActive(false);
    if (soundEnabled) winSound.current?.play();

    const finalTime = latestTime.current;
    const finalTurns = latestTurns.current;

    if (finalTime > 0 && finalTurns > 0) {
      updateGameStats(finalTime, finalTurns);
      saveToLeaderboard(finalTime, finalTurns);
    }

    setShowWinToast(true); // show toast on win
  }
}, [matched, selectedEmojis, gameCompleted]);


    useEffect(() => {
    const unsubscribe = fetchLeaderboard();
    return () => unsubscribe && unsubscribe();
  }, []);


  const updateGameStats = (finalTime, finalTurns) => {
    setGameStats((prev) => {
      const updated = {
        bestTime:
          prev.bestTime === null || finalTime < prev.bestTime
            ? finalTime
            : prev.bestTime,
        bestTurns:
          prev.bestTurns === null || finalTurns < prev.bestTurns
            ? finalTurns
            : prev.bestTurns,
        gamesPlayed: prev.gamesPlayed + 1,
      };
      localStorage.setItem("duotiles_stats", JSON.stringify(updated));
      return updated;
    });
  };

  const saveToLeaderboard = async (finalTime, finalTurns) => {
    try {
      await addDoc(collection(db, "leaderboard"), {
        name: playerName,
        turns: finalTurns,
        time: finalTime,
        timestamp: Date.now(),
      });
      fetchLeaderboard();
    } catch (error) {
      console.error("Error saving to leaderboard:", error);
    }
  };

  const fetchLeaderboard = () => {
  setLoadingScores(true);
  const q = query(
    collection(db, "leaderboard"),
    orderBy("time", "asc"),
    limit(5)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const top = snapshot.docs.map((doc) => doc.data());
      setLeaderboard(top);
    } else {
      setLeaderboard([]);
    }
    setLoadingScores(false);
  });

  return unsubscribe;
};


  const handleFlip = (index) => {
    if (
      flipped.length < 2 &&
      !flipped.includes(index) &&
      !matched.includes(tiles[index].emoji)
    ) {
      if (!timerActive) setTimerActive(true);
      if (soundEnabled) flipSound.current?.play();
      setFlipped((prev) => [...prev, index]);
    }
  };

  const handleResetStats = () => {
  localStorage.removeItem("duotiles_stats");
  setGameStats({ bestTime: null, bestTurns: null, gamesPlayed: 0 });
  toast({
    title: "Stats reset!",
    description: "Your best time and turns have been cleared.",
    status: "info",
  });
};


  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("duotiles_sound", next);
    toast({
      title: next ? "Sound enabled" : "Sound muted",
      status: "info",
    });
  };
if (showSplash) {
  return (
    <Center height="100vh" bg="teal.500" flexDir="column">
      <Text fontSize="4xl" color="white" fontWeight="bold" mb={2}>
        🎮 Duotiles
      </Text>
      <Text fontSize="lg" color="whiteAlpha.800" mb={6}>
        Match the tiles. Train your memory.
      </Text>
      <Text fontSize="md" color="whiteAlpha.700" fontStyle="italic">
        Loading...
      </Text>
    </Center>
  );
}


  return (
  <Router>
    <Routes>
      <Route
        path="/"
        element={
          <Box px={[3, 5]} py={5} maxW="container.sm" mx="auto" bgGradient="linear(to-br, #e0f7fa, #fce4ec)" minH="100vh">
            {/* --- all your game content stays inside here, do NOT delete anything --- */}


      <HStack justify="center" mb={4}>
  <Text
  fontSize={["xl", "2xl"]}
  fontWeight="extrabold"
  bgGradient="linear(to-r, teal.400, pink.400)"
  bgClip="text"
  textAlign="center"
  textShadow="1px 1px 2px rgba(0, 0, 0, 0.2)"
>
  🎉 Welcome to Duotiles, {playerName || "Player"}!
</Text>


  
</HStack>


      <HStack
  spacing={2}
  justify="center"
  wrap="wrap"
  mb={4}
>
  <Button size="sm" colorScheme="teal" onClick={() => {
    if (isEditingName) {
      setPlayerName(inputName);
      localStorage.setItem("duotiles_player", inputName);
      toast({ title: "Name saved!", status: "success" });
    }
    setIsEditingName(!isEditingName);
  }}>
    {isEditingName ? "Save" : "Edit Name"}
  </Button>
  
  <Button size="sm" colorScheme={soundEnabled ? "purple" : "gray"} variant="outline" onClick={toggleSound}>
    {soundEnabled ? "🔊" : "🔇"}
  </Button>

</HStack>

{isEditingName && (
  <Center mb={3}>
    <Input
      value={inputName}
      onChange={(e) => setInputName(e.target.value)}
      size="md"
      maxW="280px"
      textAlign="center"
      bg="white"
      border="2px solid"
      borderColor="teal.300"
      borderRadius="md"
      boxShadow="sm"
      _placeholder={{ color: "gray.400" }}
      placeholder="Enter your name"
    />
  </Center>
)}

<VStack
  spacing={2}
  bg="gray.100"
  p={3}
  borderRadius="md"
  w="100%"
  maxW="320px"
  mx="auto"
  mb={3}
>
  <Text
  fontSize={["md", "lg"]}
  fontWeight="bold"
  bgGradient="linear(to-r, pink.400, teal.400)"
  bgClip="text"
  textAlign="center"
  mb={2}
  textShadow="0 1px 1px rgba(0, 0, 0, 0.15)"
>
  🎨 Pick Your Emoji Theme
</Text>


  <Wrap spacing="5px" justify="center">
    {Object.keys(emojiThemes).map((cat) => {
      const isUsed = usedThemes.includes(cat);
      return (
        <WrapItem key={cat}>
          <Button
            size="xs"
            fontSize="11px"
            px={2}
            py={1}
            minW="80px"
            h="28px"
            borderRadius="full"
            colorScheme={theme === cat ? "teal" : "gray"}
            variant="solid"
            onClick={() => {
              setTheme(cat);
              if (!isUsed) {
                const updated = [...usedThemes, cat];
                setUsedThemes(updated);
                localStorage.setItem("duotiles_usedThemes", JSON.stringify(updated));
              }
            }}
            _hover={{
              transform: "scale(1.03)",
              boxShadow: "sm",
            }}
          >
            {cat} {emojiThemes[cat][0]}
          </Button>
        </WrapItem>
      );
    })}
  </Wrap>
</VStack>




      <VStack spacing={4}>
        <Text fontSize={["md", "lg"]} fontWeight="semibold">
          Turns: {turns} ⏱ Time: {time}s
        </Text>
        <SimpleGrid columns={[4, 4]} spacing={3}>
          {tiles.map((tile, idx) => {
            const isFlipped = flipped.includes(idx);
            const isMatched = matched.includes(tile.emoji);
            return (
              <Box
                key={tile.id}
                onClick={() => handleFlip(idx)}
                w={["60px", "64px"]}
                h={["60px", "64px"]}
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="2xl"
                bg={isFlipped || isMatched ? "white" : "teal.500"}
                border="2px solid"
                borderColor="teal.600"
                borderRadius="md"
                cursor="pointer"
                transition="all 0.2s ease"
              >
                {isFlipped || isMatched ? tile.emoji : "❔"}


              </Box>
            );
          })}
        </SimpleGrid>
      </VStack>

     
   <Box mt={6} textAlign="center">
  <Button
    size="sm"
    colorScheme="purple"
    onClick={() => setShowStats(!showStats)}
  >
    {showStats ? "Hide Stats" : "Show Stats"}
  </Button>
<Button
  size="sm"
  colorScheme="red"
  variant="outline"
  onClick={handleResetStats}
  ml={3}
>
  Reset Stats
</Button>

  {showStats && (
    <HStack
      mt={4}
      spacing={4}
      align="start"
      justify="center"
      flexWrap="wrap"
      maxW="360px"
      mx="auto"
    >
      <Box
        textAlign="left"
        bgGradient="linear(to-br, white, gray.50)"
        p={4}
        borderRadius="12px"
        boxShadow="0 2px 6px rgba(0, 0, 0, 0.08)"
        border="1px solid #e2e8f0"
        w="48%"
      >
        <Text fontWeight="bold" fontSize="md" mb={2} color="purple.700">
          🏆 Top 3 Leaderboard
        </Text>
        {loadingScores ? (
          <Spinner />
        ) : (
          <VStack align="start" spacing={1}>
            {leaderboard.slice(0, 3).map((entry, index) => (
              <Text key={index} fontSize="sm">
                {index + 1}. <b>{entry.name}</b>: {entry.turns}T / {entry.time}s
              </Text>
            ))}
          </VStack>
        )}
      </Box>

      <Box
        flex="1"
        minW="160px"
        textAlign="left"
        bgGradient="linear(to-br, white, gray.50)"
        p={3}
        borderRadius="12px"
        boxShadow="0 2px 6px rgba(0, 0, 0, 0.08)"
        border="1px solid #e2e8f0"
      >
        <Text fontWeight="bold" fontSize="md" mb={2} color="blue.700">
          📊 Your Game Stats
        </Text>
        <Text fontSize="sm">🎮 Games Played: {gameStats.gamesPlayed}</Text>
        <Text fontSize="sm">⏱ Best Time: {gameStats.bestTime ?? "--"}s</Text>
        <Text fontSize="sm">🔁 Best Turns: {gameStats.bestTurns ?? "--"}</Text>
      </Box>
    </HStack>
  )}
</Box>

{showWinToast && (
  <Center
    position="fixed"
    top="50%"
    left="50%"
    transform="translate(-50%, -50%)"
    zIndex="10"
    p={6}
    bg="green.50"
    border="2px solid"
    borderColor="green.400"
    borderRadius="lg"
    boxShadow="lg"
    flexDir="column"
    textAlign="center"
  >
    <Text fontSize="xl" fontWeight="bold" color="green.700" mb={2}>
      🎉 Game Over!
    </Text>
    <Button
      colorScheme="teal"
      onClick={() => {
        const emojis = [...emojiThemes[theme]];
        setSelectedEmojis(emojis);
        const mixed = [...emojis, ...emojis]
          .sort(() => Math.random() - 0.5)
          .map((emoji, i) => ({ id: i, emoji }));
        setTiles(mixed);
        setFlipped([]);
        setMatched([]);
        setTurns(0);
        setTime(0);
        setTimerActive(false);
        setGameCompleted(false);
        setShowWinToast(false);
      }}
    >
      🔁 Play Again
    </Button>
  </Center>
)}
<Box
  as="footer"
  py={5}
  textAlign="center"
  fontSize="sm"
  borderTop="1px solid #e2e8f0"
  mt={10}
  bg="whiteAlpha.700"
>
  <Text color="gray.700">
    <strong>© 2025 Duotiles.</strong> Created by{" "}
    <Text as="span" fontWeight="bold" color="teal.600">
      David Adeyemo
    </Text>
    .{" "}
    <Link
      as={NavLink}
      to="/privacy-policy"
      color="blue.500"
      _hover={{ textDecoration: "underline" }}
      fontWeight="medium"
    >
      Privacy Policy
    </Link>
  </Text>
</Box>


    </Box>
      }
      />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  </Router>
);
}
