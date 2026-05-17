import { StyleSheet } from 'react-native';
import { C } from '../constants/colors';

export const G = StyleSheet.create({
  fill:    { flex: 1 },
  abs:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  center:  { alignItems: 'center', justifyContent: 'center' },
  row:     { flexDirection: 'row', alignItems: 'center' },

  h1: { fontSize: 36, fontWeight: '700', color: C.text100, letterSpacing: -0.5 },
  h2: { fontSize: 26, fontWeight: '700', color: C.text100, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', color: C.text100 },
  body: { fontSize: 15, fontWeight: '400', color: C.text70, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '400', color: C.text45, letterSpacing: 0.3 },
  slogan: {
    fontSize: 10,
    fontWeight: '600',
    color: C.text100,
    letterSpacing: 6.5,
    textTransform: 'uppercase',
  },
});
