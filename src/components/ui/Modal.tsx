import React, { useCallback } from 'react';
import {
  Modal as RNModal, View, Text, StyleSheet, Pressable,
  TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { DARK, TEXT } from '../../constants/colors';

interface ModalProps {
  visible:   boolean;
  onClose:   () => void;
  title?:    string;
  children:  React.ReactNode;
  height?:   number | string;
}

const { height: SCREEN_H } = Dimensions.get('window');

export function Modal({ visible, onClose, title, children, height = SCREEN_H * 0.6 }: ModalProps) {
  const { primary } = useTheme();

  return (
    <RNModal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.overlay}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View
        entering={SlideInDown.springify().damping(18)}
        exiting={SlideOutDown.duration(250)}
        style={[styles.sheet, { height: height as number }]}
      >
        <View style={[styles.handle, { backgroundColor: primary }]} />
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close">
              <Text style={[styles.closeText, { color: primary }]}>✕</Text>
            </Pressable>
          </View>
        )}
        {children}
      </Animated.View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: DARK.card,
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    borderTopWidth:  1,
    borderColor:     'rgba(255,255,255,0.08)',
    paddingHorizontal: 20,
    paddingBottom:   40,
  },
  handle: {
    width:        40,
    height:        4,
    borderRadius:  2,
    alignSelf:    'center',
    marginTop:    12,
    marginBottom:  8,
    opacity:       0.6,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor:    'rgba(255,255,255,0.06)',
    marginBottom:   16,
  },
  title: {
    color:      TEXT.primary,
    fontSize:   18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize:   18,
    fontWeight: '700',
  },
});
