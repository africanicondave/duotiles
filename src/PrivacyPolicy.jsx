import { Box, Heading, Text, VStack } from "@chakra-ui/react";

export default function PrivacyPolicy() {
  return (
    <Box px={5} py={10} maxW="800px" mx="auto">
      <VStack spacing={4} align="start">
        <Heading size="lg">Privacy Policy</Heading>
        <Text>
          This privacy policy outlines how Duotiles handles your data. We do not collect personal information, nor do we share your data with any third party. Player names and game stats are stored locally or anonymously in Firebase.
        </Text>
        <Text>
          By playing Duotiles, you agree that your game stats (like time and turns) may appear on a public leaderboard, but no identifiable information is shared.
        </Text>
        <Text>
          If you have any concerns, please contact the app developer directly.
        </Text>
        <Text fontSize="sm" color="gray.500">
          Last updated: {new Date().toLocaleDateString()}
        </Text>
      </VStack>
    </Box>
  );
}
