// src/UsernameEditor.jsx
import { useEffect, useState } from "react";
import { Input, Button, Box, Text } from "@chakra-ui/react";

const UsernameEditor = ({ onUsernameChange }) => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedName = localStorage.getItem("duotiles_username");
    if (storedName) {
      setUsername(storedName);
      onUsernameChange(storedName);
    } else {
      const defaultName = "Player" + Math.floor(Math.random() * 10000);
      setUsername(defaultName);
      onUsernameChange(defaultName);
      localStorage.setItem("duotiles_username", defaultName);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("duotiles_username", username);
    onUsernameChange(username);
  };

  return (
    <Box bg="gray.50" p={4} borderRadius="lg" boxShadow="md" maxW="md" mx="auto">
      <Text mb={2} fontWeight="bold">
        Your Duotiles Name
      </Text>
      <Input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your name"
        mb={2}
      />
      <Button colorScheme="teal" onClick={handleSave}>
        Save Name
      </Button>
    </Box>
  );
};

export default UsernameEditor;
