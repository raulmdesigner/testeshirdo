import { GameState, MapId, GameDifficulty, TowerType, TargetPriority } from '../types/gameTypes';
import { TOWER_CONFIGS } from '../systems/TowerSystem';
import { MAP_CATALOG, DIFFICULTY_SETTINGS } from '../maps/MapCatalog';
import { SoundFX } from '../audio/SoundFX';

export class AuthAndHUD {
  private container: HTMLElement;
  private onStartGame: (mapId: MapId, difficulty: GameDifficulty) => void;
  private onSelectTower: (type: TowerType | null) => void;
  private onUpgradeTower: () => void;
  private onSellTower: () => void;
  private onCastSpell: (spell: 'airStrike' | 'overclock' | 'emp') => void;
  private onSetPriority: (priority: TargetPriority) => void;
  private onTouchMove: (x: number, y: number) => void;
  private onTouchLook: (dx: number, dy: number) => void;
  private onJump: () => void;

  constructor(
    container: HTMLElement,
    callbacks: {
      onStartGame: (mapId: MapId, difficulty: GameDifficulty) => void;
      onSelectTower: (type: TowerType | null) => void;
      onUpgradeTower: () => void;
      onSellTower: () => void;
      onCastSpell: (spell: 'airStrike' | 'overclock' | 'emp') => void;
      onSetPriority: (priority: TargetPriority) => void;
      onTouchMove: (x: number, y: number) => void;
      onTouchLook: (dx: number, dy: number) => void;
      onJump: () => void;
    }
  ) {
    this.container = container;
    this.onStartGame = callbacks.onStartGame;
    this.onSelectTower = callbacks.onSelectTower;
    this.onUpgradeTower = callbacks.onUpgradeTower;
    this.onSellTower = callbacks.onSellTower;
    this.onCastSpell = callbacks.onCastSpell;
    this.onSetPriority = callbacks.onSetPriority;
    this.onTouchMove = callbacks.onTouchMove;
    this.onTouchLook = callbacks.onTouchLook;
    this.onJump = callbacks.onJump;
  }

  public render(state: GameState): void {
    let uiDiv = document.getElementById('game-ui');
    if (!uiDiv) {
      uiDiv = document.createElement('div');
      uiDiv.id = 'game-ui';
      uiDiv.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; font-family: system-ui, sans-serif;';
      this.container.appendChild(uiDiv);
    }

    uiDiv.innerHTML = '';

    if (state.scene === 'login') {
      uiDiv.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, #1a2536 0%, #0b0f19 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; padding: 20px;">
          <div style="background: rgba(15, 23, 42, 0.85); border: 2px solid #3b82f6; border-radius: 16px; padding: 40px; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <h1 style="font-size: 2.2rem; font-weight: 800; color: #60a5fa; margin-bottom: 10px;">TOWER DEFENSE 3D</h1>
            <p style="color: #94a3b8; font-size: 0.95rem; margin-bottom: 30px;">Primeira Pessoa • WebGL • Standalone Ready</p>
            
            <div style="margin-bottom: 20px; text-align: left;">
              <label style="display: block; font-size: 0.85rem; color: #cbd5e1; margin-bottom: 8px; font-weight: 600;">Senha de Acesso ("mobile" ou "desktop")</label>
              <input type="password" id="login-pass" placeholder="Digite a senha..." style="width: 100%; padding: 14px 16px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;" />
            </div>
            
            <button id="login-btn" style="width: 100%; padding: 14px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 1.05rem; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.1s;">ENTRAR NO JOGO</button>
          </div>
        </div>
      `;

      setTimeout(() => {
        const btn = document.getElementById('login-btn');
        const input = document.getElementById('login-pass') as HTMLInputElement;
        const handleLogin = () => {
          SoundFX.init();
          SoundFX.playUI('click');
          const val = input.value.trim().toLowerCase();
          if (val === 'mobile' || val === 'desktop') {
            state.platform = val;
            state.authenticated = true;
            state.scene = 'lobby';
            this.render(state);
          } else {
            input.style.borderColor = '#ef4444';
            input.placeholder = 'Senha incorreta! Use "mobile" ou "desktop"';
            input.value = '';
          }
        };
        btn?.addEventListener('click', handleLogin);
        input?.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleLogin();
        });
      }, 50);

    } else if (state.scene === 'lobby') {
      uiDiv.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #0b0f19; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto; padding: 20px;">
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; border-radius: 16px; padding: 35px; width: 100%; max-width: 800px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
              <h2 style="font-size: 1.8rem; font-weight: 800; color: #60a5fa;">LOBBY DE PARTIDA (${state.platform.toUpperCase()})</h2>
              <span style="background: #1e293b; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; color: #38bdf8; border: 1px solid #334155;">Modo 60 FPS</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
              <div>
                <label style="display: block; font-size: 0.9rem; color: #94a3b8; font-weight: 600; margin-bottom: 10px;">Selecione o Mapa</label>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${Object.values(MAP_CATALOG).map(m => `
                    <div class="map-card ${state.selectedMap === m.id ? 'active' : ''}" data-map="${m.id}" style="padding: 14px; background: ${state.selectedMap === m.id ? '#1e40af' : '#1e293b'}; border: 1px solid ${state.selectedMap === m.id ? '#60a5fa' : '#334155'}; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                      <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">${m.name}</div>
                      <div style="font-size: 0.8rem; color: #cbd5e1;">${m.description}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div>
                <label style="display: block; font-size: 0.9rem; color: #94a3b8; font-weight: 600; margin-bottom: 10px;">Dificuldade</label>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 25px;">
                  ${Object.entries(DIFFICULTY_SETTINGS).map(([key, diff]) => `
                    <div class="diff-card ${state.selectedDifficulty === key ? 'active' : ''}" data-diff="${key}" style="padding: 14px; background: ${state.selectedDifficulty === key ? '#1e40af' : '#1e293b'}; border: 1px solid ${state.selectedDifficulty === key ? '#60a5fa' : '#334155'}; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                      <div style="font-weight: 700; color: #fff;">${diff.name}</div>
                      <div style="font-size: 0.8rem; color: #cbd5e1;">Ouro Inicial: $${diff.startGold} | HP: ${diff.hpMultiplier}x</div>
                    </div>
                  `).join('')}
                </div>

                <button id="start-game-btn" style="width: 100%; padding: 16px; background: #10b981; color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 800; cursor: pointer; transition: background 0.2s;">INICIAR DEFESA</button>
              </div>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        document.querySelectorAll('.map-card').forEach(card => {
          card.addEventListener('click', () => {
            SoundFX.playUI('click');
            state.selectedMap = card.getAttribute('data-map') as MapId;
            this.render(state);
          });
        });
        document.querySelectorAll('.diff-card').forEach(card => {
          card.addEventListener('click', () => {
            SoundFX.playUI('click');
            state.selectedDifficulty = card.getAttribute('data-diff') as GameDifficulty;
            this.render(state);
          });
        });
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
          SoundFX.playUI('wave');
          this.onStartGame(state.selectedMap, state.selectedDifficulty);
        });
      }, 50);

    } else if (state.scene === 'game') {
      uiDiv.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; padding: 15px;">
          <!-- TOP BAR -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.85); padding: 10px 20px; border-radius: 12px; backdrop-filter: blur(8px); border: 1px solid #334155; pointer-events: auto;">
            <div style="display: flex; gap: 20px; font-weight: 700; font-size: 1rem;">
              <span style="color: #facc15;">💰 $${state.gold}</span>
              <span style="color: #ef4444;">❤️ ${state.lives}</span>
              <span style="color: #38bdf8;">🌊 Wave ${state.wave}/${state.maxWaves}</span>
              <span style="color: #a855f7;">⭐ ${state.score}</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <button id="next-wave-btn" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer;">PRÓXIMA ONDA 🚀</button>
            </div>
          </div>

          <!-- CROSSHAIR -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: rgba(255,255,255,0.8); border-radius: 50%; pointer-events: none; border: 1px solid #000;"></div>

          <!-- CENTER / BOTTOM NOTIFICATIONS OR TOWER SHOP -->
          <div style="display: flex; flex-direction: column; gap: 10px; align-items: center;">
            <!-- SPELLS BAR -->
            <div style="display: flex; gap: 10px; background: rgba(15, 23, 42, 0.85); padding: 8px 15px; border-radius: 10px; border: 1px solid #334155; pointer-events: auto;">
              <button id="spell-strike" style="padding: 6px 12px; background: #dc2626; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">Chuva Orbital ($800)</button>
              <button id="spell-clock" style="padding: 6px 12px; background: #d97706; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">Overclock ($600)</button>
              <button id="spell-emp" style="padding: 6px 12px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.8rem;">Pulse EMP ($400)</button>
            </div>

            <!-- TOWER SHOP / SELECTION -->
            <div style="display: flex; gap: 8px; background: rgba(15, 23, 42, 0.9); padding: 10px 15px; border-radius: 12px; overflow-x: auto; max-width: 100%; border: 1px solid #334155; pointer-events: auto;">
              ${Object.values(TOWER_CONFIGS).map(t => `
                <button class="tower-shop-btn ${state.selectedTowerType === t.id ? 'active' : ''}" data-tower="${t.id}" style="flex: 0 0 auto; padding: 8px 12px; background: ${state.selectedTowerType === t.id ? '#2563eb' : '#1e293b'}; border: 1px solid ${state.selectedTowerType === t.id ? '#60a5fa' : '#475569'}; border-radius: 8px; color: #fff; cursor: pointer; text-align: center; transition: all 0.2s;">
                  <div style="font-weight: 700; font-size: 0.85rem;">${t.name.split('/')[0]}</div>
                  <div style="font-size: 0.75rem; color: #facc15;">$${t.cost}</div>
                </button>
              `).join('')}
            </div>

            ${state.platform === 'mobile' ? `
              <!-- MOBILE VIRTUAL CONTROLS -->
              <div style="display: flex; justify-content: space-between; width: 100%; align-items: flex-end; pointer-events: auto; padding-bottom: 10px;">
                <div id="virtual-joystick-move" style="width: 120px; height: 120px; background: rgba(255,255,255,0.15); border-radius: 50%; position: relative; border: 2px solid rgba(255,255,255,0.3);">
                  <div id="joystick-knob" style="width: 50px; height: 50px; background: rgba(255,255,255,0.6); border-radius: 50%; position: absolute; top: 35px; left: 35px;"></div>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button id="mobile-jump-btn" style="width: 60px; height: 60px; background: rgba(37,99,235,0.8); border: none; border-radius: 50%; color: #fff; font-weight: bold; font-size: 1rem;">Pular</button>
                  <button id="mobile-upgrade-btn" style="width: 60px; height: 60px; background: rgba(16,185,129,0.8); border: none; border-radius: 50%; color: #fff; font-weight: bold; font-size: 0.8rem;">Upgrade [E]</button>
                  <button id="mobile-sell-btn" style="width: 60px; height: 60px; background: rgba(239,68,68,0.8); border: none; border-radius: 50%; color: #fff; font-weight: bold; font-size: 0.8rem;">Vender [T]</button>
                </div>
                <div id="virtual-joystick-look" style="width: 120px; height: 120px; background: rgba(255,255,255,0.15); border-radius: 50%; position: relative; border: 2px solid rgba(255,255,255,0.3);">
                  <div style="position: absolute; top: 45px; left: 30px; color: #fff; font-size: 0.8rem; pointer-events: none;">Olhar Câmera</div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      setTimeout(() => {
        document.querySelectorAll('.tower-shop-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            SoundFX.playUI('click');
            const tType = btn.getAttribute('data-tower') as TowerType;
            if (state.selectedTowerType === tType) {
              this.onSelectTower(null);
            } else {
              this.onSelectTower(tType);
            }
          });
        });

        document.getElementById('spell-strike')?.addEventListener('click', () => this.onCastSpell('airStrike'));
        document.getElementById('spell-clock')?.addEventListener('click', () => this.onCastSpell('overclock'));
        document.getElementById('spell-emp')?.addEventListener('click', () => this.onCastSpell('emp'));

        if (state.platform === 'mobile') {
          const lookZone = document.getElementById('virtual-joystick-look');
          let isDraggingLook = false;
          let lastX = 0, lastY = 0;

          lookZone?.addEventListener('touchstart', (e: any) => {
            isDraggingLook = true;
            lastX = e.touches[0].clientX;
            lastY = e.touches[0].clientY;
          });
          window.addEventListener('touchmove', (e: any) => {
            if (!isDraggingLook) return;
            const x = e.touches[0].clientX;
            const y = e.touches[0].clientY;
            const dx = x - lastX;
            const dy = y - lastY;
            lastX = x;
            lastY = y;
            this.onTouchLook(dx, dy);
          });
          window.addEventListener('touchend', () => {
            isDraggingLook = false;
          });

          const moveZone = document.getElementById('virtual-joystick-move');
          let isDraggingMove = false;
          moveZone?.addEventListener('touchstart', (e: any) => {
            isDraggingMove = true;
          });
          window.addEventListener('touchmove', (e: any) => {
            if (!isDraggingMove) return;
            const rect = moveZone?.getBoundingClientRect();
            if (!rect) return;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const x = e.touches[0].clientX - cx;
            const y = e.touches[0].clientY - cy;
            const dist = Math.sqrt(x * x + y * y);
            const maxRadius = 50;
            const nx = Math.max(-1, Math.min(1, x / maxRadius));
            const ny = Math.max(-1, Math.min(1, -y / maxRadius));
            this.onTouchMove(nx, ny);
          });
          window.addEventListener('touchend', () => {
            isDraggingMove = false;
            this.onTouchMove(0, 0);
          });

          document.getElementById('mobile-jump-btn')?.addEventListener('click', () => this.onJump());
          document.getElementById('mobile-upgrade-btn')?.addEventListener('click', () => this.onUpgradeTower());
          document.getElementById('mobile-sell-btn')?.addEventListener('click', () => this.onSellTower());
        }
      }, 50);

    } else if (state.scene === 'victory' || state.scene === 'gameover') {
      const isWin = state.scene === 'victory';
      uiDiv.innerHTML = `
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(11, 15, 25, 0.95); display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: auto;">
          <div style="text-align: center; max-width: 500px; padding: 40px;">
            <h1 style="font-size: 3rem; font-weight: 900; color: ${isWin ? '#10b981' : '#ef4444'}; margin-bottom: 15px;">${isWin ? 'VITÓRIA ÉPICA!' : 'DERROTA'}</h1>
            <p style="color: #94a3b8; font-size: 1.1rem; margin-bottom: 30px;">${isWin ? 'Você defendeu com sucesso todas as ondas do mapa!' : 'As hordas inimigas destruíram sua base.'}</p>
            <div style="background: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #334155;">
              <div style="font-size: 1.2rem; font-weight: 700; color: #f8fafc; margin-bottom: 8px;">Pontuação Final: ${state.score}</div>
              <div style="font-size: 0.95rem; color: #cbd5e1;">Owaves Sobrevividas: ${state.wave}/${state.maxWaves}</div>
            </div>
            <button id="restart-btn" style="padding: 16px 32px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: 800; cursor: pointer;">JOGAR NOVAMENTE</button>
          </div>
        </div>
      `;

      setTimeout(() => {
        document.getElementById('restart-btn')?.addEventListener('click', () => {
          SoundFX.playUI('click');
          state.scene = 'lobby';
          state.gold = 500;
          state.lives = 20;
          state.wave = 0;
          state.score = 0;
          this.render(state);
        });
      }, 50);
    }
  }
}
