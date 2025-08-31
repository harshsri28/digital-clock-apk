import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { Audio } from 'expo-av';

import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

const { width, height } = Dimensions.get("window");

export default function TimerScreen() {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default
  const [initialTime, setInitialTime] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("5");
  const [inputSeconds, setInputSeconds] = useState("0");
  const [orientation, setOrientation] = useState("portrait");
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const warningSound = useRef<Audio.Sound | null>(null);
  const overSound = useRef<Audio.Sound | null>(null);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Load sound files
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: warning } = await Audio.Sound.createAsync(
          require('@/assets/sounds/less10sec.wav')
        );
        const { sound: over } = await Audio.Sound.createAsync(
          require('@/assets/sounds/over.mp3')
        );
        warningSound.current = warning;
        overSound.current = over;
      } catch (error) {
        console.log('Error loading sounds:', error);
      }
    };

    loadSounds();

    return () => {
      // Clean up sounds
      if (warningSound.current) {
        warningSound.current.unloadAsync();
      }
      if (overSound.current) {
        overSound.current.unloadAsync();
      }
    };
  }, []);

  // Check orientation
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get("window");
      setOrientation(width > height ? "landscape" : "portrait");
    };

    const subscription = Dimensions.addEventListener(
      "change",
      updateOrientation
    );
    updateOrientation();

    return () => subscription?.remove();
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playOverSound();
            Alert.alert("Timer Finished!", "Your countdown has ended.");
            return 0;
          }
          // Play warning sound when reaching 10 seconds or less
          if (prev <= 10 && !hasPlayedWarning) {
            playWarningSound();
            setHasPlayedWarning(true);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, hasPlayedWarning]);

  const playWarningSound = async () => {
    try {
      if (warningSound.current) {
        await warningSound.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing warning sound:', error);
    }
  };

  const playOverSound = async () => {
    try {
      if (overSound.current) {
        await overSound.current.replayAsync();
      }
    } catch (error) {
      console.log('Error playing over sound:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (!isRunning) {
      // Reset warning flag when starting timer
      setHasPlayedWarning(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialTime);
    setHasPlayedWarning(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsRunning(false);
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    setInputMinutes(mins.toString());
    setInputSeconds(secs.toString());
  };

  const handleSaveEdit = () => {
    const totalSeconds =
      (parseInt(inputMinutes) || 0) * 60 + (parseInt(inputSeconds) || 0);
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setInitialTime(totalSeconds);
      setIsEditing(false);
    } else {
      Alert.alert("Invalid Time", "Please enter a valid time greater than 0.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isLandscape = orientation === "landscape";

  if (isLandscape) {
    return (
      <ThemedView
        style={[
          styles.landscapeContainer,
          { backgroundColor: 'transparent' },
        ]}
      >
        <View style={styles.landscapeTimerSection}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.timeInput,
                    { color: colors.text, borderBottomColor: colors.text },
                  ]}
                  value={inputMinutes}
                  onChangeText={setInputMinutes}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
                <ThemedText style={[styles.separator, { color: colors.text }]}>
                  :
                </ThemedText>
                <TextInput
                  style={[
                    styles.timeInput,
                    { color: colors.text, borderBottomColor: colors.text },
                  ]}
                  value={inputSeconds}
                  onChangeText={setInputSeconds}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.tint },
                  ]}
                  onPress={handleSaveEdit}
                >
                  <ThemedText style={styles.editButtonText}>Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: colors.tabIconDefault },
                  ]}
                  onPress={handleCancelEdit}
                >
                  <ThemedText style={styles.editButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEdit} style={styles.landscapeTimerDisplay} disabled={isEditing}>
              <Text
                style={[
                  styles.landscapeTimerText,
                  { color: isWarning ? "#FF0000" : colors.text },
                  isWarning && styles.warningText,
                ]}
              >
                {formatTime(timeLeft)}
              </Text>
              
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.landscapeControlsSection}>
          <TouchableOpacity
            style={[
              styles.landscapeControlButton,
              { backgroundColor: '#808080' },
            ]}
            onPress={handlePlayPause}
            disabled={isEditing}
          >
            <IconSymbol
              name={isRunning ? "pause.fill" : "play.fill"}
              size={18}
              color="white"
            />
            <ThemedText style={styles.landscapeButtonText}>
              {isRunning ? "Pause" : "Start"}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.landscapeControlButton,
              { backgroundColor: colors.tabIconDefault },
            ]}
            onPress={handleReset}
            disabled={isEditing}
          >
            <IconSymbol name="arrow.clockwise" size={18} color="white" />
            <ThemedText style={styles.landscapeButtonText}>Reset</ThemedText>
          </TouchableOpacity>


        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: 'transparent' }]}
    >
      <View style={styles.timerContainer}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.timeInput,
                  { color: colors.text, borderColor: colors.tabIconDefault },
                ]}
                value={inputMinutes}
                onChangeText={setInputMinutes}
                keyboardType="numeric"
                maxLength={2}
                placeholder="MM"
                placeholderTextColor={colors.tabIconDefault}
              />
              <ThemedText style={styles.separator}>:</ThemedText>
              <TextInput
                style={[
                  styles.timeInput,
                  { color: colors.text, borderColor: colors.tabIconDefault },
                ]}
                value={inputSeconds}
                onChangeText={setInputSeconds}
                keyboardType="numeric"
                maxLength={2}
                placeholder="SS"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.tint }]}
                onPress={handleSaveEdit}
              >
                <ThemedText style={styles.editButtonText}>Save</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.editButton,
                  { backgroundColor: colors.tabIconDefault },
                ]}
                onPress={handleCancelEdit}
              >
                <ThemedText style={styles.editButtonText}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handleEdit} style={styles.timerDisplay} disabled={isEditing}>
            <Text
              style={[
                styles.timerText,
                { color: isWarning ? "#FF0000" : colors.text },
                isWarning && styles.warningText,
              ]}
            >
              {formatTime(timeLeft)}
            </Text>

          </TouchableOpacity>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.playPauseButton,
            { backgroundColor: '#808080' },
          ]}
          onPress={handlePlayPause}
          disabled={isEditing}
        >
          <IconSymbol
            name={isRunning ? "pause.fill" : "play.fill"}
            size={32}
            color="white"
          />
          <ThemedText style={styles.controlButtonText}>
            {isRunning ? "Pause" : "Start"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.tabIconDefault },
          ]}
          onPress={handleReset}
          disabled={isEditing}
        >
          <IconSymbol name="arrow.clockwise" size={28} color="white" />
          <ThemedText style={styles.controlButtonText}>Reset</ThemedText>
        </TouchableOpacity>


      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  landscapeTimerSection: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  landscapeControlsSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 20,
  },
  landscapeTimerText: {
    fontSize: 160,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  landscapeTimerDisplay: {
    alignItems: "center",
  },
  landscapeTapToEdit: {
    marginTop: 5,
    fontSize: 14,
    opacity: 0.6,
  },
  landscapeControlButton: {
    width: 60,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  landscapeButtonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 1,
  },

  timerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  timerDisplay: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 120,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    textAlign: "center",
  },
  warningText: {
    textShadowColor: "#FF0000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tapToEdit: {
    marginTop: 10,
    fontSize: 16,
    opacity: 0.6,
  },
  editContainer: {
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  timeInput: {
    fontSize: 60,
    fontWeight: "bold",
    textAlign: "center",
    borderBottomWidth: 2,
    minWidth: 100,
    paddingVertical: 10,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  separator: {
    fontSize: 60,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  editButtons: {
    flexDirection: "row",
    gap: 20,
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: "center",
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 40,
  },
  controlButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 80,
  },
  playPauseButton: {
    minWidth: 100,
  },
  controlButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 3,
  },
});
