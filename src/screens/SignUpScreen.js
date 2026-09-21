import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowLeft } from 'lucide-react-native';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { register, loginWithGoogle } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Por favor llena todos los campos.');
      return;
    }
    setError('');
    const res = await register(name, email, password);
    if (!res.success) {
      setError('Este correo ya está registrado.');
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    const res = await loginWithGoogle();
    if (!res.success && res.error === 'local_expo_google_auth') {
       setError('El registro con Google requiere que la app esté desplegada en Producción y el dominio autorizado en Firebase.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 60}}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#8E8E93" size={24} />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Comienza a organizar tu dinero hoy</Text>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo o apodo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan Pérez"
              placeholderTextColor="#636366"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
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

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Registrarse</Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
             <View style={styles.separatorLine} />
             <Text style={styles.separatorText}>o continuar con</Text>
             <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignUp}>
            <Text style={styles.googleIconPlaceholder}>G</Text>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  backBtn: { position: 'absolute', top: 60, left: 24, zIndex: 10, padding: 8 },
  logoContainer: { marginBottom: 40, marginTop: 40 },
  title: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  subtitle: { fontSize: 16, color: '#8E8E93', marginTop: 8 },
  formContainer: { width: '100%' },
  errorText: { color: '#FF453A', marginBottom: 16, textAlign: 'center', fontSize: 14 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#E5E5EA', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { height: 56, backgroundColor: '#12121A', borderRadius: 12, paddingHorizontal: 16, color: '#FFFFFF', fontSize: 16, borderWidth: 1, borderColor: '#1E1E2A' },
  button: { height: 56, backgroundColor: '#67E8F9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
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
  },
  googleIconPlaceholder: { color: '#000', fontWeight: '900', fontSize: 18, marginRight: 10 },
  googleButtonText: { color: '#000000', fontSize: 16, fontWeight: '700' },
});
