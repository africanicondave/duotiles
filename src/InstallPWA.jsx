// src/InstallPWA.jsx
import { useEffect, useState } from "react";
import { Box, Button, Text, HStack } from "@chakra-ui/react";

/**
 * Lightweight PWA install banner:
 * - Chrome/Android: listens for `beforeinstallprompt` and shows Install button
 * - iOS Safari: shows an "Add to Home Screen" tip (no native prompt on iOS)
 * - Hidden if already installed or user dismissed previously
 */
export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const DISMISS_KEY = "dt_install_dismissed";

    // Don’t show if user dismissed it before
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Already installed?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;
    if (standalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const onBIP = (e) => {
      // Chrome fires this when the site meets install criteria
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };

    if (isIOS) {
      // iOS cannot prompt programmatically; show gentle guidance
      setIosHint(true);
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, "1");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
    };
  }, []);

  if (!show) return null;

  const install = async () => {
    if (!deferred) return; // iOS path: nothing to prompt
    deferred.prompt();
    try {
      await deferred.userChoice; // { outcome, platform }
    } finally {
      setDeferred(null);
      setShow(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem("dt_install_dismissed", "1");
    setShow(false);
  };

  // Banner UI (uses Chakra, fixed bottom, subtle card)
  return (
    <Box
      position="fixed"
      left={0}
      right={0}
      bottom="16px"
      display="flex"
      justifyContent="center"
      zIndex={1000}
      pointerEvents="none"
    >
      <Box
        pointerEvents="auto"
        bg="white"
        borderRadius="14px"
        boxShadow="0 12px 30px rgba(0,0,0,.14)"
        px="14px"
        py="12px"
        width={{ base: "calc(100vw - 24px)", sm: "520px" }}
      >
        <Text fontWeight={700} mb="4px">
          Install Duotiles
        </Text>
        <Text fontSize="sm" opacity={0.9} mb="10px">
          {iosHint
            ? "On iPhone/iPad: tap Share → Add to Home Screen."
            : "Get a faster, full-screen experience and play offline."}
        </Text>

        <HStack spacing="8px">
          {!iosHint && (
            <Button
              onClick={install}
              bg="#6C00FF"
              color="white"
              _hover={{ bg: "#5A00D6" }}
              _active={{ bg: "#4E00BD" }}
              size="sm"
              borderRadius="10px"
              fontWeight={700}
            >
              Install
            </Button>
          )}
          <Button
            onClick={dismiss}
            variant="outline"
            size="sm"
            borderRadius="10px"
            fontWeight={700}
          >
            Not now
          </Button>
        </HStack>
      </Box>
    </Box>
  );
}
