import { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

const PIN_CORRECTO = '1234';

export default function PantallaBloqueo({ onDesbloquear }) {
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [soportaBiometria, setSoportaBiometria] = useState(false);
  const [tipoBiometria, setTipoBiometria] = useState('Biometría'); // 'Face ID', 'Huella dactilar' o 'Biometría'

  useEffect(() => {
    verificarBiometria();
  }, []);

  async function verificarBiometria() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const registrado = await LocalAuthentication.isEnrolledAsync();

      if (compatible && registrado) {
        setSoportaBiometria(true);
        const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setTipoBiometria('Face ID');
        } else if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setTipoBiometria('Huella dactilar');
        }
      } else {
        setSoportaBiometria(false);
      }
    } catch (error) {
      setSoportaBiometria(false);
    }
  }

  function entrarConPin() {
    if (pin === PIN_CORRECTO) {
      setPin('');
      onDesbloquear();
      return;
    }
    Alert.alert('PIN incorrecto', 'Intenta de nuevo con el PIN 1234.');
    setPin('');
  }

  async function entrarConBiometria() {
    if (!soportaBiometria) {
      Alert.alert(
        'Biometría no configurada',
        'Configura tu huella o rostro en la configuración de tu dispositivo.'
      );
      return;
    }

    setCargando(true);
    try {
      const resultado = await LocalAuthentication.authenticateAsync({
        promptMessage: `Desbloquea usando ${tipoBiometria}`,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN',
        disableDeviceFallback: false,
      });

      if (resultado.success) {
        onDesbloquear();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar la identidad.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.iconoContenedor}>
        <Text style={styles.candado}>🔒</Text>
      </View>

      <Text style={styles.titulo}>Mi Caja Fuerte</Text>
      <Text style={styles.subtitulo}>
        Ingresa tu PIN o accede mediante {tipoBiometria.toLowerCase()}.
      </Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={setPin}
        placeholder="****"
        placeholderTextColor="#8AA396"
        keyboardType="number-pad"
        maxLength={4}
        secureTextEntry
      />
      <Text style={styles.ayuda}>PIN por defecto: 1234</Text>

      <TouchableOpacity 
        style={styles.botonPrincipal} 
        onPress={entrarConPin}
        activeOpacity={0.8}
      >
        <Text style={styles.textoBotonPrincipal}>Entrar con PIN</Text>
      </TouchableOpacity>

      {soportaBiometria && (
        <TouchableOpacity
          style={[styles.botonBiometrico, cargando && styles.deshabilitado]}
          onPress={entrarConBiometria}
          disabled={cargando}
          activeOpacity={0.7}
        >
          <Text style={styles.textoBotonBiometrico}>
            {cargando ? 'Verificando...' : `Usar ${tipoBiometria}`}
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#1B4D3E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconoContenedor: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  candado: {
    fontSize: 48,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitulo: {
    color: '#D7E8E0',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  input: {
    width: '100%',
    maxWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    fontSize: 32,
    letterSpacing: 16,
    textAlign: 'center',
    paddingVertical: 12,
    color: '#1B4D3E',
    fontWeight: 'bold',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  ayuda: {
    color: '#F4C430',
    marginTop: 10,
    marginBottom: 24,
    fontSize: 14,
    fontWeight: '500',
  },
  botonPrincipal: {
    backgroundColor: '#F4C430',
    paddingVertical: 16,
    borderRadius: 28,
    marginBottom: 12,
    width: '100%',
    maxWidth: 260,
    alignItems: 'center',
  },
  textoBotonPrincipal: {
    color: '#1B4D3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonBiometrico: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  textoBotonBiometrico: {
    color: '#FFFFFF',
    fontSize: 15,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  deshabilitado: {
    opacity: 0.5,
  },
});