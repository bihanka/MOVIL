import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import PantallaBloqueo from './PantallaBloqueo';
import PantallaBoveda from './PantallaBoveda';

export default function App() {
  const [desbloqueado, setDesbloqueado] = useState(false);

  return (
    <>
      <StatusBar style={desbloqueado ? 'dark' : 'light'} />
      {desbloqueado ? (
        <PantallaBoveda onBloquear={() => setDesbloqueado(false)} />
      ) : (
        <PantallaBloqueo onDesbloquear={() => setDesbloqueado(true)} />
      )}
    </>
  );
}
