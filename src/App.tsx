import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Trash2, Play, Eye, EyeOff, RotateCcw, LogOut, Shuffle, Lock } from 'lucide-react';
import './styles/ImpostorGame.css';

// Tipos de TypeScript
interface User {
  password: string;
  wordPool: string[];
}

interface Player {
  name: string;
  revealed: boolean;
}

interface CurrentUser {
  username: string;
  wordPool: string[];
}

export default function ImpostorGame() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [showLogin, setShowLogin] = useState(true);
  const [gameState, setGameState] = useState<'setup' | 'revealing' | 'playing' | 'ended'>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState('');
  const [impostorIndex, setImpostorIndex] = useState(-1);
  const [playersRevealed, setPlayersRevealed] = useState<number[]>([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState<number[]>([]);
  const [showWords, setShowWords] = useState(false);
  const [notification, setNotification] = useState<string>('');

  // ✅ REFS sincrónicas - historial de últimas 2 rondas
  // Índice 0 = más reciente, índice 1 = penúltima ronda
  const recentImpostorsRef = useRef<string[]>([]);   // últimos 2 impostores
  const recentWordsRef = useRef<string[]>([]);        // últimas 2 palabras

  useEffect(() => {
    const savedUsers = localStorage.getItem('impostorUsers');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const saveUsers = (newUsers: Record<string, User>) => {
    localStorage.setItem('impostorUsers', JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLogin(true);
    setGameState('setup');
    setPlayers([]);
    setSelectedWord('');
    setImpostorIndex(-1);
    setPlayersRevealed([]);
    setEliminatedPlayers([]);
    // Limpiar historial
    recentImpostorsRef.current = [];
    recentWordsRef.current = [];
  };

  const startGame = () => {
    if (players.length < 3) {
      alert('Se necesitan al menos 3 jugadores');
      return;
    }
    if (!currentUser || currentUser.wordPool.length === 0) {
      alert('Debes tener palabras en tu pool');
      return;
    }

    // ✅ SELECCIÓN DE PALABRA: excluir las últimas 2 palabras usadas
    let availableWords = currentUser.wordPool.filter(
      word => !recentWordsRef.current.includes(word)
    );
    // Si no quedan palabras disponibles (pool muy pequeño), relajar restricción
    // primero intentar excluir solo la más reciente, luego usar todas
    if (availableWords.length === 0) {
      availableWords = currentUser.wordPool.filter(
        word => word !== recentWordsRef.current[0]
      );
    }
    if (availableWords.length === 0) {
      availableWords = [...currentUser.wordPool];
    }

    const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];

    // ✅ SELECCIÓN DE IMPOSTOR: excluir los últimos 2 impostores
    let availablePlayers = players.filter(
      player => !recentImpostorsRef.current.includes(player.name)
    );
    // Si no quedan jugadores disponibles (pocos jugadores), relajar restricción
    // primero intentar excluir solo el más reciente, luego usar todos
    if (availablePlayers.length === 0) {
      availablePlayers = players.filter(
        player => player.name !== recentImpostorsRef.current[0]
      );
    }
    if (availablePlayers.length === 0) {
      availablePlayers = [...players];
    }

    const randomIdx = Math.floor(Math.random() * availablePlayers.length);
    const impostorName = availablePlayers[randomIdx].name;

    // ✅ Actualizar historial INMEDIATAMENTE (sincrónico)
    // Insertar al frente y mantener solo los últimos 2
    recentWordsRef.current = [randomWord, ...recentWordsRef.current].slice(0, 2);
    recentImpostorsRef.current = [impostorName, ...recentImpostorsRef.current].slice(0, 2);

    // ✅ Primero mezclar, LUEGO buscar el índice en el array mezclado
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const impostorIdx = shuffled.findIndex(p => p.name === impostorName);

    setSelectedWord(randomWord);
    setImpostorIndex(impostorIdx);
    setPlayers(shuffled);
    setGameState('revealing');
    setCurrentRevealIndex(0);
    setPlayersRevealed([]);
    setEliminatedPlayers([]);
  };

  // Componente de Login/Registro
  const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);

    const handleSubmit = () => {
      if (isRegister) {
        if (users[username]) {
          alert('Usuario ya existe');
          return;
        }
        const newUsers = {
          ...users,
          [username]: { password, wordPool: ['Perro', 'Gato', 'Casa', 'Árbol', 'Coche'] }
        };
        saveUsers(newUsers);
        setCurrentUser({ username, wordPool: newUsers[username].wordPool });
        setShowLogin(false);
      } else {
        if (!users[username] || users[username].password !== password) {
          alert('Usuario o contraseña incorrectos');
          return;
        }
        setCurrentUser({ username, wordPool: users[username].wordPool });
        setShowLogin(false);
      }
    };

    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg transform hover:scale-110 transition-transform">
              <span className="text-4xl">🕵️</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
              El Impostor
            </h1>
            <p className="text-white/70 text-sm">
              {isRegister ? 'Crea tu cuenta para comenzar' : 'Ingresa para jugar'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                placeholder="Tu nombre de usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full pl-11 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isRegister ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </div>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-white/70 hover:text-white transition-colors text-sm"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
    );
  };

  // Pantalla de gestión de palabras
  const WordPoolManager = () => {
    const [newWord, setNewWord] = useState('');

    const addWord = () => {
      if (!newWord.trim() || !currentUser) return;
      if (currentUser.wordPool.includes(newWord.trim())) {
        alert('Esta palabra ya existe en tu pool');
        return;
      }
      const updatedPool = [...currentUser.wordPool, newWord.trim()];
      const newUsers = {
        ...users,
        [currentUser.username]: { ...users[currentUser.username], wordPool: updatedPool }
      };
      saveUsers(newUsers);
      setCurrentUser({ ...currentUser, wordPool: updatedPool });
      setNewWord('');
    };

    const removeWord = (index: number) => {
      if (!currentUser) return;
      const updatedPool = currentUser.wordPool.filter((_, i) => i !== index);
      const newUsers = {
        ...users,
        [currentUser.username]: { ...users[currentUser.username], wordPool: updatedPool }
      };
      saveUsers(newUsers);
      setCurrentUser({ ...currentUser, wordPool: updatedPool });
    };

    const clearAllWords = () => {
      if (!currentUser) return;
      if (!window.confirm(`¿Borrar todas las ${currentUser.wordPool.length} palabras del pool?`)) return;
      const newUsers = {
        ...users,
        [currentUser.username]: { ...users[currentUser.username], wordPool: [] }
      };
      saveUsers(newUsers);
      setCurrentUser({ ...currentUser, wordPool: [] });
      // Limpiar historial de palabras también
      recentWordsRef.current = [];
    };

    if (!currentUser) return null;

    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 h-full flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">📝</span>
            Pool de Palabras
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWords(!showWords)}
              className="text-sm bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-4 py-2 rounded-xl hover:from-purple-200 hover:to-pink-200 transition-all flex items-center gap-2 font-medium shadow-sm"
            >
              {showWords ? <EyeOff size={16} /> : <Eye size={16} />}
              {showWords ? 'Ocultar' : 'Mostrar'}
            </button>
            {currentUser.wordPool.length > 0 && (
              <button
                onClick={clearAllWords}
                title="Borrar todas las palabras"
                className="text-sm bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-200 transition-all flex items-center gap-1 font-medium shadow-sm"
              >
                <Trash2 size={15} />
                Borrar todo
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addWord()}
            placeholder="Agrega una nueva palabra..."
            className="flex-1 px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition"
          />
          <button
            onClick={addWord}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-green-500/50 transition-all transform hover:scale-105 active:scale-95"
          >
            <Plus size={22} />
          </button>
        </div>
        <div className="flex-1 grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar mb-5">
          {currentUser.wordPool.map((word, index) => (
            <div
              key={index}
              className="group flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 rounded-xl border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md"
            >
              <span className="font-medium text-gray-700">
                {showWords ? word : '••••••'}
              </span>
              <button
                onClick={() => removeWord(index)}
                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        {currentUser.wordPool.length === 0 && (
          <div className="text-center py-8 text-gray-400 flex-1 flex items-center justify-center">
            <p>No tienes palabras aún. ¡Agrega algunas para comenzar!</p>
          </div>
        )}
      </div>
    );
  };

  // Configurar jugadores
  const SetupScreen = () => {
    const [playerName, setPlayerName] = useState('');

    const addPlayer = () => {
      if (!playerName.trim()) return;
      if (players.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
        alert('Este jugador ya fue agregado');
        return;
      }
      setPlayers([...players, { name: playerName.trim(), revealed: false }]);
      setPlayerName('');
    };

    const removePlayer = (index: number) => {
      setPlayers(players.filter((_, i) => i !== index));
    };

    const shufflePlayers = () => {
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      setPlayers(shuffled);
    };

    const clearAllPlayers = () => {
      if (players.length === 0) return;
      if (!window.confirm(`¿Borrar los ${players.length} jugadores de la lista?`)) return;
      setPlayers([]);
      // Limpiar historial de impostores también
      recentImpostorsRef.current = [];
    };

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <WordPoolManager />
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Users size={28} className="text-blue-600" />
                Jugadores
                <span className="text-lg font-normal text-gray-500">({players.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                {players.length > 0 && (
                  <>
                    <button
                      onClick={shufflePlayers}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                      <Shuffle size={18} />
                      <span className="font-medium">Mezclar</span>
                    </button>
                    <button
                      onClick={clearAllPlayers}
                      title="Borrar todos los jugadores"
                      className="bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-200 transition-all flex items-center gap-1 font-medium"
                    >
                      <Trash2 size={15} />
                      Borrar todo
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Nombre del jugador..."
                className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              />
              <button
                onClick={addPlayer}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all transform hover:scale-105 active:scale-95"
              >
                <Plus size={22} />
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4 rounded-xl border border-blue-100 hover:border-blue-300 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">{index + 1}</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <span className="font-semibold text-gray-800 text-lg">{player.name}</span>
                  </div>
                  <button
                    onClick={() => removePlayer(index)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            {players.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p>Agrega jugadores para comenzar la partida</p>
              </div>
            )}

            {/* ✅ Indicador de los últimos 2 impostores */}
            {recentImpostorsRef.current.length > 0 && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <p className="text-sm text-orange-700 text-center">
                  🚫 Bloqueados esta ronda:{' '}
                  <strong>{recentImpostorsRef.current.join(' y ')}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Revelar palabras
  const RevealScreen = () => {
    const currentPlayer = players[currentRevealIndex];
    const isImpostor = currentRevealIndex === impostorIndex;
    const [revealed, setRevealed] = useState(false);

    const handleReveal = () => setRevealed(true);

    const handleNext = () => {
      const newRevealed = [...playersRevealed, currentRevealIndex];
      setPlayersRevealed(newRevealed);

      if (currentRevealIndex < players.length - 1) {
        setCurrentRevealIndex(currentRevealIndex + 1);
        setRevealed(false);
      } else {
        setGameState('playing');
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 animate-pulse"></div>
        </div>

        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-10 w-full max-w-lg text-center">
          <div className="mb-6">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                <span className="text-white font-bold text-3xl">{currentRevealIndex + 1}</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-lg animate-bounce"></div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Turno de:</h2>
            <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {currentPlayer.name}
            </p>
          </div>

          {!revealed ? (
            <button
              onClick={handleReveal}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-5 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Eye size={28} />
              Ver mi palabra
            </button>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              <div className={`p-10 rounded-2xl shadow-2xl ${
                isImpostor
                  ? 'bg-gradient-to-br from-red-500 to-orange-500'
                  : 'bg-gradient-to-br from-green-500 to-emerald-500'
              }`}>
                <p className="text-white/90 text-sm mb-3 font-medium">
                  {isImpostor ? 'Eres el...' : 'Tu palabra es:'}
                </p>
                <p className="text-5xl font-black text-white drop-shadow-lg">
                  {isImpostor ? '🕵️ IMPOSTOR' : selectedWord}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-5 rounded-2xl font-bold text-xl transition-all flex items-center justify-center gap-3 shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <EyeOff size={28} />
                SHHHHH (Siguiente)
              </button>
            </div>
          )}

          <div className="mt-8 text-white/60 text-sm font-medium">
            Jugador {currentRevealIndex + 1} de {players.length}
          </div>
        </div>
      </div>
    );
  };

  // Pantalla de juego
  const PlayingScreen = () => {
    const activePlayers = players.filter((_, i) => !eliminatedPlayers.includes(i));

    const eliminatePlayer = (index: number) => {
      const newEliminated = [...eliminatedPlayers, index];
      setEliminatedPlayers(newEliminated);

      if (index === impostorIndex) {
        setGameState('ended');
        return;
      }

      if (activePlayers.length - 1 <= 2) {
        setGameState('ended');
      }
    };

    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100">
          <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            🎮 Ronda en Progreso
          </h3>

          <div className="mb-8 bg-gradient-to-r from-yellow-100 to-orange-100 p-6 rounded-2xl border-2 border-yellow-300 shadow-lg">
            <p className="text-center text-orange-900 font-bold text-lg mb-2">
              ⚠️ Discutan y voten para eliminar al sospechoso
            </p>
            <p className="text-center text-orange-700 text-sm">
              Los inocentes conocen la palabra. El impostor debe adivinarla.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-xl text-gray-800 mb-4 flex items-center gap-2">
              <Users size={24} className="text-blue-600" />
              Jugadores Activos:
            </h4>
            {players.map((player, index) => (
              <div
                key={index}
                className={`group flex items-center justify-between p-5 rounded-xl transition-all ${
                  eliminatedPlayers.includes(index)
                    ? 'bg-gray-100 opacity-40 border border-gray-200'
                    : 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    eliminatedPlayers.includes(index) ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-500'
                  }`}>
                    <span className="text-white font-bold text-xl">{index + 1}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-800 text-lg block">{player.name}</span>
                    {eliminatedPlayers.includes(index) && (
                      <span className="text-sm text-gray-500">Eliminado ❌</span>
                    )}
                  </div>
                </div>
                {!eliminatedPlayers.includes(index) && (
                  <button
                    onClick={() => eliminatePlayer(index)}
                    className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all font-semibold transform hover:scale-105 active:scale-95"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Pantalla final
  const EndScreen = () => {
    const impostorWon = !eliminatedPlayers.includes(impostorIndex);

    const resetGame = () => {
      const allPlayers = players.map(p => ({ ...p, revealed: false }));
      setPlayers(allPlayers);
      setGameState('setup');
      setSelectedWord('');
      setImpostorIndex(-1);
      setCurrentRevealIndex(0);
      setPlayersRevealed([]);
      setEliminatedPlayers([]);
      // ✅ NO limpiamos las refs aquí — queremos que persistan para la siguiente ronda
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all flex items-center gap-2 font-semibold transform hover:scale-105 active:scale-95"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-10 text-center border border-purple-100 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-pink-500 rounded-full animate-bounce animation-delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-4000"></div>
          </div>

          <div className="relative z-10">
            <div className="text-8xl mb-6 animate-bounce">
              {impostorWon ? '🕵️' : '🎉'}
            </div>

            <h2 className="text-4xl font-black mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ¡Juego Terminado!
            </h2>

            <div className={`mb-6 p-6 rounded-2xl ${
              impostorWon
                ? 'bg-gradient-to-r from-red-100 to-orange-100 border-2 border-red-300'
                : 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300'
            }`}>
              <p className="text-2xl font-bold mb-2">
                {impostorWon ? '¡El Impostor Ganó!' : '¡Los Inocentes Ganaron!'}
              </p>
              <p className="text-lg">
                El impostor era: <span className="font-black text-purple-600 text-xl">{players[impostorIndex]?.name}</span>
              </p>
            </div>

            <div className="mb-8 p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <p className="text-gray-600 mb-2">La palabra secreta era:</p>
              <p className="text-3xl font-black text-purple-700">{selectedWord}</p>
            </div>

            {/* ✅ Aviso de quiénes NO pueden ser impostores las próximas 2 rondas */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm text-orange-700">
                🚫 Bloqueados las próximas 2 rondas:{' '}
                <strong>{recentImpostorsRef.current.join(' y ')}</strong>
              </p>
            </div>

            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-3 mx-auto transform hover:scale-105 active:scale-95"
            >
              <RotateCcw size={24} />
              Nueva Ronda
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render principal
  if (showLogin) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 p-4">
      <div className="max-w-7xl mx-auto py-6">
        {gameState === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-purple-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🕵️</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      El Impostor
                    </h1>
                    <p className="text-sm text-gray-500">¿Quién es el impostor?</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Usuario</p>
                    <p className="font-bold text-gray-800">{currentUser?.username}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-3 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all flex items-center gap-2 font-semibold transform hover:scale-105 active:scale-95"
                  >
                    <LogOut size={20} />
                    Salir
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-5 border border-purple-100 flex items-center justify-center">
              <button
                onClick={startGame}
                disabled={players.length < 3 || !currentUser || currentUser.wordPool.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
              >
                <Play size={28} />
                Iniciar Juego
              </button>
            </div>
          </div>
        )}

        {notification && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-white/30 backdrop-blur-sm max-w-2xl">
              <p className="text-sm font-semibold text-center">{notification}</p>
            </div>
          </div>
        )}

        {gameState === 'setup' && <SetupScreen />}
        {gameState === 'revealing' && <RevealScreen />}
        {gameState === 'playing' && <PlayingScreen />}
        {gameState === 'ended' && <EndScreen />}
      </div>
    </div>
  );
}