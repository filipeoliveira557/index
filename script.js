/**
 * Jogo da Memória - Cyber Neon Edition
 * Lógica modular, Web Audio API, Canvas Confetti e Sistema de Recordes.
 */

// ============================================================================
// 1. GERENCIADOR DE ÁUDIO (Web Audio API - 100% Autônomo e sem dependências)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('cyber_memory_sound') !== 'false';
  }

  // Inicializa o contexto de áudio sob demanda (após interação do usuário)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('cyber_memory_sound', this.enabled);
    return this.enabled;
  }

  // Som sutil de flip ao virar uma carta
  playFlip() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      // Falha silenciosa caso o navegador restrinja áudio
    }
  }

  // Som brilhante e harmonioso ao acertar um par (arpeggio ascendente)
  playMatch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
      });
    } catch (e) {}
  }

  // Som suave ao errar (cartas diferentes)
  playMismatch() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [280, 200];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + idx * 0.09;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      });
    } catch (e) {}
  }

  // Fanfarra triunfal de vitória
  playVictory() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const melody = [
        { freq: 523.25, time: 0.00, dur: 0.14 }, // C5
        { freq: 659.25, time: 0.14, dur: 0.14 }, // E5
        { freq: 783.99, time: 0.28, dur: 0.14 }, // G5
        { freq: 1046.50, time: 0.42, dur: 0.38 }, // C6
        { freq: 880.00, time: 0.65, dur: 0.16 }, // A5
        { freq: 1046.50, time: 0.83, dur: 0.55 }  // C6 final
      ];

      melody.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime + note.time;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now);

        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + note.dur);
      });
    } catch (e) {}
  }
}

// ============================================================================
// 2. SISTEMA DE CONFETES NATIVO (Canvas de alto desempenho)
// ============================================================================
class ConfettiManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationFrame = null;
    this.colors = ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#f43f5e'];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  start(duration = 4500) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    this.particles = [];

    // Cria 140 partículas com velocidades e direções variadas
    for (let i = 0; i < 140; i++) {
      this.particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 160,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
        size: Math.random() * 8 + 5,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        vx: (Math.random() - 0.5) * 16,
        vy: Math.random() * -14 - 6,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.3,
        drag: 0.982,
        alpha: 1
      });
    }

    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;

        if (elapsed > duration * 0.65) {
          p.alpha = Math.max(0, 1 - (elapsed - duration * 0.65) / (duration * 0.35));
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.35);
        this.ctx.restore();
      });

      if (elapsed < duration) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles = [];
      }
    };

    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(animate);
  }

  stop() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = [];
  }
}

// ============================================================================
// 3. BANCO DE ÍCONES (32 Emojis Selecionados)
// ============================================================================
const CARD_ICONS = [
  { emoji: '🚀', name: 'Foguete' },
  { emoji: '💎', name: 'Diamante' },
  { emoji: '⚡', name: 'Raio' },
  { emoji: '🪐', name: 'Saturno' },
  { emoji: '👾', name: 'Alien' },
  { emoji: '🎮', name: 'Controle' },
  { emoji: '🔮', name: 'Cristal' },
  { emoji: '🤖', name: 'Robô' },
  { emoji: '🦄', name: 'Unicórnio' },
  { emoji: '🍕', name: 'Pizza' },
  { emoji: '🥑', name: 'Abacate' },
  { emoji: '🦊', name: 'Raposa' },
  { emoji: '🐱', name: 'Gato' },
  { emoji: '🌟', name: 'Estrela' },
  { emoji: '🎧', name: 'Headphone' },
  { emoji: '🏆', name: 'Troféu' },
  { emoji: '🔥', name: 'Fogo' },
  { emoji: '🍭', name: 'Pirulito' },
  { emoji: '👻', name: 'Fantasma' },
  { emoji: '🎯', name: 'Alvo' },
  { emoji: '🛸', name: 'Disco Voador' },
  { emoji: '🎪', name: 'Circo' },
  { emoji: '🎨', name: 'Paleta' },
  { emoji: '🧩', name: 'Quebra-Cabeça' },
  { emoji: '🍿', name: 'Pipoca' },
  { emoji: '🍩', name: 'Donut' },
  { emoji: '🦁', name: 'Leão' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '👑', name: 'Coroa' },
  { emoji: '🎸', name: 'Guitarra' },
  { emoji: '🌺', name: 'Flor' },
  { emoji: '🌙', name: 'Lua' }
];

// Configurações das dificuldades
const DIFFICULTIES = {
  facil: {
    name: 'Fácil (4x3)',
    cols: 4,
    rows: 3,
    totalCards: 12,
    pairs: 6,
    gridClass: 'grid-cols-3 sm:grid-cols-4 max-w-lg',
    targetMoves: 10
  },
  medio: {
    name: 'Médio (4x4)',
    cols: 4,
    rows: 4,
    totalCards: 16,
    pairs: 8,
    gridClass: 'grid-cols-4 max-w-xl',
    targetMoves: 16
  },
  dificil: {
    name: 'Difícil (6x6)',
    cols: 6,
    rows: 6,
    totalCards: 36,
    pairs: 18,
    gridClass: 'grid-cols-6 max-w-2xl sm:max-w-3xl',
    targetMoves: 42
  }
};

// ============================================================================
// 4. CLASSE PRINCIPAL DO JOGO (MemoryGame)
// ============================================================================
class MemoryGame {
  constructor() {
    this.sound = new SoundEffects();
    this.confetti = new ConfettiManager('confettiCanvas');

    // Estado do jogo
    this.difficulty = 'medio';
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.moves = 0;
    this.lockBoard = false;
    this.hasStarted = false;
    this.timerSeconds = 0;
    this.timerInterval = null;

    // Elementos da DOM
    this.gridElement = document.getElementById('cardsGrid');
    this.movesElement = document.getElementById('movesCounter');
    this.timerElement = document.getElementById('timerCounter');
    this.pairsElement = document.getElementById('pairsCounter');
    this.bestElement = document.getElementById('bestCounter');
    this.restartBtn = document.getElementById('restartBtn');
    this.restartSvg = document.getElementById('restartSvg');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');
    this.victoryModal = document.getElementById('victoryModal');
    this.playAgainBtn = document.getElementById('playAgainBtn');
    this.difficultyTabs = document.querySelectorAll('.diff-btn');

    // Elementos do Modal de Vitória
    this.modalTime = document.getElementById('modalTime');
    this.modalMoves = document.getElementById('modalMoves');
    this.modalStars = document.getElementById('modalStars');
    this.modalDiffName = document.getElementById('modalDiffName');
    this.newRecordBadge = document.getElementById('newRecordBadge');

    this.bindEvents();
    this.updateSoundIcon();
    this.initGame();
  }

  bindEvents() {
    // Botão reiniciar com animação
    this.restartBtn.addEventListener('click', () => {
      this.spinRestartIcon();
      this.initGame();
    });

    // Botão jogar novamente no modal
    this.playAgainBtn.addEventListener('click', () => {
      this.closeVictoryModal();
      this.initGame();
    });

    // Alternar som
    this.soundToggleBtn.addEventListener('click', () => {
      const enabled = this.sound.toggle();
      this.updateSoundIcon();
      if (enabled) this.sound.playFlip();
    });

    // Seletor de Dificuldade
    this.difficultyTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diff = e.currentTarget.dataset.difficulty;
        if (diff && diff !== this.difficulty) {
          this.difficulty = diff;
          this.updateDifficultyTabs();
          this.initGame();
        }
      });
    });

    // Fechar modal ao pressionar tecla ESC
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.victoryModal.classList.contains('hidden')) {
        this.closeVictoryModal();
      }
    });

    // Desbloqueia contexto de áudio no primeiro clique do usuário
    const unlockAudio = () => {
      this.sound.init();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
  }

  spinRestartIcon() {
    if (this.restartSvg) {
      this.restartSvg.classList.add('rotate-180');
      setTimeout(() => {
        this.restartSvg.classList.remove('rotate-180');
      }, 500);
    }
  }

  updateSoundIcon() {
    if (this.sound.enabled) {
      this.soundIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
        </svg>
      `;
      this.soundToggleBtn.title = "Som Ativado (Clique para mutar)";
    } else {
      this.soundIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <line x1="23" y1="9" x2="17" y2="15"></line>
          <line x1="17" y1="9" x2="23" y2="15"></line>
        </svg>
      `;
      this.soundToggleBtn.title = "Som Mutado (Clique para ativar)";
    }
  }

  updateDifficultyTabs() {
    this.difficultyTabs.forEach(btn => {
      const isCurrent = btn.dataset.difficulty === this.difficulty;
      if (isCurrent) {
        btn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/50', 'shadow-[0_0_12px_rgba(6,182,212,0.3)]');
        btn.classList.remove('text-slate-400', 'border-transparent', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/50', 'shadow-[0_0_12px_rgba(6,182,212,0.3)]');
        btn.classList.add('text-slate-400', 'border-transparent', 'hover:bg-slate-800');
      }
    });
  }

  getRecord() {
    try {
      const data = localStorage.getItem(`cyber_memory_record_${this.difficulty}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveRecord(moves, timeSeconds) {
    try {
      const record = {
        moves,
        timeSeconds,
        timeFormatted: this.formatTime(timeSeconds),
        date: new Date().toLocaleDateString('pt-BR')
      };
      localStorage.setItem(`cyber_memory_record_${this.difficulty}`, JSON.stringify(record));
      return record;
    } catch (e) {
      return null;
    }
  }

  updateBestScoreDisplay() {
    const record = this.getRecord();
    if (record) {
      this.bestElement.textContent = `${record.moves}m / ${record.timeFormatted}`;
      this.bestElement.title = `Recorde: ${record.moves} jogadas em ${record.timeFormatted}`;
    } else {
      this.bestElement.textContent = '--';
      this.bestElement.title = 'Nenhum recorde registrado ainda para esta dificuldade';
    }
  }

  initGame() {
    this.resetTimer();
    this.moves = 0;
    this.matchedPairs = 0;
    this.flippedCards = [];
    this.lockBoard = false;
    this.hasStarted = false;
    this.closeVictoryModal();
    this.confetti.stop();

    const config = DIFFICULTIES[this.difficulty];
    this.movesElement.textContent = '0';
    this.pairsElement.textContent = `0 / ${config.pairs}`;
    this.timerElement.textContent = '00:00';

    this.updateBestScoreDisplay();
    this.createCards();
  }

  createCards() {
    const config = DIFFICULTIES[this.difficulty];
    const totalPairs = config.pairs;

    // Embaralha o pool completo de ícones e seleciona a quantidade necessária de pares aleatórios
    const shuffledIcons = this.shuffle([...CARD_ICONS]);
    const selectedIcons = shuffledIcons.slice(0, totalPairs);

    // Duplica cada ícone para formar o par correspondente
    const cardPool = [...selectedIcons, ...selectedIcons].map((item, index) => ({
      id: index,
      name: item.name,
      emoji: item.emoji
    }));

    // Algoritmo Fisher-Yates para embaralhamento das cartas no tabuleiro
    this.shuffle(cardPool);
    this.cards = cardPool;

    // Ajusta o grid da dificuldade
    this.gridElement.className = `grid gap-2 sm:gap-3 mx-auto w-full transition-all duration-300 ${config.gridClass}`;
    this.gridElement.innerHTML = '';

    // Responsividade nos tamanhos das cartas e emojis
    const isHard = this.difficulty === 'dificil';
    const emojiSize = isHard ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-5xl';
    const cardHeight = isHard ? 'aspect-square min-h-[46px] sm:min-h-[70px]' : 'aspect-square min-h-[70px] sm:min-h-[95px]';
    const questionBox = isHard ? 'w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm' : 'w-7 h-7 sm:w-10 sm:h-10 text-xs sm:text-base';

    this.cards.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = `card perspective-1000 cursor-pointer select-none group ${cardHeight}`;
      cardEl.dataset.index = index;
      cardEl.dataset.name = card.name;

      cardEl.innerHTML = `
        <div class="card-inner relative w-full h-full transform-style-3d duration-500 rounded-xl sm:rounded-2xl">
          <!-- Verso da Carta (Virada para baixo inicialmente) -->
          <div class="card-back absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center backface-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-md group-hover:border-cyan-500/50 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all">
            <div class="${questionBox} rounded-lg bg-slate-800/90 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold group-hover:scale-110 transition-transform">
              ?
            </div>
          </div>
          
          <!-- Frente da Carta (Revelada ao virar) -->
          <div class="card-face absolute inset-0 rounded-xl sm:rounded-2xl flex items-center justify-center backface-hidden rotate-y-180 bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-2 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all">
            <span class="${emojiSize} transform transition-transform group-hover:scale-110 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
              ${card.emoji}
            </span>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => this.handleCardClick(cardEl, card));
      this.gridElement.appendChild(cardEl);
    });
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  handleCardClick(cardEl, cardData) {
    // Bloqueios de clique: se o tabuleiro estiver travado ou 2 cartas já estiverem viradas
    if (this.lockBoard || this.flippedCards.length >= 2) return;
    
    // Bloqueia clique na mesma carta já virada ou já acertada
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

    // Inicia cronômetro no primeiro clique
    if (!this.hasStarted) {
      this.startTimer();
      this.hasStarted = true;
    }

    // Vira a carta selecionada suavemente
    cardEl.classList.add('flipped');
    this.sound.playFlip();

    this.flippedCards.push({ element: cardEl, data: cardData });

    // Se duas cartas foram viradas, avalia o par
    if (this.flippedCards.length === 2) {
      this.moves++;
      this.movesElement.textContent = this.moves;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const isMatch = card1.data.name === card2.data.name;

    if (isMatch) {
      // SUCESSO: Par formado
      this.lockBoard = true;
      setTimeout(() => {
        card1.element.classList.add('matched');
        card2.element.classList.add('matched');
        this.sound.playMatch();

        this.matchedPairs++;
        const config = DIFFICULTIES[this.difficulty];
        this.pairsElement.textContent = `${this.matchedPairs} / ${config.pairs}`;

        this.flippedCards = [];
        this.lockBoard = false;

        // Verifica condição de vitória total
        if (this.matchedPairs === config.pairs) {
          this.handleVictory();
        }
      }, 250);
    } else {
      // ERRO: Cartas diferentes
      this.lockBoard = true;
      
      // Feedback visual e sonoro de erro (tremor suave)
      setTimeout(() => {
        card1.element.classList.add('wrong');
        card2.element.classList.add('wrong');
        this.sound.playMismatch();
      }, 350);

      // Aguarda 1 segundo e desvira ambas automaticamente
      setTimeout(() => {
        card1.element.classList.remove('flipped', 'wrong');
        card2.element.classList.remove('flipped', 'wrong');
        this.flippedCards = [];
        this.lockBoard = false;
      }, 1000);
    }
  }

  startTimer() {
    this.timerSeconds = 0;
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      this.timerElement.textContent = this.formatTime(this.timerSeconds);
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  resetTimer() {
    this.stopTimer();
    this.timerSeconds = 0;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  handleVictory() {
    this.stopTimer();
    this.sound.playVictory();
    this.confetti.start(4500);

    const config = DIFFICULTIES[this.difficulty];
    const timeFormatted = this.formatTime(this.timerSeconds);

    // Verificação de Recorde
    const previousRecord = this.getRecord();
    let isNewRecord = false;

    if (!previousRecord) {
      isNewRecord = true;
      this.saveRecord(this.moves, this.timerSeconds);
    } else {
      // Bate o recorde se fizer em menos jogadas, ou com as mesmas jogadas e menor tempo
      if (this.moves < previousRecord.moves || (this.moves === previousRecord.moves && this.timerSeconds < previousRecord.timeSeconds)) {
        isNewRecord = true;
        this.saveRecord(this.moves, this.timerSeconds);
      }
    }

    this.updateBestScoreDisplay();

    // Avaliação em Estrelas (1 a 3 estrelas baseado nas jogadas)
    let starCount = 1;
    if (this.moves <= config.targetMoves) {
      starCount = 3;
    } else if (this.moves <= Math.floor(config.targetMoves * 1.5)) {
      starCount = 2;
    }

    // Renderiza estrelas animadas no modal
    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
      if (i <= starCount) {
        starsHtml += `<span class="text-amber-400 text-3xl sm:text-4xl drop-shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-bounce" style="animation-delay: ${i * 120}ms;">★</span>`;
      } else {
        starsHtml += `<span class="text-slate-600 text-3xl sm:text-4xl">★</span>`;
      }
    }

    // Preenche dados do modal
    this.modalTime.textContent = timeFormatted;
    this.modalMoves.textContent = this.moves;
    this.modalDiffName.textContent = config.name.split(' ')[0]; // Ex: "Fácil"
    this.modalStars.innerHTML = starsHtml;

    if (isNewRecord) {
      this.newRecordBadge.classList.remove('hidden');
    } else {
      this.newRecordBadge.classList.add('hidden');
    }

    // Abre modal elegante
    setTimeout(() => {
      this.victoryModal.classList.remove('hidden');
      this.victoryModal.classList.add('flex');
    }, 450);
  }

  closeVictoryModal() {
    this.victoryModal.classList.add('hidden');
    this.victoryModal.classList.remove('flex');
    this.confetti.stop();
  }
}

// Inicializa o jogo assim que o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  window.game = new MemoryGame();
});
