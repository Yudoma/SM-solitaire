// ============================================================================
// ui-game-logic.js
// ゲーム進行、タイマー、勝敗表示、トークン初期化ロジック
// ============================================================================

// ※ turnTimerDuration, timerRemaining, currentTimerId, stepButtons, stepOrder, currentStepIndex, isTurnEnded
//    などの状態変数は ui-globals.js で定義されています。

// --- Game Result UI Logic ---

/**
 * 勝敗結果を表示する
 * @param {string} message 
 */
window.showGameResult = function(message) {
    if (!gameResultOverlay || !gameResultMessage) return;
    
    if (typeof autoConfig !== 'undefined' && !autoConfig.autoGameEnd) return;

    gameResultMessage.textContent = message;
    
    if (message.includes('LOSE')) {
        gameResultMessage.classList.add('result-lose');
    } else {
        gameResultMessage.classList.remove('result-lose');
    }

    gameResultOverlay.style.display = 'flex';
    
    if (typeof resetTurnTimer === 'function') {
        resetTurnTimer(); 
    }
    if(turnTimerDisplay) turnTimerDisplay.style.color = '#888';
    
    if (message.includes('WIN')) {
        playSe('勝利.mp3');
    } else if (message.includes('LOSE')) {
        playSe('敗北.mp3');
    } else {
        playSe('Theme.mp3');
    }
};

/**
 * 勝敗結果表示を閉じる
 */
function closeGameResult() {
    if (gameResultOverlay) {
        gameResultOverlay.style.display = 'none';
    }
}


// --- Timer Functions ---

/**
 * タイマー表示を更新
 */
function updateTimerDisplay() {
    if (turnTimerDisplay) {
        turnTimerDisplay.textContent = Math.ceil(timerRemaining);
        if (timerRemaining <= 10) {
            turnTimerDisplay.style.color = '#ff4444';
        } else {
            turnTimerDisplay.style.color = '#fff';
        }
    }
}

/**
 * ターンタイマーを開始
 * @param {boolean} resume trueなら一時停止からの再開（リセットしない）
 */
function startTurnTimer(resume = false) {
    stopTurnTimer();
    
    const input = document.getElementById('setting-timer-duration');
    if (input) {
        const val = parseInt(input.value);
        if (!isNaN(val) && val > 0) turnTimerDuration = val;
    }

    if (turnTimerDuration > 0) {
        if (!resume || timerRemaining <= 0) {
             timerRemaining = turnTimerDuration;
        }
        
        updateTimerDisplay();
        
        if(timerPauseBtn) timerPauseBtn.textContent = '⏸';
        
        currentTimerId = setInterval(() => {
            timerRemaining--;
            updateTimerDisplay();
            if (timerRemaining <= 0) {
                stopTurnTimer();
                playSe('自動減少.mp3'); 
                processAutoTurnProgression(); 
            }
        }, 1000);
    }
}

/**
 * ターンタイマーを停止
 */
function stopTurnTimer() {
    if (currentTimerId) {
        clearInterval(currentTimerId);
        currentTimerId = null;
    }
    if(timerPauseBtn) timerPauseBtn.textContent = '▶';
}

/**
 * ターンタイマーをリセット
 */
function resetTurnTimer() {
    stopTurnTimer();
    const input = document.getElementById('setting-timer-duration');
    if (input) {
        const val = parseInt(input.value);
        if (!isNaN(val) && val > 0) {
            turnTimerDuration = val;
        }
    }
    timerRemaining = turnTimerDuration;
    updateTimerDisplay();
}


// --- Step / Turn Progression Logic ---

/**
 * ステップボタンのUI状態（active/disabled）を更新
 */
function updateStepUI() {
    stepButtons.forEach((btn, index) => {
        if (!btn) return;
        btn.classList.toggle('active', index === currentStepIndex);
        const nextStepIndex = (currentStepIndex + 1) % stepOrder.length;
        btn.disabled = (index !== nextStepIndex);
    });
}

/**
 * ターンプレイヤーの表示状態（CSSクラス）を更新
 * 手札の裏側表示切り替えに使用
 */
function updateTurnPlayerVisuals() {
    const select = document.getElementById('turn-player-select');
    if (!select) return;
    
    document.body.classList.remove('turn-player-active', 'turn-opponent-active');
    
    if (select.value === 'first') {
        document.body.classList.add('turn-player-active');
    } else {
        document.body.classList.add('turn-opponent-active');
    }
}

/**
 * 時間切れ時などに自動でステップを進める処理
 */
function processAutoTurnProgression() {
    if (currentStepIndex >= 5 || currentStepIndex < 0) return;

    let nextIndex = currentStepIndex + 1;
    const interval = setInterval(() => {
        if (nextIndex > 5) {
            clearInterval(interval);
            return;
        }
        
        const btn = stepButtons[nextIndex];
        if (btn) {
            btn.click();
        }
        nextIndex++;
    }, 500); 
}

/**
 * ステップボタンのイベントリスナーを設定
 */
function setupStepButtons() {
    stepButtons = stepOrder.map(id => document.getElementById(id));

    stepButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', async () => {
                if (!button.disabled) {
                    
                    const turnInput = document.getElementById('common-turn-value');
                    const turnPlayerSelect = document.getElementById('turn-player-select');
                    
                    // ①ターン開始
                    if (button.id === 'step-start') {
                        if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = false;

                        resetTurnTimer();
                        startTurnTimer();

                        const isGameStart = (currentStepIndex === -1);

                        if (isGameStart) {
                            isTurnEnded = false;
                            updateTurnPlayerVisuals();
                        } 
                        else if (isTurnEnded) {
                            if (turnPlayerSelect.value === 'first') {
                                 turnPlayerSelect.value = 'second';
                            } else {
                                 let currentValue = parseInt(turnInput.value) || 1;
                                 turnInput.value = currentValue + 1;
                                 turnPlayerSelect.value = 'first';
                            }
                            
                            if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                                 recordAction({ 
                                     type: 'turnAutoUpdate', 
                                     turnValue: turnInput.value, 
                                     turnPlayer: turnPlayerSelect.value 
                                 });
                            }
                            
                            isTurnEnded = false;
                            updateTurnPlayerVisuals();
                        } else {
                            console.log("前のターンが終了していないため、ターン数は進めずにフェイズをリセットしました。");
                        }

                        if (typeof updateSummoningSicknessVisuals === 'function') {
                            updateSummoningSicknessVisuals();
                        }

                        if (autoConfig.autoBoardFlip) {
                            const body = document.body;
                            if (turnPlayerSelect.value === 'second') {
                                if (!body.classList.contains('board-flipped')) {
                                    document.getElementById('common-flip-board-btn')?.click();
                                }
                            } else {
                                if (body.classList.contains('board-flipped')) {
                                    document.getElementById('common-flip-board-btn')?.click();
                                }
                            }
                        }

                        if (autoConfig.msgStartPhase) {
                            const playerName = document.getElementById('player-name').value;
                            const opponentName = document.getElementById('opponent-player-name').value;
                            const currentName = turnPlayerSelect.value === 'first' ? playerName : opponentName;
                            await showCustomAlert(`${currentName}のターンです`);
                        }
                    }
                    
                    // --- UI更新処理 ---
                    if (button.id === 'step-start') {
                        playSe('ターン開始.mp3');
                    } else {
                        playSe('ボタン共通.mp3');
                    }
                    
                    currentStepIndex = index;
                    updateStepUI();

                    if (typeof autoConfig !== 'undefined' && autoConfig.msgPhaseCutin) {
                        const stepLabels = ['ターン開始', 'ドローフェイズ', 'アンタップフェイズ', 'メインフェイズ', 'バトルフェイズ', 'エンドフェイズ'];
                        const label = stepLabels[index] || '';
                        if(label && typeof showPhaseCutin === 'function') showPhaseCutin(label);
                    }

                    if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                        recordAction({ type: 'stepChange', index: index });
                    }

                    // --- その他のステップロジック ---
                    
                    // ②ドロー
                    if (button.id === 'step-draw') {
                        if (autoConfig.autoDrawPhase) {
                            const turnVal = parseInt(turnInput.value) || 1;
                            const isFirstTurnFirstPlayer = (turnVal === 1 && turnPlayerSelect.value === 'first');
                            
                            if (isFirstTurnFirstPlayer) {
                                if (autoConfig.msgDrawPhase) {
                                    await showCustomAlert('先行1ターン目なので1ドローしません');
                                }
                            } else {
                                const prefix = (turnPlayerSelect.value === 'second') ? 'opponent-' : '';
                                const btnId = prefix + 'draw-card';
                                document.getElementById(btnId)?.click();
                                
                                if (autoConfig.msgDrawPhase) {
                                    await showCustomAlert('1ドローしてください（自動処理設定ONの場合は自動で引かれています）');
                                }
                            }
                        } else {
                            if (autoConfig.msgDrawPhase) {
                                const turnVal = parseInt(turnInput.value) || 1;
                                const isFirstTurnFirstPlayer = (turnVal === 1 && turnPlayerSelect.value === 'first');
                                if (isFirstTurnFirstPlayer) {
                                    await showCustomAlert('先行1ターン目なので1ドローしません');
                                } else {
                                    await showCustomAlert('1ドローしてください');
                                }
                            }
                        }
                    }

                    // ③アンタップ
                    else if (button.id === 'step-mana') {
                        if (autoConfig.msgUntapPhase) {
                            await showCustomAlert('カードをアンタップしてください');
                        }
                        
                        if (typeof autoConfig !== 'undefined' && autoConfig.autoUntapPhase) {
                            const isFirst = turnPlayerSelect.value === 'first';
                            const wrapperClass = isFirst ? '.player-wrapper' : '.opponent-wrapper';
                            const wrapper = document.querySelector(wrapperClass);
                            if (wrapper) {
                                const tappedSlots = wrapper.querySelectorAll('.card-slot.rotated-90');
                                let anyUntapped = false;
                                
                                if (typeof saveStateForUndo === 'function' && tappedSlots.length > 0) saveStateForUndo();

                                tappedSlots.forEach(slot => {
                                    const img = slot.querySelector('.thumbnail .card-image');
                                    if (img) {
                                        img.style.transform = `rotate(0deg)`;
                                        img.dataset.rotation = 0;
                                        slot.classList.remove('rotated-90');
                                        anyUntapped = true;
                                        
                                        if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                                            const zoneId = getParentZoneId(slot);
                                            recordAction({
                                                type: 'rotate',
                                                zoneId: zoneId,
                                                slotIndex: Array.from(slot.parentNode.children).indexOf(slot),
                                                rotation: 0
                                            });
                                        }
                                    }
                                });
                                
                                if (anyUntapped) {
                                    playSe('タップ.mp3');
                                }
                            }
                        }
                    }

                    // ④メイン
                    else if (button.id === 'step-main') {
                        if (autoConfig.msgMainPhase) {
                            await showCustomAlert('マナエリアに1枚だけ、カードを置く事が出来ます');
                        }
                    }

                    // ⑤バトル
                    else if (button.id === 'step-attack') {
                        if (autoConfig.msgBattlePhase) {
                            await showCustomAlert('アタック/バトル可能です');
                        }
                    }

                    // ⑥終了
                    else if (button.id === 'step-end') {
                        stopTurnTimer();
                        isTurnEnded = true;
                        
                        if (autoConfig.msgEndPhase) {
                            await showCustomAlert('ターンを終了します');
                        }
                    }
                }
            });
        }
    });

    currentStepIndex = -1;
    updateStepUI();
    if(stepButtons[0]) stepButtons[0].disabled = false;
}


// --- Initialization Helpers ---

/**
 * トークンカードの初期配置
 */
function initializeTokens() {
    const initToken = (zoneId, slotIndex, imgSrc, memo) => {
        const zone = document.getElementById(zoneId);
        if (!zone) return;
        const container = zone.querySelector('.token-slot-container');
        if (!container) return;
        const slots = container.querySelectorAll('.card-slot');
        const slot = slots[slotIndex];
        if (slot && !slot.querySelector('.thumbnail')) {
            const prefix = zoneId.startsWith('opponent-') ? 'opponent-' : '';
            if (typeof createCardThumbnail === 'function') {
                createCardThumbnail({
                    src: imgSrc,
                    memo: memo,
                    ownerPrefix: prefix
                }, slot, false, false, prefix);
            }
        }
    };

    const token1Memo = '[カード名:トークンカード（S）]/#e0e0e0/#555/1.0/表示/\n[属性:S]/#e0e0e0/#555/1.0/表示/\n[マナ:1]/#e0e0e0/#555/1.0/表示/\n[BP:1000]/#e0e0e0/#555/1.0/表示/\n[フレーバーテキスト:女王]/#fff/#555/1.0/非表示/\n[効果:なし]/#e0e0e0/#555/1.0/表示/\n';
    const token2Memo = '[カード名:トークンカード（M）]/#e0e0e0/#555/1.0/表示/\n[属性:M]/#e0e0e0/#555/1.0/表示/\n[マナ:1]/#e0e0e0/#555/1.0/表示/\n[BP:1000]/#e0e0e0/#555/1.0/表示/\n[フレーバーテキスト:奴隷]/#fff/#555/1.0/非表示/\n[効果:なし]/#e0e0e0/#555/1.0/表示/\n';

    initToken('token-zone-slots', 0, './decoration/トークン1.png', token1Memo);
    initToken('token-zone-slots', 1, './decoration/トークン2.png', token2Memo);

    initToken('opponent-token-zone-slots', 0, './decoration/トークン1.png', token1Memo);
    initToken('opponent-token-zone-slots', 1, './decoration/トークン2.png', token2Memo);
}


// --- Event Listeners Setup ---

/**
 * ゲームコントロール関連のイベントリスナーを設定
 * ui-main.js から呼び出される
 */
function setupGameControlEvents() {
    // Game Result Close
    if (gameResultCloseBtn) {
        gameResultCloseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeGameResult();
        });
    }

    // デュエル開始ボタン
    if (duelStartBtn) {
        duelStartBtn.addEventListener('click', async () => {
            const currentTurn = parseInt(document.getElementById('common-turn-value').value) || 1;
            const hasCards = document.querySelectorAll('.game-board .card-slot .thumbnail').length > 0;
            
            if (currentTurn > 1 || hasCards) {
                const confirmed = await showCustomConfirm('現在のゲームをリセットしてデュエルを開始しますか？');
                if (!confirmed) return;
            }

            playSe('ボタン共通.mp3');

            // 1. リセット
            if (autoConfig.autoDuelReset) {
                if(typeof resetBoard === 'function') {
                    resetBoard('');
                    resetBoard('opponent-');
                }
            }

            // 2. シャッフル
            if (autoConfig.autoDuelShuffle) {
                if(typeof shuffleDeck === 'function') {
                    shuffleDeck('');
                    shuffleDeck('opponent-');
                }
            }

            // 3. 5枚ドロー
            if (autoConfig.autoDuelDraw) {
                for(let i=0; i<5; i++) {
                    if(typeof drawCardFromDeck === 'function') {
                        drawCardFromDeck('');
                        drawCardFromDeck('opponent-');
                    }
                }
            }

            // 4. 先行後攻ランダム
            const isFirst = Math.random() < 0.5;
            const turnSelect = document.getElementById('turn-player-select');
            
            const optFirst = turnSelect.querySelector('option[value="first"]');
            const optSecond = turnSelect.querySelector('option[value="second"]');
            
            if (isFirst) {
                // 自分が先行
                if (optFirst) optFirst.textContent = '先行';
                if (optSecond) optSecond.textContent = '後攻';
                turnSelect.value = 'first';
            } else {
                // 相手が先行
                if (optFirst) optFirst.textContent = '後攻';
                if (optSecond) optSecond.textContent = '先行';
                turnSelect.value = 'second';
            }

            // 5. ターン数リセット
            const turnInput = document.getElementById('common-turn-value');
            turnInput.value = 1;

            // 6. ステップリセット & ターン終了フラグ初期化
            currentStepIndex = -1;
            updateStepUI();
            isTurnEnded = true; 
            
            updateTurnPlayerVisuals();
            
            if (typeof updateSummoningSicknessVisuals === 'function') {
                updateSummoningSicknessVisuals();
            }
            
            if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = false;

            // 7. 盤面自動反転
            if (autoConfig.autoBoardFlip) {
                const body = document.body;
                if (!isFirst) { // 相手が先行（自分が後攻）
                    if (!body.classList.contains('board-flipped')) {
                        document.getElementById('common-flip-board-btn')?.click();
                    }
                } else { // 自分が先行
                    if (body.classList.contains('board-flipped')) {
                        document.getElementById('common-flip-board-btn')?.click();
                    }
                }
            }

            // 8. 開始メッセージ & SE
            const playerName = document.getElementById('player-name').value;
            const opponentName = document.getElementById('opponent-player-name').value;
            const firstPlayerName = isFirst ? playerName : opponentName;
            
            await showCustomAlert(`デュエル開始！\n先行は「${firstPlayerName}」です。`);
            playSe('Theme.mp3'); 
            
            resetTurnTimer();
        });
    }

    // ターン操作パネル
    const turnInput = document.getElementById('common-turn-value');
    const turnPrevBtn = document.getElementById('common-turn-prev');
    const turnNextBtn = document.getElementById('common-turn-next');
    
    if (turnInput && turnPrevBtn && turnNextBtn) {
        const updateTurnValue = (change) => {
            playSe('ボタン共通.mp3');
            let currentValue = parseInt(turnInput.value) || 1;
            currentValue = Math.max(1, currentValue + change);
            turnInput.value = currentValue;
            
            if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({ type: 'turnChange', value: currentValue });
            }
        };
        turnPrevBtn.addEventListener('click', () => updateTurnValue(-1));
        turnNextBtn.addEventListener('click', () => updateTurnValue(1));
    }
    
    const turnPlayerSelect = document.getElementById('turn-player-select');
    if (turnPlayerSelect) {
        turnPlayerSelect.addEventListener('change', () => {
             updateTurnPlayerVisuals(); // 手動変更時も反映
             if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({ type: 'turnPlayerChange', value: turnPlayerSelect.value });
            }
        });
    }

    // タイマー設定入力の監視
    const timerInput = document.getElementById('setting-timer-duration');
    if (timerInput) {
        timerInput.value = turnTimerDuration;
        timerInput.addEventListener('change', (e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val > 0) {
                turnTimerDuration = val;
                resetTurnTimer();
            }
        });
    }

    // タイマー一時停止ボタン
    if (timerPauseBtn) {
        timerPauseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (currentTimerId) {
                stopTurnTimer();
            } else {
                startTurnTimer(true); 
            }
        });
    }

    // 初期表示設定
    updateTurnPlayerVisuals();

    // トークン初期化
    initializeTokens();

    // ステップボタン初期化
    setupStepButtons();
}