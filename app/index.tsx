import { Redirect } from 'expo-router';

// Always show the Entry screen first.
// entry.tsx handles the animated logo → auto-navigates to /login.
// login.tsx navigates to /(tabs) on success or as guest.
export default function Index() {
  return <Redirect href="/entry" />;
}

