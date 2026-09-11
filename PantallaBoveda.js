import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { agregarArchivo, borrarArchivo, leerArchivos } from './guardarArchivos';

const PESTANAS = [
  { id: 'foto', titulo: 'Fotos' },
  { id: 'video', titulo: 'Videos' },
  { id: 'documento', titulo: 'Docs' },
];

export default function PantallaBoveda({ onBloquear }) {
  const [pestana, setPestana] = useState('foto');
  const [archivos, setArchivos] = useState([]);
  const [viendo, setViendo] = useState(null);

  async function cargar() {
    try {
      const datos = await leerArchivos();
      setArchivos(datos || []);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los archivos guardados.');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const visibles = archivos.filter((item) => item.tipo === pestana);

  async function agregarFotoOVideo() {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tus archivos multimedia.');
        return;
      }

      const esVideo = pestana === 'video';
      
      // Corrección del API de ImagePicker para evitar la advertencia
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: esVideo 
          ? ImagePicker.MediaType.Videos 
          : ImagePicker.MediaType.Images,
        quality: 0.8,
      });

      if (resultado.canceled || !resultado.assets?.length) return;

      const archivo = resultado.assets[0];
      const nombre = archivo.fileName || (esVideo ? 'video.mp4' : 'foto.jpg');
      await agregarArchivo(archivo.uri, nombre, pestana);
      await cargar();
    } catch (error) {
      Alert.alert('Error al guardar', 'No se pudo importar el archivo seleccionado.');
    }
  }

  async function agregarDocumento() {
    try {
      const resultado = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (resultado.canceled || !resultado.assets?.length) return;

      const archivo = resultado.assets[0];
      await agregarArchivo(archivo.uri, archivo.name || 'documento.pdf', 'documento');
      await cargar();
    } catch (error) {
      Alert.alert('Error', 'No se pudo importar el documento.');
    }
  }

  function agregar() {
    if (pestana === 'documento') {
      agregarDocumento();
    } else {
      agregarFotoOVideo();
    }
  }

  function confirmarBorrar(item) {
    Alert.alert('Confirmar eliminación', `¿Deseas eliminar "${item.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await borrarArchivo(item.id);
            setViendo(null);
            await cargar();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar el archivo.');
          }
        },
      },
    ]);
  }

  async function abrirArchivo(item) {
    try {
      if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(item.uri);
        return;
      }
      await Linking.openURL(item.uri);
    } catch (error) {
      Alert.alert('Error al abrir', 'Este dispositivo no tiene una app asociada para este archivo.');
    }
  }

  function tocarItem(item) {
    if (item.tipo === 'foto') {
      setViendo(item);
      return;
    }
    abrirArchivo(item);
  }

  return (
    <View style={styles.fondo}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Tu Caja Fuerte</Text>
        <TouchableOpacity onPress={onBloquear} style={styles.botonBloquear} activeOpacity={0.8}>
          <Text style={styles.textoBloquear}>🔒 Bloquear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pestanas}>
        {PESTANAS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.pestana, pestana === tab.id && styles.pestanaActiva]}
            onPress={() => setPestana(tab.id)}
          >
            <Text style={[styles.pestanaTexto, pestana === tab.id && styles.pestanaTextoActiva]}>
              {tab.titulo}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visibles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacioContenedor}>
            <Text style={styles.vacioEmoji}>📂</Text>
            <Text style={styles.vacio}>No hay elementos guardados en esta sección.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tarjeta} onPress={() => tocarItem(item)} activeOpacity={0.7}>
            {item.tipo === 'foto' ? (
              <Image source={{ uri: item.uri }} style={styles.miniatura} />
            ) : (
              <View style={styles.iconoGrande}>
                <Text style={styles.emoji}>{item.tipo === 'video' ? '🎬' : '📄'}</Text>
              </View>
            )}
            <Text numberOfLines={1} style={styles.nombre}>
              {item.nombre}
            </Text>
            <TouchableOpacity onPress={() => confirmarBorrar(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.borrar}>Borrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.botonMas} onPress={agregar} activeOpacity={0.85}>
        <Text style={styles.masTexto}>
          + Agregar {pestana === 'foto' ? 'foto' : pestana === 'video' ? 'video' : 'documento'}
        </Text>
      </TouchableOpacity>

      <Modal visible={!!viendo} animationType="fade" transparent onRequestClose={() => setViendo(null)}>
        <View style={styles.modalFondo}>
          {viendo && (
            <Image source={{ uri: viendo.uri }} style={styles.vistaGrande} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.cerrar} onPress={() => setViendo(null)}>
            <Text style={styles.cerrarTexto}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#F3F6F4',
    paddingTop: 52,
  },
  encabezado: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justify: 'space-between',
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
  botonBloquear: {
    backgroundColor: '#1B4D3E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoBloquear: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  pestanas: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#DDE8E3',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  pestana: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  pestanaActiva: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pestanaTexto: {
    color: '#5B7268',
    fontWeight: '600',
  },
  pestanaTextoActiva: {
    color: '#1B4D3E',
    fontWeight: 'bold',
  },
  lista: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  vacioContenedor: {
    alignItems: 'center',
    marginTop: 60,
  },
  vacioEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  vacio: {
    textAlign: 'center',
    color: '#6A7C74',
    fontSize: 15,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  miniatura: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#EEE',
    marginRight: 12,
  },
  iconoGrande: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E8F1ED',
    alignItems: 'center',
    justify: 'center',
    marginRight: 12,
  },
  emoji: {
    fontSize: 24,
  },
  nombre: {
    flex: 1,
    fontSize: 15,
    color: '#20332C',
    marginRight: 8,
    fontWeight: '500',
  },
  borrar: {
    color: '#B42318',
    fontWeight: 'bold',
    fontSize: 13,
  },
  botonMas: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    backgroundColor: '#F4C430',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  masTexto: {
    color: '#1B4D3E',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justify: 'center',
  },
  vistaGrande: {
    width: '100%',
    height: '75%',
  },
  cerrar: {
    alignSelf: 'center',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cerrarTexto: {
    fontWeight: 'bold',
    color: '#1B4D3E',
  },
});