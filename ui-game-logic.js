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

function closeGameResult() {
    if (gameResultOverlay) {
        gameResultOverlay.style.display = 'none';
    }
}

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
                if (autoConfig.autoPhaseOnTimeout) {
                    processAutoTurnProgression(); 
                }
            }
        }, 1000);
    }
}

function stopTurnTimer() {
    if (currentTimerId) {
        clearInterval(currentTimerId);
        currentTimerId = null;
    }
    if(timerPauseBtn) timerPauseBtn.textContent = '▶';
}

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

function updateStepUI() {
    stepButtons.forEach((btn, index) => {
        if (!btn) return;
        btn.classList.toggle('active', index === currentStepIndex);
        const nextStepIndex = (currentStepIndex + 1) % stepOrder.length;
        btn.disabled = (index !== nextStepIndex);
    });
}

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

function setupStepButtons() {
    stepButtons = stepOrder.map(id => document.getElementById(id));

    stepButtons.forEach((button, index) => {
        if (button) {
            button.addEventListener('click', async () => {
                if (!button.disabled) {
                    
                    const turnInput = document.getElementById('common-turn-value');
                    const turnPlayerSelect = document.getElementById('turn-player-select');
                    let cutinTriggered = false;

                    const triggerCutin = () => {
                        if (typeof autoConfig !== 'undefined' && autoConfig.msgPhaseCutin && !cutinTriggered) {
                            const stepLabels = ['ターン開始', 'ドローステップ', 'アンタップステップ', 'メインステップ', 'バトルステップ', 'エンドステップ'];
                            const label = stepLabels[index] || '';
                            if(label && typeof showPhaseCutin === 'function') showPhaseCutin(label);
                            cutinTriggered = true;
                        }
                    };
                    
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
                            console.log("前のターンが終了していないため、ターン数は進めずにステップをリセットしました。");
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
                            triggerCutin();
                        }
                    }
                    
                    if (button.id === 'step-start') {
                        playSe('ターン開始.mp3');
                    } else {
                        playSe('ボタン共通.mp3');
                    }
                    
                    currentStepIndex = index;
                    updateStepUI();

                    if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                        recordAction({ type: 'stepChange', index: index });
                    }

                    if (button.id === 'step-draw') {
                        if (autoConfig.autoDrawPhase) {
                            const turnVal = parseInt(turnInput.value) || 1;
                            const isFirstTurnFirstPlayer = (turnVal === 1 && turnPlayerSelect.value === 'first');
                            
                            if (isFirstTurnFirstPlayer) {
                                if (autoConfig.msgDrawPhase) {
                                    await showCustomAlert('先行1ターン目なので1ドローしません');
                                    triggerCutin();
                                }
                            } else {
                                const prefix = (turnPlayerSelect.value === 'second') ? 'opponent-' : '';
                                const btnId = prefix + 'draw-card';
                                document.getElementById(btnId)?.click();
                                
                                if (autoConfig.msgDrawPhase) {
                                    await showCustomAlert('1ドローしてください（自動処理設定ONの場合は自動で引かれています）');
                                    triggerCutin();
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
                                triggerCutin();
                            }
                        }
                    }

                    else if (button.id === 'step-mana') {
                        if (autoConfig.msgUntapPhase) {
                            await showCustomAlert('カードをアンタップしてください');
                            triggerCutin();
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

                    else if (button.id === 'step-main') {
                        if (autoConfig.msgMainPhase) {
                            await showCustomAlert('マナエリアに1枚だけ、カードを置く事が出来ます');
                            triggerCutin();
                        }
                    }

                    else if (button.id === 'step-attack') {
                        if (autoConfig.msgBattlePhase) {
                            await showCustomAlert('アタック/バトル可能です');
                            triggerCutin();
                        }
                    }

                    else if (button.id === 'step-end') {
                        stopTurnTimer();
                        isTurnEnded = true;
                        
                        if (autoConfig.msgEndPhase) {
                            await showCustomAlert('ターンを終了します');
                            triggerCutin();
                        }
                    }
                    
                    if (!cutinTriggered) {
                        triggerCutin();
                    }
                }
            });
        }
    });

    currentStepIndex = -1;
    updateStepUI();
    if(stepButtons[0]) stepButtons[0].disabled = false;
}

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

function setupGameControlEvents() {
    if (gameResultCloseBtn) {
        gameResultCloseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeGameResult();
        });
    }

    if (duelStartBtn) {
        duelStartBtn.addEventListener('click', async () => {
            const currentTurn = parseInt(document.getElementById('common-turn-value').value) || 1;
            const hasCards = document.querySelectorAll('.game-board .card-slot .thumbnail').length > 0;
            
            if (currentTurn > 1 || hasCards) {
                const confirmed = await showCustomConfirm('現在のゲームをリセットしてデュエルを開始しますか？');
                if (!confirmed) return;
            }

            playSe('ボタン共通.mp3');

            const playerDeckContainer = document.getElementById('deck-back-slots');
            const playerDeckCount = playerDeckContainer ? playerDeckContainer.querySelectorAll('.thumbnail').length : 0;
            
            const opponentDeckContainer = document.getElementById('opponent-deck-back-slots');
            const opponentDeckCount = opponentDeckContainer ? opponentDeckContainer.querySelectorAll('.thumbnail').length : 0;

            if (playerDeckCount === 0 || opponentDeckCount === 0) {
                if (typeof window.validSampleDecks !== 'undefined' && window.validSampleDecks.length > 0) {
                    
                    let msg = '';
                    if (playerDeckCount === 0 && opponentDeckCount === 0) {
                        msg = '双方のデッキがありません。\nサンプルデッキを読み込んで開始します。';
                    } else if (playerDeckCount === 0) {
                        msg = '自分(Player)のデッキがありません。\nサンプルデッキを読み込んで開始します。';
                    } else {
                        msg = '相手(Opponent)のデッキがありません。\nサンプルデッキを読み込んで開始します。';
                    }
                    
                    await showCustomAlert(msg);
                    
                    if (playerDeckCount === 0) {
                        const randomP = Math.floor(Math.random() * window.validSampleDecks.length);
                        const dataP = window.validSampleDecks[randomP];
                        
                        if (typeof clearZoneData === 'function') {
                            clearZoneData('deck-back-slots');
                            clearZoneData('side-deck-back-slots');
                            clearZoneData('free-space-slots');
                            clearZoneData('token-zone-slots');
                        }
                        
                        if (typeof applyDataToZone === 'function') {
                            if (dataP.deck) applyDataToZone('deck-back-slots', dataP.deck);
                            if (dataP.sideDeck) applyDataToZone('side-deck-back-slots', dataP.sideDeck);
                            if (dataP.freeSpace) applyDataToZone('free-space-slots', dataP.freeSpace);
                            if (dataP.token) applyDataToZone('token-zone-slots', dataP.token);
                        }
                        
                        if (typeof syncMainZoneImage === 'function') {
                            syncMainZoneImage('deck', '');
                            syncMainZoneImage('side-deck', '');
                        }
                    }

                    if (opponentDeckCount === 0) {
                        const randomO = Math.floor(Math.random() * window.validSampleDecks.length);
                        const dataO = window.validSampleDecks[randomO];
                        
                        if (typeof clearZoneData === 'function') {
                            clearZoneData('opponent-deck-back-slots');
                            clearZoneData('opponent-side-deck-back-slots');
                            clearZoneData('opponent-free-space-slots');
                            clearZoneData('opponent-token-zone-slots');
                        }
                        
                        if (typeof applyDataToZone === 'function') {
                            if (dataO.deck) applyDataToZone('opponent-deck-back-slots', dataO.deck);
                            if (dataO.sideDeck) applyDataToZone('opponent-side-deck-back-slots', dataO.sideDeck);
                            if (dataO.freeSpace) applyDataToZone('opponent-free-space-slots', dataO.freeSpace);
                            if (dataO.token) applyDataToZone('opponent-token-zone-slots', dataO.token);
                        }
                        
                        if (typeof syncMainZoneImage === 'function') {
                            syncMainZoneImage('deck', 'opponent-');
                            syncMainZoneImage('side-deck', 'opponent-');
                        }
                    }

                } else {
                    console.warn("有効なサンプルデッキが見つかりませんでした。");
                }
            }

            if (autoConfig.autoDuelReset) {
                if(typeof resetBoard === 'function') {
                    resetBoard('');
                    resetBoard('opponent-');
                }
            }

            if (autoConfig.autoDuelShuffle) {
                if(typeof shuffleDeck === 'function') {
                    shuffleDeck('');
                    shuffleDeck('opponent-');
                }
            }

            if (autoConfig.autoDuelDraw) {
                for(let i=0; i<5; i++) {
                    if(typeof drawCardFromDeck === 'function') {
                        drawCardFromDeck('');
                        drawCardFromDeck('opponent-');
                    }
                }
            }

            const isFirst = Math.random() < 0.5;
            const turnSelect = document.getElementById('turn-player-select');
            
            const optFirst = turnSelect.querySelector('option[value="first"]');
            const optSecond = turnSelect.querySelector('option[value="second"]');
            
            if (isFirst) {
                if (optFirst) optFirst.textContent = '先行';
                if (optSecond) optSecond.textContent = '後攻';
                turnSelect.value = 'first';
            } else {
                if (optFirst) optFirst.textContent = '後攻';
                if (optSecond) optSecond.textContent = '先行';
                turnSelect.value = 'second';
            }

            const turnInput = document.getElementById('common-turn-value');
            turnInput.value = 1;

            currentStepIndex = -1;
            updateStepUI();
            isTurnEnded = true; 
            
            updateTurnPlayerVisuals();
            
            if (typeof updateSummoningSicknessVisuals === 'function') {
                updateSummoningSicknessVisuals();
            }
            
            if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = false;

            if (autoConfig.autoBoardFlip) {
                const body = document.body;
                if (!isFirst) { 
                    if (!body.classList.contains('board-flipped')) {
                        document.getElementById('common-flip-board-btn')?.click();
                    }
                } else { 
                    if (body.classList.contains('board-flipped')) {
                        document.getElementById('common-flip-board-btn')?.click();
                    }
                }
            }

            const playerName = document.getElementById('player-name').value;
            const opponentName = document.getElementById('opponent-player-name').value;
            const firstPlayerName = isFirst ? playerName : opponentName;
            
            await showCustomAlert(`デュエル開始！\n先行は「${firstPlayerName}」です。`);
            playSe('デュエル開始.mp3'); 
            
            resetTurnTimer();
        });
    }

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
             updateTurnPlayerVisuals(); 
             if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({ type: 'turnPlayerChange', value: turnPlayerSelect.value });
            }
        });
    }

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
        resetTurnTimer(); 
    }

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

    updateTurnPlayerVisuals();

    initializeTokens();

    setupStepButtons();

    startStatusAnimationLoop();
}

function startStatusAnimationLoop() {
    setTimeout(() => {
        setInterval(() => {
            triggerStatusAnimation('');
            triggerStatusAnimation('opponent-');
        }, 4000); 
    }, 2000);
}

function triggerStatusAnimation(idPrefix) {
    const wrapperClass = idPrefix ? '.opponent-wrapper' : '.player-wrapper';
    const wrapper = document.querySelector(wrapperClass);
    if (!wrapper) return;

    const inputs = Array.from(wrapper.querySelectorAll('.extra-text'));
    const validTexts = inputs.map(input => input.value.trim()).filter(text => text !== '');

    if (validTexts.length === 0) return;

    const shuffled = validTexts.sort(() => 0.5 - Math.random());

    const iconZoneId = idPrefix + 'icon-zone';
    const iconZone = document.getElementById(iconZoneId);
    const targetEl = iconZone ? iconZone.closest('.player-icon-slot') : null;

    if (!targetEl) return;

    shuffled.forEach((text, index) => {
        setTimeout(() => {
            const floatingEl = document.createElement('div');
            floatingEl.textContent = text;
            floatingEl.className = 'status-floating-pink'; 
            
            const randomTop = Math.random() * 100;
            const randomLeft = Math.random() * 100;
            
            floatingEl.style.top = `${randomTop}%`;
            floatingEl.style.left = `${randomLeft}%`;
            floatingEl.style.transform = 'translate(-50%, -50%)'; 

            targetEl.appendChild(floatingEl);

            floatingEl.addEventListener('animationend', () => {
                floatingEl.remove();
            });
        }, index * 800); 
    });
}