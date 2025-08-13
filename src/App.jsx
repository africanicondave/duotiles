import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Box, Button, Center, Text, VStack, HStack,
  Card, CardBody, Flex, Wrap, WrapItem,
  Modal, ModalOverlay, ModalContent, ModalBody, ModalHeader, ModalCloseButton, ModalFooter
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import PrivacyPolicy from "./PrivacyPolicy";
import UsernameEditor from "./UsernameEditor";

/* ---------- Sounds ---------- */
const flipSfx = new Audio("/sounds/flip.mp3");
const matchSfx = new Audio("/sounds/match.mp3");
const winSfx = new Audio("/sounds/win.mp3");
[flipSfx, matchSfx, winSfx].forEach(a => (a.preload = "auto"));

const MotionBox = motion(Box);

/* ---------- Emoji Packs ---------- */
const PACKS = {
  Animals: ["🐶","🐱","🐰","🦊","🐻","🐼","🐸","🐵"],
  Nature: ["🌸","🍁","🌿","🌼","🍄","🌞","🌈","🌵"],
  Sports: ["⚽","🏀","🎾","🏈","🏐","🥊","🏓","⛳"],
  Food:   ["🍔","🍕","🍣","🍩","🍪","🍦","🍟","🌮"],
  Faces:  ["😀","😎","😍","🤓","😭","😡","😴","🤩"],
  Space:  ["🌍","🌕","🪐","🚀","👨‍🚀","🛰️","🌌","☄️"],
  Jobs:   ["👨‍🏫","👩‍🍳","👨‍⚕️","👩‍🚒","👷‍♂️","👨‍🔬","🕵️","💼"],
  Music:  ["🎵","🎶","🎧","🎤","🎷","🎸","🥁","🎻"],
  Zodiac: ["♈","♉","♊","♋","♌","♍","♎","♏"],
  Vehicles:["🚗","🛵","🚜","🚂","🚕","🚌","🚛","🚓"],
  Spooky: ["🎃","👻","🧟","🕷️","🧛","🦇","🧙","💀"],
  Love:   ["❤️","💖","💘","💝","💕","💗","💓","💞"],
  Fruits: ["🍎","🍉","🍓","🍍","🍌","🥭","🍒","🍇"],
  Ocean:  ["🐬","🐳","🦈","🐠","🐙","🦀","🪸","🌊"],
  Buildings:["🏠","🏢","🏰","🏟️","🏛️","🗽","🗼","🕌"],
};

/* ---------- Helpers ---------- */
const makeDeck = (emojis) => {
  const base = emojis.slice(0, 8);
  const deck = [...base, ...base].map((emoji, i) => ({
    id: i + "-" + emoji,
    emoji,
    flipped: false,
    matched: false,
  }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};
const msToClock = (ms) => {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};
const clampName = (s) => (s || "Player").replace(/[^\w\s\-_.]/g, "").slice(0, 20);

const LS_USER = "duotiles_username";
const LS_BEST = (theme) => `duotiles_best_${theme}`;
const LS_SOUND = "duotiles_sound_on";
const readBest = (theme) => {
  try {
    const v = JSON.parse(localStorage.getItem(LS_BEST(theme)) || "null");
    if (!v || typeof v.timeMs !== "number" || v.timeMs <= 0) return null;
    return v;
  } catch { return null; }
};

/* ---------- Confetti (lightweight canvas) ---------- */
function ConfettiBurst({ show }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const c = canvasRef.current;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const resize = () => {
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = window.innerWidth + "px";
      c.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = c.getContext("2d");
    const colors = ["#6C00FF", "#FF5D8F", "#00C2FF", "#FFC400", "#00D68F"];
    const N = 140;
    const pieces = Array.from({ length: N }, () => ({
      x: Math.random() * c.width,
      y: -Math.random() * c.height * 0.4,
      s: 6 + Math.random() * 10,
      vx: (-1 + Math.random() * 2) * 1.2 * dpr,
      vy: (2 + Math.random() * 3) * dpr,
      rot: Math.random() * Math.PI,
      vr: (-0.15 + Math.random() * 0.3),
      col: colors[(Math.random() * colors.length) | 0],
      shape: Math.random() < 0.5 ? "rect" : "tri",
    }));

    let alive = true;
    const start = performance.now();
    function tick(t) {
      if (!alive) return;
      const elapsed = t - start;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pieces) {
        p.vy += 0.02 * dpr;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - (elapsed / 2400));
        ctx.fillStyle = p.col;
        if (p.shape === "rect") {
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.65);
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -p.s / 2);
          ctx.lineTo(p.s / 2, p.s / 2);
          ctx.lineTo(-p.s / 2, p.s / 2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }
      if (elapsed < 2400) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    return () => { alive = false; window.removeEventListener("resize", resize); };
  }, [show]);

  if (!show) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2000 }}
    />
  );
}

/* ---------- Compact Stat Pill (supports size="sm") ---------- */
function StatPill({ icon, label, number, help, size = "md" }) {
  const isSm = size === "sm";
  const circle = isSm ? 28 : 36;
  const px = isSm ? 2 : 3;
  const py = isSm ? 1.5 : 2;
  const numFs = isSm ? "lg" : "xl";
  const labelFs = isSm ? "2xs" : "xs";
  const helpFs = isSm ? "2xs" : "xs";

  return (
    <Flex
      align="center"
      gap={isSm ? 2 : 3}
      px={px}
      py={py}
      borderRadius="xl"
      bg="white"
      border="1px solid #eee"
      boxShadow="sm"
      minW="auto"
      flexShrink={0}
      height={isSm ? "56px" : "auto"}
    >
      <Box
        w={`${circle}px`}
        h={`${circle}px`}
        borderRadius="full"
        bg="#6C00FF"
        color="white"
        display="grid"
        placeItems="center"
        fontSize={isSm ? "md" : "lg"}
        flexShrink={0}
      >
        {icon}
      </Box>
      <Box lineHeight="short">
        <Text fontSize={labelFs} color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
          {label}
        </Text>
        <HStack spacing={2}>
          <Text fontSize={numFs} fontWeight="800">{number}</Text>
          {help && <Text fontSize={helpFs} color="gray.500">{help}</Text>}
        </HStack>
      </Box>
    </Flex>
  );
}

/* ---------- Sound Toggle (compact) ---------- */
function SoundToggle({ value, onChange }) {
  const TRACK_W = 40, TRACK_H = 22;
  const KNOB = 14, PAD = 4;
  const SHIFT = TRACK_W - KNOB - PAD * 2;

  return (
    <HStack
      as="button"
      onClick={() => onChange(!value)}
      spacing={2}
      px={2}
      py={1}
      borderRadius="full"
      border="1px solid #E9D8FD"
      bg={value ? "purple.50" : "gray.50"}
      _hover={{ bg: value ? "purple.100" : "gray.100" }}
      maxW="100%"
    >
      <Box
        position="relative"
        w={`${TRACK_W}px`}
        h={`${TRACK_H}px`}
        borderRadius="full"
        bg={value ? "purple.500" : "gray.400"}
        flexShrink={0}
      >
        <motion.div
          style={{
            position: "absolute",
            top: PAD,
            left: PAD,
            width: KNOB,
            height: KNOB,
            borderRadius: "9999px",
            background: "#fff",
          }}
          animate={{ x: value ? SHIFT : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      </Box>
      <Text fontSize="xs" fontWeight="700" display={{ base: "none", sm: "inline" }}>
        Sound
      </Text>
    </HStack>
  );
}

/* ---------- Hero Start Card ---------- */
function HeroStartCard({ onStart }) {
  return (
    <Box
      position="relative"
      w="full"
      minH={{ base: "58vh", md: "62vh" }}
      borderRadius="xl"
      overflow="hidden"
      bgGradient="linear(to-b, purple.50, white)"
      border="1px solid #eee"
      display="grid"
      placeItems="center"
    >
      <Box
        position="absolute"
        top="-70px"
        right="-70px"
        w="240px"
        h="240px"
        bg="purple.300"
        opacity={0.25}
        borderRadius="full"
        filter="blur(50px)"
      />
      <Box
        position="absolute"
        bottom="-90px"
        left="-90px"
        w="300px"
        h="300px"
        bg="pink.300"
        opacity={0.22}
        borderRadius="full"
        filter="blur(70px)"
      />

      <VStack spacing={4} zIndex={1} textAlign="center" px={4}>
        <Box fontSize={{ base: "40px", md: "48px" }} as="span">🎮</Box>
        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="800">
          Ready to play?
        </Text>
        <Text color="gray.600" maxW="560px">
          Match the pairs as fast as you can. Tap Start to begin — the timer starts on your first flip.
        </Text>
        <Button size="lg" colorScheme="purple" onClick={onStart}>
          Start Game
        </Button>
      </VStack>
    </Box>
  );
}

/* ---------- App ---------- */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeGame />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

function HomeGame() {
  /* username */
  const [username, setUsername] = useState(() => localStorage.getItem(LS_USER) || "");
  const handleUsername = useCallback((n) => {
    const name = clampName(n);
    setUsername(name);
    localStorage.setItem(LS_USER, name);
  }, []);

  /* theme */
  const [theme, setTheme] = useState(() => localStorage.getItem("duotiles_theme") || "Animals");
  useEffect(() => localStorage.setItem("duotiles_theme", theme), [theme]);

  /* sound (persist + mute/unmute) */
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(LS_SOUND) !== "0");
  useEffect(() => {
    localStorage.setItem(LS_SOUND, soundOn ? "1" : "0");
    [flipSfx, matchSfx, winSfx].forEach(a => (a.muted = !soundOn));
  }, [soundOn]);

  /* game state */
  const [deck, setDeck] = useState(() => makeDeck(PACKS[theme]));
  const [turns, setTurns] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const [selected, setSelected] = useState([]);

  /* modals */
  const [modalOpen, setModalOpen] = useState(false);          // gameplay
  const [themeModalOpen, setThemeModalOpen] = useState(false); // change theme
  const [themeDraft, setThemeDraft] = useState(theme);

  /* best (local per theme) */
  const [bestLocal, setBestLocal] = useState(() => readBest(theme));
  useEffect(() => setBestLocal(readBest(theme)), [theme]);

  /* timer */
  const startRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const rafRef = useRef();

  /* interaction lock */
  const busyRef = useRef(false);

  /* force fresh mount on reset */
  const [gameId, setGameId] = useState(0);
  const timeoutsRef = useRef([]);
  const later = (fn, ms) => {
    const id = setTimeout(() => { fn(); timeoutsRef.current = timeoutsRef.current.filter(x => x !== id); }, ms);
    timeoutsRef.current.push(id);
  };
  const clearPending = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  /* responsive grid sizing (inside modal) */
  const gridRef = useRef(null);
  const [tilePx, setTilePx] = useState(96);
  const COLS = 4, ROWS = 4;

  const measureGrid = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const isSmall = window.innerWidth < 480;
    const GAP = isSmall ? 8 : 12;

    const vh = window.innerHeight;
    const rect = el.getBoundingClientRect();
    const availableH = Math.max(120, vh - rect.top - 24);
    const containerW = el.parentElement ? el.parentElement.clientWidth : el.clientWidth;

    const byW = Math.floor((containerW - GAP * (COLS - 1)) / COLS);
    const byH = Math.floor((availableH - GAP * (ROWS - 1)) / ROWS);
    const size = Math.max(44, Math.min(byW, byH));

    setTilePx(size);
    el.style.setProperty("--tile", `${size}px`);
    el.style.setProperty("--gap", `${GAP}px`);
    el.style.setProperty("--gridW", `${size * COLS + GAP * (COLS - 1)}px`);
  }, []);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(measureGrid);
    if (gridRef.current) ro.observe(gridRef.current);
    window.addEventListener("resize", measureGrid);
    return () => { ro.disconnect(); window.removeEventListener("resize", measureGrid); };
  }, [measureGrid, gameId, theme]);

  useEffect(() => {
    if (modalOpen) setTimeout(measureGrid, 0);
  }, [modalOpen, measureGrid]);

  const startTimer = useCallback(() => {
    startRef.current = performance.now();
    setElapsed(0);
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      setElapsed(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);
  const stopTimer = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  const reset = useCallback(() => {
    clearPending();
    setDeck(makeDeck(PACKS[theme]));
    setSelected([]);
    setTurns(0);
    setWon(false);
    setRunning(false);
    setElapsed(0);
    busyRef.current = false;
    stopTimer();
    setGameId(n => n + 1);
    setTimeout(measureGrid, 0);
    setShowCelebrate(false);
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
  }, [theme, stopTimer, measureGrid]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    reset();
  }, [reset]);

  useEffect(() => { reset(); }, [theme]); // reshuffle on theme change

  const onFlip = useCallback((idx) => {
    if (busyRef.current || !modalOpen) return;

    setDeck(prev => {
      if (prev[idx].flipped || prev[idx].matched) return prev;
      return prev.map((t, i) => (i === idx ? { ...t, flipped: true } : t));
    });

    if (!running) {
      setRunning(true);
      startTimer();
      try { flipSfx.currentTime = 0; flipSfx.play().catch(()=>{}); } catch {}
    } else { try { flipSfx.currentTime = 0; flipSfx.play().catch(()=>{}); } catch {} }

    setSelected(sel => {
      const nextSel = [...sel, idx];
      if (nextSel.length === 2) {
        busyRef.current = true;
        setTurns(t => t + 1);
        const [a, b] = nextSel;
        const same = deck[a]?.emoji === deck[b]?.emoji;

        if (same) {
          setDeck(prev => prev.map((t, i) => (i === a || i === b ? { ...t, matched: true, flipped: true } : t)));
          try { matchSfx.currentTime = 0; matchSfx.play().catch(()=>{}); } catch {}
          later(() => { setSelected([]); busyRef.current = false; }, 0);
        } else {
          later(() => {
            setDeck(prev => prev.map((t, i) => (i === a || i === b ? { ...t, flipped: false } : t)));
            setSelected([]);
            busyRef.current = false;
          }, 600);
        }
      }
      return nextSel.length <= 2 ? nextSel : sel;
    });
  }, [deck, running, startTimer, modalOpen]);

  /* celebration + update local PB */
  const [showCelebrate, setShowCelebrate] = useState(false);
  const celebrateTimerRef = useRef(null);

  useEffect(() => {
    const allMatched = deck.length && deck.every(t => t.matched);
    if (!allMatched || !modalOpen || won) return;

    setWon(true);
    setRunning(false);
    stopTimer();
    try { winSfx.currentTime = 0; winSfx.play().catch(()=>{}); } catch {}

    const prev = readBest(theme);
    const me = { timeMs: Math.round(elapsed), turns };
    const better = !prev || me.timeMs < prev.timeMs || (me.timeMs === prev.timeMs && me.turns < prev.turns);
    if (better || !prev) localStorage.setItem(LS_BEST(theme), JSON.stringify(me));
    setBestLocal(better || !prev ? me : prev);

    setShowCelebrate(true);
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    celebrateTimerRef.current = setTimeout(() => setShowCelebrate(false), 2600);
  }, [deck, won, theme, elapsed, turns, stopTimer, modalOpen]);

  const emojiFont = Math.max(18, Math.floor(tilePx * 0.45));

  /* start with selected theme from the theme modal */
  const startWithTheme = useCallback(() => {
    setTheme(themeDraft);
    setThemeModalOpen(false);
    setShowCelebrate(false);
    // if already open, grid will refresh; if closed, open it.
    setTimeout(() => setModalOpen(true), 0);
  }, [themeDraft]);

  return (
    <Box minH="100dvh" bg="#f7f7fb">
      {/* Confetti + win message (zIndex above modal) */}
      <ConfettiBurst show={showCelebrate} />
      <AnimatePresence>
        {showCelebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, calc(-50% - 90px))",
              zIndex: 2001,
              pointerEvents: "none"
            }}
          >
            <Box px={5} py={3} borderRadius="xl" bg="white" boxShadow="2xl" border="1px solid #eee">
              <HStack>
                <span style={{ fontSize: 24 }}>🎉</span>
                <Text fontWeight="800">Nice run! {msToClock(elapsed)} • {turns} turns</Text>
              </HStack>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Center py={5}>
        <VStack spacing={3} w="full" maxW="980px" px={{ base: 3, md: 4 }}>
          {/* Header */}
          <Flex w="full" align="center" gap={2} wrap="wrap">
            <Text fontSize="xl" fontWeight="800" color="#6C00FF">DuoTiles</Text>
            <Flex gap={2} align="center" ml="auto" wrap="wrap" minW={0}>
              <UsernameEditor onUsernameChange={handleUsername} />
              <Box flexShrink={0}>
                <SoundToggle value={soundOn} onChange={setSoundOn} />
              </Box>
            </Flex>
          </Flex>

          {/* Theme picker */}
          <Box w="full" as={Card}>
            <CardBody>
              <Text fontWeight="700" mb={3}>Theme</Text>
              <Wrap shouldWrapChildren spacing="8px">
                {Object.keys(PACKS).map((k) => (
                  <WrapItem key={k}>
                    <Button
                      size="sm"
                      variant={k === theme ? "solid" : "outline"}
                      colorScheme="purple"
                      onClick={() => setTheme(k)}
                    >
                      {k}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            </CardBody>
          </Box>

          {/* Game card with compact stats + BIG hero start card */}
          <Box w="full" as={Card}>
            <CardBody px={{ base: 3, md: 6 }} py={{ base: 3, md: 4 }}>
              <Flex
                gap={2}
                flexWrap="nowrap"
                overflowX="auto"
                pb={1}
                mb={3}
                sx={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                <StatPill icon="⏱️" label="Time" number={msToClock(elapsed)} help={!modalOpen ? "Ready" : running ? "Counting…" : won ? "Finished" : "Ready"} size="sm" />
                <StatPill icon="🔁" label="Turns" number={turns} help="Lower is better" size="sm" />
                <StatPill icon="🏅" label="Personal Best" number={bestLocal ? msToClock(bestLocal.timeMs) : "—"} help={bestLocal ? `${bestLocal.turns} turns` : "Play to set"} size="sm" />
              </Flex>

              {!modalOpen && (
                <HeroStartCard onStart={() => setModalOpen(true)} />
              )}
            </CardBody>
          </Box>

          <Text fontSize="sm" color="gray.500" mt={6}>
            <Link to="/privacy-policy">Privacy Policy</Link> • Built with love. All themes are free.
          </Text>
        </VStack>
      </Center>

      {/* Gameplay Modal (centered board) */}
      <Modal isOpen={modalOpen} onClose={closeModal} size="xl" closeOnOverlayClick={false} isCentered>
        <ModalOverlay />
        <ModalContent p={{ base: 3, md: 4 }}>
          <ModalBody>
            <Box position="relative">
              <Center>
                <Box
                  ref={gridRef}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, var(--tile))",
                    gridAutoRows: "var(--tile)",
                    gap: "var(--gap)",
                    width: "var(--gridW)",
                    margin: "0 auto",
                    justifyContent: "center",
                    alignContent: "start",
                  }}
                >
                  {deck.map((tile, i) => {
                    const show = tile.flipped || tile.matched;
                    return (
                      <MotionBox
                        key={`${gameId}-${tile.id}`}
                        onClick={() => (!show ? onFlip(i) : null)}
                        role="button"
                        aria-label={show ? tile.emoji : "Hidden tile"}
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !show && onFlip(i)}
                        whileTap={{ scale: 0.98 }}
                        sx={{
                          width: "var(--tile)", height: "var(--tile)",
                          userSelect: "none", borderRadius: 12,
                          cursor: show ? "default" : "pointer",
                          position: "relative", overflow: "hidden",
                          border: "1px solid #eee", boxShadow: "xs", bg: "white",
                          display: "grid", placeItems: "center",
                        }}
                      >
                        {/* Front: ? */}
                        <motion.div
                          style={{ position:"absolute", inset:0, display:"grid", placeItems:"center" }}
                          initial={false} animate={{ opacity: show ? 0 : 1 }} transition={{ duration: 0.14, ease: "linear" }}
                        >
                          <Box fontSize={`${emojiFont}px`} fontWeight="700" color="white" bg="#6C00FF" w="100%" h="100%" display="grid" placeItems="center">?</Box>
                        </motion.div>

                        {/* Back: emoji */}
                        <motion.div
                          style={{ position:"absolute", inset:0, display:"grid", placeItems:"center" }}
                          initial={false} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 0.14, ease: "linear" }}
                        >
                          <Box fontSize={`${emojiFont}px`} fontWeight="700" color="#111" bg="white" w="100%" h="100%" display="grid" placeItems="center">
                            {tile.emoji}
                          </Box>
                        </motion.div>
                      </MotionBox>
                    );
                  })}
                </Box>
              </Center>

              {/* Play Again + Change Theme overlay */}
              <AnimatePresence>
                {won && (
                  <Center position="absolute" inset="0" pointerEvents="none">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      style={{ pointerEvents: "auto" }}
                    >
                      <Flex gap={3} direction={{ base: "column", sm: "row" }} justify="center">
                        <Button size="lg" colorScheme="purple" onClick={() => { reset(); setModalOpen(true); }}>
                          Play Again
                        </Button>
                        <Button size="lg" bg="yellow.400" _hover={{ bg: "yellow.300" }} color="black"
                          onClick={() => { setShowCelebrate(false); setThemeDraft(theme); setThemeModalOpen(true); }}>
                          Change Theme
                        </Button>
                      </Flex>
                    </motion.div>
                  </Center>
                )}
              </AnimatePresence>
            </Box>

            {/* Quit button under grid */}
            <Center mt={4}>
              <Button variant="ghost" onClick={closeModal}>Quit</Button>
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Theme Picker Modal */}
      <Modal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} isCentered size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select a theme</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Wrap shouldWrapChildren spacing="8px" mb={4}>
              {Object.keys(PACKS).map((k) => (
                <WrapItem key={k}>
                  <Button
                    size="sm"
                    variant={k === themeDraft ? "solid" : "outline"}
                    colorScheme="purple"
                    onClick={() => setThemeDraft(k)}
                  >
                    {k}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
            <Text fontSize="sm" color="gray.600">Tap Start Game to play immediately with the selected theme.</Text>
          </ModalBody>
          <ModalFooter>
            <HStack w="full" justify="flex-end">
              <Button variant="ghost" onClick={() => setThemeModalOpen(false)}>Cancel</Button>
              <Button colorScheme="purple" onClick={startWithTheme}>Start Game</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
