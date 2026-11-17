import { useState, useEffect, useCallback } from 'react'
import './App.css'

type Screen = 'home' | 'create' | 'join' | 'lobby' | 'game' | 'results'

type Category =
  | 'Torneos Nacionales'
  | 'Copas Nacionales'
  | 'Copas Internacionales'

type Match = {
  id: string
  category: Category
  competition: string
  date: string
  homeTeam: string
  awayTeam: string
  homeGoals: number
  awayGoals: number
  stadium: string
  scorers: string[]
}

type MatchAnswer = {
  homeGoals: number
  awayGoals: number
  scorers: string[]
  points: number
  scorePoints: number
  scorersPoints: number
  exactScore: boolean
  correctOutcome: boolean
  correctScorers: string[]
  wrongScorers: string[]
  hasScoreAnswer: boolean
}

// EQUIPOS DE PRIMERA DIVISIÓN ARGENTINA 2026

const ARGENTINE_TEAMS = [
  'Aldosivi',
  'Argentinos Juniors',
  'Atlético Tucumán',
  'Banfield',
  'Barracas Central',
  'Belgrano',
  'Boca Juniors',
  'Central Córdoba',
  'Defensa y Justicia',
  'Deportivo Riestra',
  'Estudiantes de La Plata',
  'Estudiantes de Río Cuarto',
  'Gimnasia de Mendoza',
  'Gimnasia La Plata',
  'Huracán',
  'Independiente',
  'Independiente Rivadavia',
  'Instituto',
  'Lanús',
  'Newell’s Old Boys',
  'Platense',
  'Racing Club',
  'River Plate',
  'Rosario Central',
  'San Lorenzo',
  'Sarmiento',
  'Talleres',
  'Tigre',
  'Unión',
  'Vélez Sarsfield'
]

// PARTIDOS HISTÓRICOS DE EJEMPLO.
// Podés agregar más partidos a esta lista.
// Los goleadores se guardan una sola vez por jugador,
// aunque hayan marcado más de un gol.

const MATCHES: Match[] = [
  {
    id: 'match-1',
    category: 'Torneos Nacionales',
    competition: 'La Liga',
    date: '29/11/2010',
    homeTeam: 'Barcelona',
    awayTeam: 'Real Madrid',
    homeGoals: 5,
    stadium: "Bernabeu",
    awayGoals: 0,
    scorers: ['Xavi', 'Pedro', 'Villa', 'Jeffren']
  },
]

// NORMALIZAMOS LOS APELLIDOS PARA QUE NO IMPORTEN
// LAS MAYÚSCULAS, MINÚSCULAS NI LAS TILDES.

function normalizeSurname(surname: string) {
  return surname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')

  const [playerName, setPlayerName] = useState('')

  const [categories, setCategories] = useState<Category[]>([
    'Torneos Nacionales',
    'Copas Nacionales',
    'Copas Internacionales'
  ])

  // TODOS LOS EQUIPOS ESTÁN SELECCIONADOS INICIALMENTE.

  const [selectedTeams, setSelectedTeams] =
    useState<string[]>(ARGENTINE_TEAMS)

  const [rounds, setRounds] = useState(5)
  const [timeLimit, setTimeLimit] = useState(20)
  const [timeLeft, setTimeLeft] = useState(20)

  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [notice, setNotice] = useState('')

  const [gameMatches, setGameMatches] = useState<Match[]>([])
  const [matchIndex, setMatchIndex] = useState(0)

  const [answers, setAnswers] = useState<(MatchAnswer | undefined)[]>([])

  const [homeGoalsInput, setHomeGoalsInput] = useState('')
  const [awayGoalsInput, setAwayGoalsInput] = useState('')
  const [scorersInput, setScorersInput] = useState('')

  const currentMatch = gameMatches[matchIndex]
  const currentAnswer = answers[matchIndex]

  const totalPoints = answers.reduce(
    (total, answer) => total + (answer?.points ?? 0),
    0
  )

  // CONTAMOS SOLAMENTE LOS PARTIDOS QUE COINCIDEN
  // CON LAS CATEGORÍAS Y LOS EQUIPOS SELECCIONADOS.

  const availableMatchCount = MATCHES.filter(match =>
    categories.includes(match.category) &&
    (
      selectedTeams.includes(match.homeTeam) ||
      selectedTeams.includes(match.awayTeam)
    )
  ).length

  const answered = currentAnswer !== undefined

  const progress = gameMatches.length
    ? ((matchIndex + 1) / gameMatches.length) * 100
    : 0

  // SELECCIONAR O DESELECCIONAR CATEGORÍAS.

  function toggleCategory(selectedCategory: Category) {
    if (categories.includes(selectedCategory)) {
      if (categories.length === 1) {
        setNotice('Tenés que seleccionar al menos una categoría.')
        return
      }

      setCategories(categories.filter(
        category => category !== selectedCategory
      ))
    } else {
      setCategories([...categories, selectedCategory])
    }

    setNotice('')
  }

  // SELECCIONAR O DESELECCIONAR EQUIPOS.

  function toggleTeam(team: string) {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(
        selectedTeams.filter(selected => selected !== team)
      )
    } else {
      setSelectedTeams([...selectedTeams, team])
    }

    setNotice('')
  }

  // GENERAR CÓDIGO DE SALA.

  function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // CREAR SALA.

  function createRoom() {
    if (!playerName.trim()) {
      setNotice('Ingresá tu nombre para continuar.')
      return
    }

    setNotice('')
    setRoomCode(generateRoomCode())
    setScreen('lobby')
  }

  // UNIRSE A UNA SALA.

  function joinRoom() {
    if (!playerName.trim()) {
      setNotice('Ingresá tu nombre para continuar.')
      return
    }

    const code = joinCode.trim().toUpperCase()

    if (!/^[A-Z0-9]{4,6}$/.test(code)) {
      setNotice('Ingresá un código válido de entre 4 y 6 caracteres.')
      return
    }

    setNotice('')
    setRoomCode(code)
    setScreen('lobby')
  }

  // INICIAR PARTIDA.

  function startGame() {
    if (selectedTeams.length === 0) {
      setNotice('Seleccioná al menos un equipo.')
      setScreen('lobby')
      return
    }

    let availableMatches = MATCHES.filter(match =>
      categories.includes(match.category) &&
      (
        selectedTeams.includes(match.homeTeam) ||
        selectedTeams.includes(match.awayTeam)
      )
    )

    if (availableMatches.length === 0) {
      setNotice(
        'No hay partidos disponibles para los equipos y categorías seleccionados.'
      )
      setScreen('lobby')
      return
    }

    if (availableMatches.length < rounds) {
      setNotice(
        `Hay solamente ${availableMatches.length} partidos disponibles. ` +
        `Necesitás al menos ${rounds} para iniciar.`
      )
      setScreen('lobby')
      return
    }

    // MEZCLAMOS LOS PARTIDOS ALEATORIAMENTE.

    availableMatches = [...availableMatches].sort(
      () => Math.random() - 0.5
    )

    const selectedMatches = availableMatches.slice(0, rounds)

    setNotice('')
    setGameMatches(selectedMatches)
    setAnswers([])
    setMatchIndex(0)
    setTimeLeft(timeLimit)
    setHomeGoalsInput('')
    setAwayGoalsInput('')
    setScorersInput('')

    setScreen('game')
  }

  // EVALUAR RESPUESTA.

  const submitAnswer = useCallback((isTimeout = false) => {
    if (!currentMatch || answered) return

    const rawHome = homeGoalsInput.trim()
    const rawAway = awayGoalsInput.trim()

    const parsedHome = Number(rawHome)
    const parsedAway = Number(rawAway)

    const hasScoreAnswer =
      rawHome !== '' &&
      rawAway !== '' &&
      Number.isInteger(parsedHome) &&
      Number.isInteger(parsedAway) &&
      parsedHome >= 0 &&
      parsedAway >= 0

    if (!isTimeout && !hasScoreAnswer) {
      setNotice('Ingresá los dos marcadores con números enteros válidos.')
      return
    }

    const homeGoals = hasScoreAnswer ? parsedHome : 0
    const awayGoals = hasScoreAnswer ? parsedAway : 0

    setNotice('')

    const exactScore =
      hasScoreAnswer &&
      homeGoals === currentMatch.homeGoals &&
      awayGoals === currentMatch.awayGoals

    const correctOutcome =
      hasScoreAnswer &&
      Math.sign(homeGoals - awayGoals) ===
      Math.sign(currentMatch.homeGoals - currentMatch.awayGoals)

    let scorePoints = 0

    if (exactScore) {
      scorePoints = 3
    } else if (correctOutcome) {
      scorePoints = 1
    }

    const scorerGuesses = scorersInput
      .split(/\r?\n/)
      .map(surname => surname.trim())
      .filter(surname => surname !== '')

    const remainingScorers = [...currentMatch.scorers]

    const correctScorers: string[] = []
    const wrongScorers: string[] = []

    scorerGuesses.forEach(guess => {
      const normalizedGuess = normalizeSurname(guess)

      const correctIndex = remainingScorers.findIndex(
        actual => normalizeSurname(actual) === normalizedGuess
      )

      if (correctIndex !== -1) {
        correctScorers.push(guess)
        remainingScorers.splice(correctIndex, 1)
      } else {
        wrongScorers.push(guess)
      }
    })

    const scorersPoints =
      correctScorers.length * 2 - wrongScorers.length

    const points = scorePoints + scorersPoints

    const newAnswer: MatchAnswer = {
      homeGoals,
      awayGoals,
      scorers: scorerGuesses,
      points,
      scorePoints,
      scorersPoints,
      exactScore,
      correctOutcome,
      correctScorers,
      wrongScorers,
      hasScoreAnswer
    }

    setAnswers(previous => {
      const updated = [...previous]
      updated[matchIndex] = newAnswer
      return updated
    })
  }, [
    currentMatch,
    answered,
    homeGoalsInput,
    awayGoalsInput,
    scorersInput,
    matchIndex
  ])

  // PASAR AL SIGUIENTE PARTIDO.

  function nextMatch() {
    if (matchIndex + 1 < gameMatches.length) {
      setMatchIndex(previous => previous + 1)

      setHomeGoalsInput('')
      setAwayGoalsInput('')
      setScorersInput('')
      setTimeLeft(timeLimit)
      setNotice('')
    } else {
      setScreen('results')
    }
  }

  // TEMPORIZADOR.

  useEffect(() => {
    if (screen !== 'game' || answered) return

    if (timeLeft <= 0) {
      submitAnswer(true)
      return
    }

    const timer = window.setTimeout(() => {
      setTimeLeft(previous => previous - 1)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [screen, answered, timeLeft, submitAnswer])

  // COPIAR CÓDIGO DE SALA.

  function copyRoomCode() {
    if (!navigator.clipboard?.writeText) {
      alert('Tu código de sala es: ' + roomCode)
      return
    }

    navigator.clipboard.writeText(roomCode)
      .then(() => alert('Código copiado: ' + roomCode))
      .catch(() => alert('Tu código de sala es: ' + roomCode))
  }

  // VOLVER AL INICIO.

  function goHome() {
    setScreen('home')
    setNotice('')
  }

  return (
    <div className="app-shell">

      {/* ENCABEZADO */}

      <header className="topbar">
        <button className="brand" onClick={goHome}>
          <span className="brand-icon">⚽</span>
          <span>DAVO GAME</span>
        </button>

        <div className="topbar-right">
          <span className="demo-dot"></span>
          Modo de prueba
        </div>
      </header>

      <main className="main-content">

        {/* INICIO */}

        {screen === 'home' && (
          <section className="home-layout">
            <div className="hero-content">
              <div className="eyebrow">
                <span>⚡</span> DESAFIÁ A TUS AMIGOS
              </div>

              <h1>
                EL FÚTBOL SE JUEGA.
                <span> TAMBIÉN SE SABE.</span>
              </h1>

              <p className="hero-description">
                Reviví partidos históricos, adiviná sus resultados
                y demostrá cuánto sabés sobre sus goleadores.
              </p>

              <div className="home-actions">
                <button
                  className="button button-primary button-large"
                  onClick={() => {
                    setNotice('')
                    setScreen('create')
                  }}
                >
                  <span>＋</span> Crear partida
                </button>

                <button
                  className="button button-secondary button-large"
                  onClick={() => {
                    setNotice('')
                    setScreen('join')
                  }}
                >
                  Unirse a una partida <span>→</span>
                </button>
              </div>

              <div className="hero-features">
                <div>
                  <span>🏆</span>
                  <p>Competí</p>
                </div>
                <div>
                  <span>⚽</span>
                  <p>Recordá</p>
                </div>
                <div>
                  <span>🔥</span>
                  <p>Demostrá</p>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="visual-glow"></div>
              <div className="visual-ball">⚽</div>

              <div className="floating-card floating-card-top">
                <span className="floating-icon">🏆</span>
                <div>
                  <strong>El desafío comienza</strong>
                  <small>¿Cuánto sabés de fútbol?</small>
                </div>
              </div>

              <div className="floating-card floating-card-bottom">
                <div className="mini-avatars">
                  <span>👤</span>
                  <span>👤</span>
                  <span>👤</span>
                </div>
                <div>
                  <strong>Jugá con amigos</strong>
                  <small>Creá una sala y compartí el código</small>
                </div>
              </div>

              <div className="visual-label">DAVO GAME · 01</div>
            </div>
          </section>
        )}

        {/* CREAR PARTIDA */}

        {screen === 'create' && (
          <section className="form-page">
            <button className="back-button" onClick={goHome}>
              ← Volver al inicio
            </button>

            <div className="form-card">
              <div className="form-icon">🏆</div>
              <div className="eyebrow centered">NUEVO DESAFÍO</div>
              <h1>Crear partida</h1>
              <p className="form-description">
                Configurá tu partida y preparate para jugar.
              </p>

              <div className="form-group">
                <label htmlFor="create-name">Tu nombre</label>
                <input
                  id="create-name"
                  type="text"
                  placeholder="Ej. Lionel"
                  maxLength={20}
                  value={playerName}
                  onChange={event => setPlayerName(event.target.value)}
                />
              </div>

              {/* CATEGORÍAS */}

              <div className="form-group">
                <label>Categorías</label>

                <div className="category-selector">
                  {([
                    'Torneos Nacionales',
                    'Copas Nacionales',
                    'Copas Internacionales'
                  ] as Category[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-button ${
                        categories.includes(cat) ? 'selected' : ''
                      }`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {categories.includes(cat) ? '✓ ' : ''}
                      {cat}
                    </button>
                  ))}
                </div>

                <small className="selector-hint">
                  Podés seleccionar una, dos o todas las categorías.
                </small>
              </div>

              {/* EQUIPOS DE PRIMERA DIVISIÓN */}

              <div className="form-group">
                <label>
                  Equipos de Primera División Argentina
                </label>

                <p className="selector-hint">
                  {selectedTeams.length} de {ARGENTINE_TEAMS.length} equipos seleccionados.
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '14px'
                }}>
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setSelectedTeams([...ARGENTINE_TEAMS])
                      setNotice('')
                    }}
                  >
                    Seleccionar todos
                  </button>

                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => {
                      setSelectedTeams([])
                      setNotice('')
                    }}
                  >
                    Quitar todos
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                  gap: '8px'
                }}>
                  {ARGENTINE_TEAMS.map(team => (
                    <label
                      key={team}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedTeams.includes(team)
                          ? 'rgba(50, 180, 100, 0.12)'
                          : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team)}
                        onChange={() => toggleTeam(team)}
                      />

                      {team}
                    </label>
                  ))}
                </div>

                <small className="selector-hint">
                  Se incluirán los partidos en los que participe al menos uno de los equipos seleccionados.
                </small>
              </div>

              {/* CANTIDAD DE PARTIDOS */}

              <div className="form-group">
                <label>Cantidad de partidos</label>

                <div className="rounds-selector">
                  {[5, 10, 15, 20].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      className={`round-button ${
                        rounds === amount ? 'selected' : ''
                      }`}
                      onClick={() => setRounds(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>

                <small className="selector-hint">
                  Partidos disponibles con tu selección: {availableMatchCount}
                </small>
              </div>

              {/* TIEMPO POR PARTIDO */}

              <div className="form-group">
                <label>Tiempo por partido</label>

                <div className="rounds-selector">
                  {[10, 15, 20, 25, 30].map(seconds => (
                    <button
                      key={seconds}
                      type="button"
                      className={`round-button ${
                        timeLimit === seconds ? 'selected' : ''
                      }`}
                      onClick={() => setTimeLimit(seconds)}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>

                <small className="selector-hint">
                  Tiempo disponible para responder cada partido.
                </small>
              </div>

              {notice && <p className="notice">{notice}</p>}

              <button
                className="button button-primary button-full"
                onClick={createRoom}
              >
                Crear sala <span>→</span>
              </button>
            </div>
          </section>
        )}

        {/* UNIRSE A UNA PARTIDA */}

        {screen === 'join' && (
          <section className="form-page">
            <button className="back-button" onClick={goHome}>
              ← Volver al inicio
            </button>

            <div className="form-card">
              <div className="form-icon">🚪</div>
              <div className="eyebrow centered">ENTRAR AL JUEGO</div>
              <h1>Unirse a una partida</h1>
              <p className="form-description">
                Ingresá tus datos para entrar a una sala.
              </p>

              <div className="form-group">
                <label htmlFor="join-name">Tu nombre</label>
                <input
                  id="join-name"
                  type="text"
                  placeholder="Ej. Lionel"
                  maxLength={20}
                  value={playerName}
                  onChange={event => setPlayerName(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="room-code">Código de la sala</label>
                <input
                  id="room-code"
                  className="code-input"
                  type="text"
                  placeholder="EJ. A1B2C3"
                  maxLength={6}
                  value={joinCode}
                  onChange={event =>
                    setJoinCode(event.target.value.toUpperCase())
                  }
                />
              </div>

              {notice && <p className="notice">{notice}</p>}

              <button
                className="button button-primary button-full"
                onClick={joinRoom}
              >
                Entrar a la sala <span>→</span>
              </button>
            </div>
          </section>
        )}

        {/* SALA DE ESPERA */}

        {screen === 'lobby' && (
          <section className="lobby-page">
            <button className="back-button" onClick={goHome}>
              ← Salir de la sala
            </button>

            <div className="lobby-card">
              <div className="eyebrow centered">SALA DE ESPERA</div>
              <h1>¡Todo listo para jugar!</h1>
              <p className="form-description">
                Compartí el código con tus amigos.
              </p>

              <div className="room-code-box">
                <span>CÓDIGO DE LA SALA</span>
                <strong>{roomCode}</strong>
                <button className="copy-button" onClick={copyRoomCode}>
                  Copiar código
                </button>
              </div>

              <div className="players-header">
                <h2>Jugadores</h2>
                <span>1 / 8</span>
              </div>

              <div className="player-row">
                <div className="player-avatar">👤</div>
                <div className="player-info">
                  <strong>{playerName.trim()}</strong>
                  <small>Anfitrión</small>
                </div>
                <span className="host-tag">HOST</span>
              </div>

              <div className="waiting-message">
                <span className="waiting-pulse"></span>
                La sala está lista para comenzar
              </div>

              {notice && <p className="notice">{notice}</p>}

              <button
                className="button button-primary button-full"
                onClick={startGame}
              >
                Comenzar partida de prueba <span>→</span>
              </button>
            </div>
          </section>
        )}

        {/* JUEGO */}

        {screen === 'game' && currentMatch && (
          <section className="game-page">
            <div className="game-top">
              <button className="back-button" onClick={goHome}>
                ✕ Salir
              </button>

              <div className="game-room">
                SALA <strong>{roomCode}</strong>
              </div>
            </div>

            <div className="game-card">
              <div className="game-meta">
                <span className="category-tag">
                  {currentMatch.category}
                </span>

                <span className="question-count">
                  PARTIDO {matchIndex + 1} / {gameMatches.length}
                </span>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="question-number">
                {currentMatch.competition} · {currentMatch.date}
              </div>

              {/* TEMPORIZADOR */}

              <div
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '16px 0',
                  color: timeLeft <= 5 ? '#ff5555' : 'inherit'
                }}
              >
                ⏱ {timeLeft} segundos
              </div>

              <h1 className="question-title">
                {currentMatch.homeTeam} vs {currentMatch.awayTeam}
              </h1>

              <p className="form-description">
                ¿Cuál fue el resultado de este partido y quiénes hicieron los goles?
              </p>

              {/* MARCADOR */}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  margin: '28px 0'
                }}
              >
                <div className="form-group">
                  <label htmlFor="home-goals">
                    {currentMatch.homeTeam}
                  </label>

                  <input
                    id="home-goals"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={homeGoalsInput}
                    disabled={answered}
                    onChange={event => setHomeGoalsInput(event.target.value)}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.5rem'
                    }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="away-goals">
                    {currentMatch.awayTeam}
                  </label>

                  <input
                    id="away-goals"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={awayGoalsInput}
                    disabled={answered}
                    onChange={event => setAwayGoalsInput(event.target.value)}
                    style={{
                      textAlign: 'center',
                      fontSize: '1.5rem'
                    }}
                  />
                </div>
              </div>

              {/* GOLEADORES */}

              <div className="form-group">
                <label htmlFor="scorers">
                  Apellidos de los goleadores
                </label>

                <textarea
                  id="scorers"
                  placeholder={'Escribí un apellido por línea.\nEjemplo:\nMessi\nDi María\nÁlvarez'}
                  value={scorersInput}
                  disabled={answered}
                  onChange={event => setScorersInput(event.target.value)}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    resize: 'vertical',
                    font: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />

                <small className="selector-hint">
                  Escribí solamente los apellidos. Se aceptan tildes o sin tildes.
                </small>
              </div>

              {notice && <p className="notice">{notice}</p>}

              {/* BOTÓN PARA CONFIRMAR */}

              {!answered && (
                <button
                  className="button button-primary button-full"
                  onClick={() => submitAnswer()}
                >
                  Confirmar respuesta <span>→</span>
                </button>
              )}

              {/* RESULTADO REVELADO */}

              {answered && currentAnswer && (
                <div className="explanation-box">
                  <strong>Resultado real</strong>

                  <h2 style={{ textAlign: 'center', margin: '12px 0' }}>
                    {currentMatch.homeGoals} - {currentMatch.awayGoals}
                  </h2>

                  <p>
                    <strong>Goleadores:</strong>{' '}
                    {currentMatch.scorers.join(', ')}
                  </p>

                  <div style={{ marginTop: '18px' }}>
                    <p>
                      <strong>Tu marcador:</strong>{' '}
                      {currentAnswer.hasScoreAnswer
                        ? `${currentAnswer.homeGoals} - ${currentAnswer.awayGoals}`
                        : 'Sin respuesta'}
                    </p>

                    <p>
                      <strong>Marcador:</strong>{' '}
                      {currentAnswer.scorePoints > 0 ? '+' : ''}
                      {currentAnswer.scorePoints} puntos
                    </p>

                    <p>
                      <strong>Goleadores:</strong>{' '}
                      {currentAnswer.scorersPoints > 0 ? '+' : ''}
                      {currentAnswer.scorersPoints} puntos
                    </p>

                    {currentAnswer.correctScorers.length > 0 && (
                      <p>
                        <strong>Apellidos acertados:</strong>{' '}
                        {currentAnswer.correctScorers.join(', ')}
                      </p>
                    )}

                    {currentAnswer.wrongScorers.length > 0 && (
                      <p>
                        <strong>Apellidos incorrectos:</strong>{' '}
                        {currentAnswer.wrongScorers.join(', ')}
                      </p>
                    )}

                    <h3 style={{ textAlign: 'center', marginTop: '18px' }}>
                      {currentAnswer.points > 0 ? '+' : ''}
                      {currentAnswer.points} puntos en este partido
                    </h3>
                  </div>
                </div>
              )}

              <div className="game-footer">
                <span>
                  ⚽ {playerName} · {totalPoints} puntos
                </span>

                <button
                  className="button button-primary"
                  onClick={nextMatch}
                  disabled={!answered}
                >
                  {matchIndex + 1 === gameMatches.length
                    ? 'Ver resultados'
                    : 'Siguiente partido'}
                  <span> →</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* RESULTADOS */}

        {screen === 'results' && (
          <section className="results-page">
            <div className="results-card">
              <div className="results-trophy">🏆</div>
              <div className="eyebrow centered">PARTIDA FINALIZADA</div>

              <h1>¡Buen partido, {playerName}!</h1>

              <p className="form-description">
                Este es el resultado de tu desafío.
              </p>

              <div className="score-display">
                <strong>{totalPoints}</strong>
                <span> PTS</span>
                <small>PUNTOS TOTALES</small>
              </div>

              <div className="score-summary">
                <div>
                  <strong>
                    {answers.filter(answer => answer?.exactScore).length}
                  </strong>
                  <span>Marcadores exactos</span>
                </div>

                <div>
                  <strong>
                    {answers.filter(
                      answer =>
                        answer !== undefined &&
                        !answer.exactScore &&
                        answer.correctOutcome
                    ).length}
                  </strong>
                  <span>Ganador o empate</span>
                </div>
              </div>

              <h2 className="review-title">Repaso de partidos</h2>

              <div className="review-list">
                {gameMatches.map((match, index) => {
                  const answer = answers[index]

                  return (
                    <div className="review-item" key={match.id}>
                      <span
                        className={
                          answer?.exactScore || answer?.correctOutcome
                            ? 'review-check'
                            : 'review-cross'
                        }
                      >
                        {answer?.exactScore
                          ? '✓'
                          : answer?.correctOutcome
                            ? '✓'
                            : '✕'}
                      </span>

                      <div>
                        <strong>
                          {match.homeTeam} vs {match.awayTeam}
                        </strong>

                        {answer ? (
                          <>
                            <small>
                              Tu marcador: {answer.hasScoreAnswer
                                ? `${answer.homeGoals} - ${answer.awayGoals}`
                                : 'Sin respuesta'}
                            </small>

                            <small>
                              Resultado real: {match.homeGoals} - {match.awayGoals}
                            </small>

                            <small>
                              Goleadores: {match.scorers.join(', ')}
                            </small>

                            <small>
                              Puntaje: {answer.points > 0 ? '+' : ''}
                              {answer.points} puntos
                            </small>
                          </>
                        ) : (
                          <small>Sin responder</small>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                className="button button-primary button-full"
                onClick={startGame}
              >
                Volver a jugar ↻
              </button>

              <button
                className="button button-secondary button-full"
                onClick={goHome}
              >
                Volver al inicio
              </button>
            </div>
          </section>
        )}

      </main>

      <footer className="footer">
        DAVO GAME <span>·</span> HECHO PARA LOS QUE SABEN DE FÚTBOL
      </footer>

    </div>
  )
}

export default App