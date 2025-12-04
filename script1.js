function getBaseId(prefixedId) {
    if (!prefixedId) return null;
    return prefixedId.replace('opponent-', '');
}

function getPrefixFromZoneId(zoneId) {
    return zoneId && zoneId.startsWith('opponent-') ? 'opponent-' : '';
}

function getCardDimensions() {
    const rootStyles = getComputedStyle(document.documentElement);
    const width = parseFloat(rootStyles.getPropertyValue('--card-width').replace('px', '')) || 70;
    const height = parseFloat(rootStyles.getPropertyValue('--card-height').replace('px', '')) || 124.7;
    return { width, height };
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function resetSlotToDefault(slotElement) {
    if (!slotElement) return;
    slotElement.classList.remove('rotated-90');
    const imgElement = slotElement.querySelector('.thumbnail img');
    if (imgElement) {
        imgElement.style.transform = `rotate(0deg)`;
        imgElement.dataset.rotation = 0;
    }
}

function getExistingThumbnail(slotElement) {
    const thumbnails = slotElement.querySelectorAll('.thumbnail');
    return thumbnails.length > 0 ? thumbnails[thumbnails.length - 1] : null;
}

function getParentZoneId(element) {
    if (!element) return null;
    if (element.id === 'icon-zone' || element.id === 'opponent-icon-zone') {
        return element.id;
    }
    const closestZone = element.closest('.zone, .hand-zone-slots, .drawer-panel, .drawer-free-space, .drawer-token-space, .player-icon-slot');
    if (closestZone && closestZone.classList.contains('player-icon-slot')) {
        const iconSlot = closestZone.querySelector('.card-slot');
        if (iconSlot) return iconSlot.id;
    }
    return closestZone ? closestZone.id : null;
}

function playPlacementSe(baseZoneId) {
    if (baseZoneId === 'spell') {
        playSe('スペル配置.mp3');
    } else if (baseZoneId === 'battle') {
        playSe('バトル配置.mp3');
    } else if (baseZoneId === 'special1' || baseZoneId === 'special2') {
        playSe('特殊配置.mp3');
    } else if (baseZoneId && baseZoneId.startsWith('mana')) {
        playSe('マナ配置.mp3');
    } else {
        playSe('カードを配置する.mp3');
    }
}

const loopSeInstances = {};

function playSe(filename, isLoop = false) {
    if (typeof seConfig !== 'undefined' && seConfig[filename] === false) return;

    if (typeof seVolume !== 'undefined' && seVolume <= 0) return;

    const path = `./se/${filename}`;
    const audio = new Audio(path);
    
    if (typeof seVolume !== 'undefined') {
        audio.volume = seVolume / 10;
    }

    if (isLoop) {
        if (loopSeInstances[filename]) return;
        
        audio.loop = true;
        audio.play().catch(e => {
             console.warn(`SE Play Error (${filename}):`, e);
        });
        loopSeInstances[filename] = audio;
    } else {
        audio.onerror = () => {
            if (filename !== 'ボタン共通.mp3') {
                playSe('ボタン共通.mp3');
            }
        };

        audio.currentTime = 0;
        audio.play().catch(e => {
            console.warn(`SE Play Error (${filename}):`, e);
        });
    }
}

function stopSe(filename) {
    const audio = loopSeInstances[filename];
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        delete loopSeInstances[filename];
    }
}

function playBgm(filename) {
    if (currentBgmAudio && !currentBgmAudio.paused && currentBgmAudio.src.includes(encodeURIComponent(filename))) {
        return;
    }

    stopBgm();

    if (!filename) return;
    
    if (typeof bgmVolume !== 'undefined' && bgmVolume <= 0) return;

    const path = `./bgm/${filename}`;
    currentBgmAudio = new Audio(path);
    
    if (typeof bgmVolume !== 'undefined') {
        currentBgmAudio.volume = (bgmVolume / 10) * 0.5;
    }
    
    currentBgmAudio.loop = true;

    currentBgmAudio.play().catch(e => console.error("BGM Play Error:", e));
}

function pauseBgm() {
    if (currentBgmAudio && !currentBgmAudio.paused) {
        currentBgmAudio.pause();
    }
}

function stopBgm() {
    if (currentBgmAudio) {
        currentBgmAudio.pause();
        currentBgmAudio.currentTime = 0;
        currentBgmAudio = null;
    }
}

function updateBgmVolume() {
    if (currentBgmAudio && typeof bgmVolume !== 'undefined') {
        currentBgmAudio.volume = (bgmVolume / 10) * 0.5;
    }
}

let replayInitialState = null;

async function startReplayRecording() {
    if (isRecording) return;
    isRecording = true;
    actionLog = [];
    replayStartTime = Date.now();
    replayInitialState = getAllBoardState(); 
    
    const startBtn = document.getElementById('record-start-btn');
    const stopBtn = document.getElementById('record-stop-btn');
    if(startBtn) startBtn.style.display = 'none';
    if(stopBtn) stopBtn.style.display = 'inline-block';
    
    if (typeof showCustomAlert === 'function') {
        await showCustomAlert("記録を開始しました。");
    } else {
        alert("記録を開始しました。");
    }
}

function stopReplayRecording() {
    if (!isRecording) return;
    isRecording = false;
    
    const startBtn = document.getElementById('record-start-btn');
    const stopBtn = document.getElementById('record-stop-btn');
    if(startBtn) startBtn.style.display = 'inline-block';
    if(stopBtn) stopBtn.style.display = 'none';

    setTimeout(() => {
        exportReplayData();
    }, 100);
}

function recordAction(actionData) {
    if (typeof isPlaying !== 'undefined' && isPlaying) return;

    const message = generateLogMessage(actionData);
    if (message && typeof addLogMessage === 'function') {
        addLogMessage(message);
    }

    if (!isRecording) return;
    const timestamp = Date.now() - replayStartTime;
    actionLog.push({
        time: timestamp,
        data: actionData
    });
}

function getZoneName(zoneId) {
    if (!zoneId) return '不明なエリア';
    
    const isOpponent = zoneId.startsWith('opponent-');
    const baseId = zoneId.replace('opponent-', '').replace('-back-slots', '').replace('-slots', '');
    const prefix = isOpponent ? '相手:' : '自分:';
    
    const names = {
        'hand-zone': '手札',
        'deck': 'デッキ',
        'grave': '墓地',
        'exclude': '除外',
        'side-deck': 'EXデッキ',
        'mana-left': 'マナエリア1',
        'mana-right': 'マナエリア2',
        'battle': 'バトルエリア',
        'special1': '特殊エリア1',
        'special2': '特殊エリア2',
        'spell': 'スペルエリア',
        'extra-image-zone': 'フィールド',
        'icon-zone': 'アイコン',
        'free-space': 'フリースペース',
        'token-zone': 'トークン',
        'c-free-space': 'バンク'
    };
    
    if (baseId === 'c-free-space') return 'バンク';
    
    return prefix + (names[baseId] || baseId);
}

function getCardNameFromSlot(zoneId, slotIndex, cardData = null) {
    if (cardData && cardData.memo) {
        const match = cardData.memo.match(/\[カード名:(.*?)\]/);
        if (match) return match[1];
    }

    const slot = getSlotByIndex(zoneId, slotIndex);
    if (slot) {
        const thumb = slot.querySelector('.thumbnail');
        if (thumb) {
            const memo = thumb.dataset.memo || '';
            const match = memo.match(/\[カード名:(.*?)\]/);
            return match ? match[1] : 'カード';
        }
    }
    return 'カード';
}

function generateLogMessage(action) {
    try {
        switch (action.type) {
            case 'move':
                const cardNameMove = getCardNameFromSlot(action.toZone, action.toSlotIndex); 
                return `${getZoneName(action.fromZone)}から${getZoneName(action.toZone)}へ「${cardNameMove}」を移動`;
            case 'newCard':
                const cardNameNew = getCardNameFromSlot(action.zoneId, action.slotIndex, action.cardData);
                return `${getZoneName(action.zoneId)}に「${cardNameNew}」を配置`;
            case 'rotate':
                const cardNameRot = getCardNameFromSlot(action.zoneId, action.slotIndex);
                const state = (Math.abs(action.rotation) % 180 !== 0) ? 'タップ' : 'アンタップ';
                return `「${cardNameRot}」を${state}`;
            case 'flip':
                const cardNameFlip = getCardNameFromSlot(action.zoneId, action.slotIndex);
                const face = action.isFlipped ? '裏側' : '表側';
                return `「${cardNameFlip}」を${face}に変更`;
            case 'delete':
                const cardNameDel = getCardNameFromSlot(action.zoneId, action.slotIndex);
                return `「${cardNameDel}」を削除`;
            case 'counterChange':
                let target = 'カウンター';
                if (action.inputId.includes('lp')) target = 'LP';
                else if (action.inputId.includes('mana')) target = 'マナ';
                const owner = action.inputId.includes('opponent') ? '相手' : '自分';
                const change = action.change > 0 ? `+${action.change}` : action.change;
                return `${owner}の${target}を${change}`;
            case 'turnChange':
                return `ターン${action.value}へ移行`;
            case 'turnPlayerChange':
                const player = action.value === 'first' ? '先行' : '後攻';
                return `ターンプレイヤーを${player}に変更`;
            case 'stepChange':
                const steps = ['ターン開始', 'ドロー', 'アンタップ', 'メイン', 'バトル', 'ターン終了'];
                return `ステップ: ${steps[action.index]}へ移行`;
            case 'dice':
                return `ダイス結果: ${action.result}`;
            case 'coin':
                return `コイン結果: ${action.result}`;
            case 'cardCounter':
                const cardNameCnt = getCardNameFromSlot(action.zoneId, action.slotIndex);
                return `「${cardNameCnt}」のカウンターを${action.counter}に変更`;
            case 'effect':
                const cardNameEff = getCardNameFromSlot(action.zoneId, action.slotIndex);
                let subType = action.subType;
                if(subType === 'attack') subType = 'アタック';
                else if(subType === 'target') subType = '対象選択';
                else if(subType === 'effect') subType = '効果発動';
                return `「${cardNameEff}」が${subType}`;
            case 'permanent':
                const cardNamePerm = getCardNameFromSlot(action.zoneId, action.slotIndex);
                const permState = action.isPermanent ? 'ON' : 'OFF';
                return `「${cardNamePerm}」の常時発動を${permState}`;
            case 'masturbate':
                const cardNameMas = getCardNameFromSlot(action.zoneId, action.slotIndex);
                const masState = action.isMasturbating ? '開始' : '終了';
                return `「${cardNameMas}」がオナニーを${masState}`;
            case 'blocker':
                const cardNameBlk = getCardNameFromSlot(action.zoneId, action.slotIndex);
                const blkState = action.isBlocker ? '付与' : '解除';
                return `「${cardNameBlk}」のブロッカーを${blkState}`;
            case 'memoChange':
                const cardNameMemo = getCardNameFromSlot(action.zoneId, action.cardIndex);
                return `「${cardNameMemo}」のメモを編集`;
            case 'flavorUpdate':
                const cardNameFlv = getCardNameFromSlot(action.zoneId, action.cardIndex);
                return `「${cardNameFlv}」のフレーバー${action.slotNumber}を更新`;
            case 'flavorDelete':
                const cardNameFlvDel = getCardNameFromSlot(action.zoneId, action.cardIndex);
                return `「${cardNameFlvDel}」のフレーバー${action.slotNumber}を削除`;
            case 'updateDecoration':
                return `${getZoneName(action.zoneId)}の装飾を変更`;
            default:
                return null;
        }
    } catch (e) {
        console.warn('Log generation failed:', e);
        return null;
    }
}

async function exportReplayData() {
    if (!replayInitialState || actionLog.length === 0) {
        if (typeof showCustomAlert === 'function') {
            await showCustomAlert("保存するリプレイデータがありません。");
        } else {
            alert("保存するリプレイデータがありません。");
        }
        return;
    }

    const defaultName = "sm_solitaire_replay";
    const fileName = typeof showCustomPrompt === 'function' 
        ? await showCustomPrompt("リプレイファイル名を入力してください", defaultName)
        : prompt("リプレイファイル名を入力してください", defaultName);

    if (!fileName) {
        if (typeof showCustomAlert === 'function') {
            await showCustomAlert("保存をキャンセルしました。");
        } else {
            alert("保存をキャンセルしました。");
        }
        return; 
    }

    const replayData = {
        initialState: replayInitialState,
        log: actionLog,
        settings: {} 
    };

    const jsonData = JSON.stringify(replayData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importReplayData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json, application/json';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const importData = JSON.parse(event.target.result);
                if (importData.initialState && importData.log) {
                    replayInitialState = importData.initialState;
                    actionLog = importData.log;
                    
                    currentReplayFileName = file.name;
                    const nameDisplay = document.getElementById('replay-file-name-display');
                    const nameText = document.getElementById('replay-file-name-text');
                    if (nameDisplay && nameText) {
                        nameText.textContent = currentReplayFileName;
                        nameDisplay.style.display = 'block';
                    }

                    if (typeof showCustomAlert === 'function') {
                        await showCustomAlert(`「${file.name}」を読み込みました。\n再生ボタンで開始します。`);
                    } else {
                        alert(`「${file.name}」を読み込みました。\n再生ボタンで開始します。`);
                    }
                    updateReplayUI('stopped');
                } else {
                    if (typeof showCustomAlert === 'function') {
                        await showCustomAlert("無効なリプレイデータ形式です。");
                    } else {
                        alert("無効なリプレイデータ形式です。");
                    }
                }
            } catch (error) {
                console.error("Replay Import failed:", error);
                if (typeof showCustomAlert === 'function') {
                    await showCustomAlert("リプレイデータの読み込みに失敗しました。");
                } else {
                    alert("リプレイデータの読み込みに失敗しました。");
                }
            }
        };
        reader.readAsText(file);
    };
    fileInput.click();
}

function updateReplayUI(state) {
    const playBtn = document.getElementById('replay-play-btn');
    const pauseBtn = document.getElementById('replay-pause-btn');
    const stopBtn = document.getElementById('replay-stop-btn');
    const recordStart = document.getElementById('record-start-btn');
    
    if (state === 'playing') {
        if(playBtn) playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
        if(stopBtn) stopBtn.style.display = 'inline-block';
        if(recordStart) recordStart.disabled = true;
    } else if (state === 'paused') {
        if(playBtn) {
            playBtn.style.display = 'inline-block';
            playBtn.textContent = '再開'; 
        }
        if(pauseBtn) pauseBtn.style.display = 'none';
        if(stopBtn) stopBtn.style.display = 'inline-block';
    } else {
        if(playBtn) {
            playBtn.style.display = 'inline-block';
            playBtn.textContent = '再生';
        }
        if(pauseBtn) pauseBtn.style.display = 'none';
        if(stopBtn) stopBtn.style.display = 'none';
        if(recordStart) recordStart.disabled = false;
    }
}

function playReplay() {
    if (!replayInitialState || actionLog.length === 0) {
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("再生するリプレイデータがありません。");
        } else {
            alert("再生するリプレイデータがありません。");
        }
        return;
    }

    if (isRecording) {
        stopReplayRecording();
    }

    isPlaying = true;
    isReplayPaused = false;
    currentReplayIndex = 0;
    
    restoreAllBoardState(replayInitialState);
    updateReplayUI('playing');
    
    processNextReplayStep(0); 
}

function pauseReplay() {
    if (!isPlaying) return;
    isReplayPaused = true;
    
    if (replayTimerIds.length > 0) {
        clearTimeout(replayTimerIds[0]);
        replayTimerIds = [];
    }
    updateReplayUI('paused');
}

function resumeReplay() {
    if (!isPlaying || !isReplayPaused) return;
    isReplayPaused = false;
    updateReplayUI('playing');
    
    processNextReplayStep(100);
}

function stopReplay() {
    isPlaying = false;
    isReplayPaused = false;
    currentReplayIndex = 0;
    
    if (replayTimerIds.length > 0) {
        replayTimerIds.forEach(id => clearTimeout(id));
        replayTimerIds = [];
    }
    
    updateReplayUI('stopped');
}

function processNextReplayStep(forceDelay = null) {
    if (!isPlaying || isReplayPaused) return;
    if (currentReplayIndex >= actionLog.length) {
        stopReplay();
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("リプレイ再生が終了しました。");
        } else {
            alert("リプレイ再生が終了しました。");
        }
        return;
    }

    let delay = 0;
    if (forceDelay !== null) {
        delay = forceDelay;
    } else {
        const waitTimeInput = document.getElementById('replay-wait-time-input');
        const fixedWaitTime = waitTimeInput && waitTimeInput.value !== "" ? parseFloat(waitTimeInput.value) * 1000 : null;

        if (fixedWaitTime !== null && !isNaN(fixedWaitTime)) {
            delay = fixedWaitTime;
        } else {
            const currentActionTime = actionLog[currentReplayIndex].time;
            const prevActionTime = currentReplayIndex > 0 ? actionLog[currentReplayIndex - 1].time : 0;
            const rawDiff = currentActionTime - prevActionTime;
            delay = Math.min(rawDiff, 2000);
        }
    }

    const timerId = setTimeout(() => {
        if (!isPlaying || isReplayPaused) return;
        
        const actionEntry = actionLog[currentReplayIndex];
        executeAction(actionEntry.data);
        currentReplayIndex++;
        
        processNextReplayStep();

    }, delay);
    
    replayTimerIds = [timerId];
}

function executeAction(action) {
    
    const updatePreviewForAction = (zoneId, slotIndex) => {
        const slot = getSlotByIndex(zoneId, slotIndex);
        if (slot) {
            const thumb = slot.querySelector('.thumbnail');
            if (thumb && window.updateCardPreview) {
                window.updateCardPreview(thumb);
            }
        }
    };

    switch (action.type) {
        case 'move': {
            const fromSlot = getSlotByIndex(action.fromZone, action.fromSlotIndex);
            const toSlot = getSlotByIndex(action.toZone, action.toSlotIndex);
            
            if (fromSlot && toSlot) {
                const card = fromSlot.querySelector('.thumbnail');
                const targetCard = toSlot.querySelector('.thumbnail');
                
                if (card) {
                    if (targetCard) {
                        fromSlot.appendChild(targetCard);
                        toSlot.appendChild(card);
                    } else {
                        toSlot.appendChild(card);
                    }
                    
                    [fromSlot, toSlot].forEach(slot => {
                        resetSlotToDefault(slot);
                        updateSlotStackState(slot);
                        const zId = getParentZoneId(slot);
                        if (zId && zId.endsWith('-back-slots')) arrangeSlots(zId);
                        const baseId = getBaseId(zId);
                        if (decorationZones.includes(baseId)) syncMainZoneImage(baseId, getPrefixFromZoneId(zId));
                    });
                    
                    const toBase = getBaseId(getParentZoneId(toSlot));
                    if (toBase === 'grave' || toBase === 'grave-back-slots') playSe('墓地に送る.mp3');
                    else if (toBase === 'exclude' || toBase === 'exclude-back-slots') playSe('除外する.mp3');
                    else playPlacementSe(toBase);

                    updatePreviewForAction(action.toZone, action.toSlotIndex);
                }
            }
            break;
        }
        case 'newCard': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const prefix = getPrefixFromZoneId(action.zoneId);
                createCardThumbnail(action.cardData, slot, false, false, prefix);
                updateSlotStackState(slot);
                
                const baseId = getBaseId(getParentZoneId(slot));
                playPlacementSe(baseId);
                
                const zId = getParentZoneId(slot);
                if (zId && zId.endsWith('-back-slots')) arrangeSlots(zId);
                
                if (decorationZones.includes(baseId)) syncMainZoneImage(baseId, prefix);
                
                updatePreviewForAction(action.zoneId, action.slotIndex);
            }
            break;
        }
        case 'updateDecoration': {
            const container = document.getElementById(action.zoneId);
            const slot = container ? container.querySelector('.card-slot') : null;
            if (slot) {
                let existingThumbnail = slot.querySelector('.thumbnail[data-is-decoration="true"]');
                if (existingThumbnail) {
                    const img = existingThumbnail.querySelector('img');
                    if (img) img.src = action.imageData;
                } else {
                    const anyThumb = getExistingThumbnail(slot);
                    if (anyThumb) slot.removeChild(anyThumb);
                    const prefix = getPrefixFromZoneId(action.zoneId);
                    createCardThumbnail(action.imageData, slot, true, false, prefix);
                }
                playSe('カードを配置する.mp3');
                syncMainZoneImage(getBaseId(action.zoneId), getPrefixFromZoneId(action.zoneId));
            }
            break;
        }
        case 'rotate': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    const img = card.querySelector('.card-image');
                    if (img) {
                        const currentRotation = action.rotation;
                        img.dataset.rotation = currentRotation;
                        
                        if (Math.abs(currentRotation) % 180 !== 0) {
                            slot.classList.add('rotated-90');
                            const { width, height } = getCardDimensions();
                            const scaleFactor = height / width;
                            img.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;
                            if(getBaseId(action.zoneId).startsWith('mana')) playSe('マナ増加.mp3');
                            else playSe('タップ.mp3');
                        } else {
                            slot.classList.remove('rotated-90');
                            img.style.transform = `rotate(${currentRotation}deg)`;
                            if(!getBaseId(action.zoneId).startsWith('mana')) playSe('タップ.mp3');
                        }
                    }
                    updatePreviewForAction(action.zoneId, action.slotIndex);
                }
            }
            break;
        }
        case 'flip': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    const prefix = getPrefixFromZoneId(action.zoneId);
                    const currentFlipped = card.dataset.isFlipped === 'true';
                    if (currentFlipped !== action.isFlipped) {
                         flipCard(card, prefix); 
                         playSe('カードを反転させる.wav');
                         updatePreviewForAction(action.zoneId, action.slotIndex);
                    }
                }
            }
            break;
        }
        case 'delete': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    deleteCard(card);
                    playSe('ボタン共通.mp3');
                }
            }
            break;
        }
        case 'cardCounter': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    const overlay = card.querySelector('.card-counter-overlay');
                    if (overlay) {
                        overlay.dataset.counter = action.counter;
                        overlay.textContent = action.counter;
                        overlay.style.display = action.counter > 0 ? 'flex' : 'none';
                        if (action.counter > 0) playSe('カウンターを置く.mp3');
                        else playSe('カウンターを取り除く.mp3');
                        updatePreviewForAction(action.zoneId, action.slotIndex);
                    }
                }
            }
            break;
        }
        case 'masturbate': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    card.dataset.isMasturbating = action.isMasturbating;
                    if(action.isMasturbating) playSe('オナニー.wav', true);
                    else stopSe('オナニー.wav');
                    updatePreviewForAction(action.zoneId, action.slotIndex);
                }
            }
            break;
        }
        case 'permanent': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    card.dataset.isPermanent = action.isPermanent;
                    if(action.isPermanent) {
                        playSe('常時発動.mp3');
                    } else {
                        playSe('ボタン共通.mp3');
                    }
                    updatePreviewForAction(action.zoneId, action.slotIndex);
                }
            }
            break;
        }
        case 'blocker': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    if (action.isBlocker) {
                        card.dataset.isBlocker = 'true';
                        addBlockerOverlay(card);
                        playSe('ブロッカー.mp3');
                    } else {
                        card.dataset.isBlocker = 'false';
                        removeBlockerOverlay(card);
                        playSe('ボタン共通.mp3');
                    }
                    updatePreviewForAction(action.zoneId, action.slotIndex);
                }
            }
            break;
        }
        case 'effect': {
            const slot = getSlotByIndex(action.zoneId, action.slotIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    triggerEffect(card, action.subType);
                    
                    if(action.subType === 'attack') {
                        playSe('アタック.mp3');
                    } else if(action.subType === 'effect') {
                        const zoneId = getParentZoneId(card.parentNode);
                        const baseZoneId = getBaseId(zoneId);
                        if (baseZoneId.startsWith('mana')) {
                        } else if (baseZoneId === 'spell') {
                            playSe('スペル効果発動.mp3');
                        } else {
                            playSe('効果発動.mp3');
                        }
                    } else {
                        playSe('対象に取る.mp3');
                    }
                    
                    updatePreviewForAction(action.zoneId, action.slotIndex);
                }
            }
            break;
        }
        case 'counterChange': {
            const input = document.getElementById(action.inputId);
            if (input) {
                const newVal = parseInt(input.value) + action.change;
                input.value = Math.max(0, newVal);
                playSe('ボタン共通.mp3');
            }
            break;
        }
        case 'turnChange': {
            const input = document.getElementById('common-turn-value');
            if (input) {
                input.value = action.value;
                playSe('ボタン共通.mp3');
            }
            break;
        }
        case 'turnPlayerChange': {
            const select = document.getElementById('turn-player-select');
            if (select) select.value = action.value;
            break;
        }
        case 'turnAutoUpdate': {
             const input = document.getElementById('common-turn-value');
             if (input) input.value = action.turnValue;
             const select = document.getElementById('turn-player-select');
             if (select) select.value = action.turnPlayer;
             
             if (typeof isTurnEnded !== 'undefined') isTurnEnded = false;
             if (typeof updateTurnPlayerVisuals === 'function') updateTurnPlayerVisuals();
             break;
        }
        case 'stepChange': {
            currentStepIndex = action.index;
            updateStepUI();
            
            if (action.index === 5 && typeof isTurnEnded !== 'undefined') {
                isTurnEnded = true;
            }

            if (action.index === 0) {
                playSe('ターン開始.mp3');
            } else {
                playSe('ボタン共通.mp3');
            }
            break;
        }
        case 'dice': {
            const display = document.getElementById('random-result');
            if (display) display.textContent = `ダイス: ${action.result}`;
            playSe('サイコロ.mp3');
            break;
        }
        case 'coin': {
            const display = document.getElementById('random-result');
            if (display) display.textContent = `コイン: ${action.result}`;
            playSe('コイントス.mp3');
            break;
        }
        case 'boardFlip': {
            break; 
        }
        case 'autoDecreaseToggle': {
            const btn = document.getElementById(action.id);
            if (btn) btn.click();
            break;
        }
        case 'memoChange': {
            const slot = getSlotByIndex(action.zoneId, action.cardIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    card.dataset.memo = action.memo;
                    playSe('ボタン共通.mp3');
                    updatePreviewForAction(action.zoneId, action.cardIndex);
                }
            }
            break;
        }
        case 'flavorUpdate': {
            const slot = getSlotByIndex(action.zoneId, action.cardIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    if (action.slotNumber === 1) card.dataset.flavor1 = action.imgSrc;
                    else if (action.slotNumber === 2) card.dataset.flavor2 = action.imgSrc;
                    playSe('ボタン共通.mp3');
                    updatePreviewForAction(action.zoneId, action.cardIndex);
                }
            }
            break;
        }
        case 'flavorDelete': {
            const slot = getSlotByIndex(action.zoneId, action.cardIndex);
            if (slot) {
                const card = slot.querySelector('.thumbnail');
                if (card) {
                    if (action.slotNumber === 1) delete card.dataset.flavor1;
                    else if (action.slotNumber === 2) delete card.dataset.flavor2;
                    playSe('ボタン共通.mp3');
                    updatePreviewForAction(action.zoneId, action.cardIndex);
                }
            }
            break;
        }
        case 'effectAction':
            playSe('効果発動.mp3');
            break;
        case 'target':
            playSe('対象に取る.mp3');
            break;
    }
}

function getSlotByIndex(zoneId, index) {
    const zone = document.getElementById(zoneId);
    if (!zone) return null;
    
    if (zone.classList.contains('card-slot')) return zone;

    const container = zone.querySelector('.slot-container, .deck-back-slot-container, .free-space-slot-container, .token-slot-container, .hand-zone-slots') || zone;
    const slots = container.querySelectorAll('.card-slot');
    return slots[index] || null;
}

function confirmWarning(configKey, message) {
    if (typeof autoConfig === 'undefined') return true;
    if (!autoConfig[configKey]) return true; 
    return window.confirm(message);
}