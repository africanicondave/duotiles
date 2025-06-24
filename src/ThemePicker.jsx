import { useEffect, useState } from "react";
import { Box, Button, Text, Wrap, WrapItem } from "@chakra-ui/react";

const emojiThemes = {
  Animals: ["🐶", "🐱", "🐭", "🐰", "🦊", "🐻", "🐼", "🦁"],
  Food: ["🍎", "🍔", "🍕", "🍣", "🍪", "🍩", "🍉", "🍇"],
  Smileys: ["😄", "😎", "😍", "😭", "😡", "😱", "😇", "🤯"],
  Party: ["🎉", "🎊", "🎈", "🎁", "🪩", "🍾", "🥂", "💃"],
  Sports: ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🥊"],
};

const ThemePicker = ({ onThemeSelect }) => {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("duotiles_theme");
    if (saved) {
      setSelected(saved);
      onThemeSelect(saved);
    }
  }, []);

  const handleSelect = (theme) => {
    setSelected(theme);
    onThemeSelect(theme);
    localStorage.setItem("duotiles_theme", theme);
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="lg" boxShadow="md" mt={6} maxW="md" mx="auto">
      <Text mb={2} fontWeight="bold">Pick Your Emoji Theme</Text>
      <Wrap spacing={3}>
        {Object.entries(emojiThemes).map(([themeName, emojis]) => (
          <WrapItem key={themeName}>
            <Button
              onClick={() => handleSelect(themeName)}
              colorScheme={selected === themeName ? "teal" : "gray"}
              variant={selected === themeName ? "solid" : "outline"}
            >
              {themeName} {emojis[0]}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
      {selected && (
        <Text mt={3}>
          Selected: <strong>{selected}</strong> → {emojiThemes[selected].join(" ")}
        </Text>
      )}
    </Box>
  );
};

export default ThemePicker;
