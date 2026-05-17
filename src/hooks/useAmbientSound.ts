import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useSoundStore } from '../stores/soundStore';
import { AMBIENT_SOUNDS } from '../constants/sounds';

export function useAmbientSound() {
  const soundRef  = useRef<Audio.Sound | null>(null);
  const { activeSoundId, volume, isPlaying, setActiveSound, setVolume, setPlaying, toggleSound } = useSoundStore();

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, []);

  const loadAndPlay = useCallback(async (id: string) => {
    await unload();
    const track = AMBIENT_SOUNDS.find((s) => s.id === id);
    if (!track?.uri) return; // no asset yet

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true });
      const { sound } = await Audio.Sound.createAsync(
        track.uri as any,
        { isLooping: true, volume, shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (e) {
      console.warn('[ZenForge] Could not load sound:', e);
    }
  }, [volume]);

  // React to store changes
  useEffect(() => {
    if (activeSoundId && isPlaying) {
      loadAndPlay(activeSoundId);
    } else {
      unload();
    }
    return () => { unload(); };
  }, [activeSoundId, isPlaying]);

  // Sync volume
  useEffect(() => {
    soundRef.current?.setVolumeAsync(volume).catch(() => {});
  }, [volume]);

  return {
    activeSoundId, volume, isPlaying,
    selectSound: setActiveSound,
    setVolume,
    toggleSound,
    stop: () => setPlaying(false),
  };
}
