import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Redirect } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, configured } from '../lib/firebase';
import { useSession } from '../lib/session';
import { Screen, Button, ErrorNotice, Loading, styles } from '../components/ui';
export default function Login() {
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  if (session.loading)
    return (
      <Screen>
        <Loading />
      </Screen>
    );
  if (session.user) return <Redirect href="/(staff)" />;
  async function login() {
    if (!auth || busy) return;
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError(new Error('Sign-in failed. Check your email and password.'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <View style={{ paddingTop: 60, gap: 18 }}>
        <Text style={styles.eyebrow}>PACKBAY · PACKING DESK</Text>
        <Text style={styles.heading}>Good things,{'\n'}ready to go.</Text>
        <Text style={styles.sub}>Sign in to pick, pack, and send a little joy.</Text>
      </View>
      {!configured && (
        <Text style={styles.error}>
          Connect Firebase and the API address using the setup guide before signing in.
        </Text>
      )}
      <View>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          editable={configured}
        />
      </View>
      <View>
        <Text style={styles.label}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          autoComplete="current-password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          editable={configured}
        />
      </View>
      <ErrorNotice error={error} />
      <Button
        title={busy ? 'Signing in…' : 'Open packing desk'}
        onPress={() => {
          void login();
        }}
        disabled={busy || !configured || !email || !password}
      />
      <Text style={styles.sub}>
        Your administrator creates your account. Customer phone numbers and shop revenue stay off
        this packing desk.
      </Text>
    </Screen>
  );
}
