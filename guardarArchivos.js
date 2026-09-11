import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const CLAVE = 'mis_archivos_guardados';

export async function leerArchivos() {
  try {
    const texto = await AsyncStorage.getItem(CLAVE);
    if (!texto) {
      return [];
    }
    return JSON.parse(texto);
  } catch (error) {
    return [];
  }
}

async function guardarLista(lista) {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(lista));
}

export async function agregarArchivo(origenUri, nombre, tipo) {
  let uri = origenUri;

  try {
    if (FileSystem.documentDirectory) {
      const carpeta = FileSystem.documentDirectory + 'caja_fuerte/';
      await FileSystem.makeDirectoryAsync(carpeta, { intermediates: true });
      const limpio = String(Date.now()) + '_' + nombre.replace(/[^a-zA-Z0-9._-]/g, '_');
      const destino = carpeta + limpio;
      await FileSystem.copyAsync({ from: origenUri, to: destino });
      uri = destino;
    }
  } catch (error) {
    uri = origenUri;
  }

  const lista = await leerArchivos();
  const nuevo = {
    id: String(Date.now()),
    nombre,
    tipo,
    uri,
  };
  lista.push(nuevo);
  await guardarLista(lista);
  return nuevo;
}

export async function borrarArchivo(id) {
  const lista = await leerArchivos();
  const archivo = lista.find((item) => item.id === id);

  if (archivo && archivo.uri && FileSystem.documentDirectory && archivo.uri.startsWith(FileSystem.documentDirectory)) {
    try {
      await FileSystem.deleteAsync(archivo.uri, { idempotent: true });
    } catch (error) {
      // Si no se puede borrar el archivo, igual lo quitamos de la lista
    }
  }

  await guardarLista(lista.filter((item) => item.id !== id));
}
