import { useEffect, useState } from "react";
import { Input, Button, Box, Text, HStack, IconButton, Avatar, useBreakpointValue } from "@chakra-ui/react";

const LS_USER = "duotiles_username";

const UsernameEditor = ({ onUsernameChange }) => {
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(true);
  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    const stored = localStorage.getItem(LS_USER);
    if (stored && stored.trim()) {
      setUsername(stored);
      setEditing(false);
      onUsernameChange?.(stored);
    } else {
      setEditing(true);
      const generated = `Player${Math.floor(Math.random() * 10000)}`;
      setUsername(generated);
    }
  }, [onUsernameChange]);

  const handleSave = () => {
    const clean = (username || "Player").replace(/[^\w\s\-_.]/g, "").slice(0, 20);
    setUsername(clean);
    localStorage.setItem(LS_USER, clean);
    onUsernameChange?.(clean);
    setEditing(false);
  };

  // VIEW: compact pill with avatar + name + pencil
  if (!editing) {
    const initial = (username?.trim()?.[0] || "P").toUpperCase();
    return (
      <HStack
        spacing={2}
        px={3}
        py={1}
        border="1px solid #e9e9ef"
        borderRadius="9999px"
        bg="white"
      >
        <Avatar name={username} size="xs" bg="#6C00FF" color="white" />
        <Text fontWeight="700" fontSize={isMobile ? "sm" : "md"} noOfLines={1} maxW="160px">
          {username}
        </Text>
        <IconButton
          aria-label="Edit name"
          icon={<span>✏️</span>}
          onClick={() => setEditing(true)}
          size="xs"
          variant="ghost"
        />
      </HStack>
    );
  }

  // EDIT: minimal inline input + save (no labels/help text)
  return (
    <HStack
      spacing={2}
      px={2}
      py={1}
      border="1px solid #e9e9ef"
      borderRadius="md"
      bg="white"
    >
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Your name"
        size="sm"
        width={{ base: "160px", md: "200px" }}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
      />
      <Button size="sm" colorScheme="purple" onClick={handleSave}>
        Save
      </Button>
    </HStack>
  );
};

export default UsernameEditor;
