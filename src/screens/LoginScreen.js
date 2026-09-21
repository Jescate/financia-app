import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Wallet } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, ingresa correo y contraseña.');
      return;
    }
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError('Usuario no registrado o credenciales inválidas.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const res = await loginWithGoogle();
    if (!res.success && res.error === 'local_expo_google_auth') {
       setError('El inicio de sesión con Google requiere que la app esté desplegada en Producción y el dominio autorizado en Firebase.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <Wallet color="#32D74B" size={48} />
          </View>
          <Text style={styles.title}>FinancIA</Text>
          <Text style={styles.subtitle}>Tus finanzas personales, inteligentes.</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. usuarioa@test.com"
              placeholderTextColor="#636366"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#636366"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
             <View style={styles.separatorLine} />
             <Text style={styles.separatorText}>o continuar con</Text>
             <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleIconPlaceholder}>G</Text>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate en 1 min</Text></Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#12121A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: '#FF453A',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: '#E5E5EA',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    backgroundColor: '#12121A',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#1E1E2A',
  },
  button: {
    height: 56,
    backgroundColor: '#32D74B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#32D74B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#1E1E2A' },
  separatorText: { color: '#8E8E93', paddingHorizontal: 10, fontSize: 13 },
  googleButton: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconPlaceholder: { color: '#000', fontWeight: '900', fontSize: 18, marginRight: 10 },
  googleButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
  linksContainer: { marginTop: 32, alignItems: 'center', gap: 16, paddingBottom: 20 },
  link: { color: '#8E8E93', fontSize: 14 },
  linkBold: { color: '#00E5CC', fontWeight: '700' }
});
