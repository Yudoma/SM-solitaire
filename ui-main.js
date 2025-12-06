window.renderDeckStorage = async function() {
    const container = document.getElementById('deck-storage-container');
    const sampleContainer = document.getElementById('sample-deck-container');
    
    if (container) {
        container.innerHTML = '';
        if (typeof deckStorageData !== 'undefined') {
            deckStorageData.forEach((slot, index) => {
                const caseEl = document.createElement('div');
                caseEl.className = 'deck-case';
                
                const header = document.createElement('div');
                header.className = 'deck-case-header';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'deck-case-name-input';
                input.value = slot.name;
                input.addEventListener('change', (e) => {
                    updateStorageName(index, e.target.value);
                });
                header.appendChild(input);
                
                const thumbArea = document.createElement('div');
                thumbArea.className = 'deck-case-thumbnail';
                
                if (slot.thumbnailSrc) {
                    const img = document.createElement('img');
                    img.src = slot.thumbnailSrc;
                    thumbArea.appendChild(img);
                    
                    const counts = document.createElement('div');
                    counts.className = 'deck-case-counts';
                    counts.textContent = `メイン: ${slot.counts.main}\nEX: ${slot.counts.ex}`;
                    thumbArea.appendChild(counts);
                } else {
                    const emptyText = document.createElement('span');
                    emptyText.className = 'empty-text';
                    emptyText.textContent = '空';
                    thumbArea.appendChild(emptyText);
                }
                
                const controls = document.createElement('div');
                controls.className = 'deck-case-controls';
                
                const row1 = document.createElement('div');
                row1.className = 'deck-control-row';
                const saveP = document.createElement('button');
                saveP.className = 'deck-storage-btn btn-save-p';
                saveP.textContent = 'Pから登録';
                saveP.title = '現在の自分(Player)のデッキをここに保存';
                saveP.onclick = () => saveToStorage(index, 'player');
                
                const saveO = document.createElement('button');
                saveO.className = 'deck-storage-btn btn-save-o';
                saveO.textContent = 'Oから登録';
                saveO.title = '現在の相手(Opponent)のデッキをここに保存';
                saveO.onclick = () => saveToStorage(index, 'opponent');
                
                row1.appendChild(saveP);
                row1.appendChild(saveO);
                
                const row2 = document.createElement('div');
                row2.className = 'deck-control-row';
                const loadP = document.createElement('button');
                loadP.className = 'deck-storage-btn btn-load-p';
                loadP.textContent = 'Pへ適用';
                loadP.title = 'この内容を自分(Player)のデッキに展開';
                loadP.onclick = () => loadFromStorage(index, 'player');
                if(!slot.mainDeckData) loadP.style.opacity = '0.5';

                const loadO = document.createElement('button');
                loadO.className = 'deck-storage-btn btn-load-o';
                loadO.textContent = 'Oへ適用';
                loadO.title = 'この内容を相手(Opponent)のデッキに展開';
                loadO.onclick = () => loadFromStorage(index, 'opponent');
                if(!slot.mainDeckData) loadO.style.opacity = '0.5';

                row2.appendChild(loadP);
                row2.appendChild(loadO);
                
                controls.appendChild(row1);
                controls.appendChild(row2);
                
                const deleteBtn = document.createElement('div');
                deleteBtn.className = 'deck-case-delete';
                deleteBtn.textContent = '×';
                deleteBtn.title = 'このスロットを空にする';
                deleteBtn.onclick = () => deleteFromStorage(index);
                
                caseEl.appendChild(header);
                caseEl.appendChild(thumbArea);
                caseEl.appendChild(controls);
                caseEl.appendChild(deleteBtn);
                
                container.appendChild(caseEl);
            });
        }
    }

    if (sampleContainer) {
        sampleContainer.innerHTML = '';
        for (let i = 1; i <= 8; i++) {
            const fileName = `sample/sample_deck_${i}.json`;
            try {
                const response = await fetch(fileName);
                if (response.ok) {
                    const data = await response.json();
                    createSampleSlot(sampleContainer, i, data);
                } else {
                    createEmptySampleSlot(sampleContainer, i);
                }
            } catch (e) {
                console.warn(`Sample deck ${i} not found.`);
                createEmptySampleSlot(sampleContainer, i);
            }
        }
    }
};

function createEmptySampleSlot(container, index) {
    const caseEl = document.createElement('div');
    caseEl.className = 'deck-case';
    caseEl.style.opacity = '0.6';
    
    const header = document.createElement('div');
    header.className = 'deck-case-header';
    header.style.textAlign = 'center';
    header.style.color = '#ccc';
    header.style.fontSize = '0.8em';
    header.textContent = `No Data ${index}`;
    
    const thumbArea = document.createElement('div');
    thumbArea.className = 'deck-case-thumbnail';
    const emptyText = document.createElement('span');
    emptyText.className = 'empty-text';
    emptyText.textContent = '-';
    thumbArea.appendChild(emptyText);
    
    const controls = document.createElement('div');
    controls.className = 'deck-case-controls';
    const row = document.createElement('div');
    row.className = 'deck-control-row';
    const loadP = document.createElement('button');
    loadP.className = 'deck-storage-btn btn-load-p';
    loadP.textContent = 'Pへ適用';
    loadP.disabled = true;
    loadP.style.opacity = '0.5';
    loadP.style.cursor = 'default';
    const loadO = document.createElement('button');
    loadO.className = 'deck-storage-btn btn-load-o';
    loadO.textContent = 'Oへ適用';
    loadO.disabled = true;
    loadO.style.opacity = '0.5';
    loadO.style.cursor = 'default';
    row.appendChild(loadP);
    row.appendChild(loadO);
    controls.appendChild(row);

    caseEl.appendChild(header);
    caseEl.appendChild(thumbArea);
    caseEl.appendChild(controls);
    container.appendChild(caseEl);
}

function createSampleSlot(container, index, data) {
    const caseEl = document.createElement('div');
    caseEl.className = 'deck-case';
    
    const header = document.createElement('div');
    header.className = 'deck-case-header';
    const title = document.createElement('div');
    title.className = 'deck-case-name-input';
    title.textContent = `Sample ${index}`;
    title.style.border = 'none';
    title.style.background = 'transparent';
    header.appendChild(title);
    
    const thumbArea = document.createElement('div');
    thumbArea.className = 'deck-case-thumbnail';
    
    let thumbSrc = null;
    let mainCount = 0;
    let exCount = 0;
    
    if (data.deck && Array.isArray(data.deck)) {
        for(const cards of data.deck) {
            if (cards && cards.length > 0) {
                mainCount += cards.length;
                if (!thumbSrc) thumbSrc = cards[0].src;
            }
        }
    }
    if (data.sideDeck && Array.isArray(data.sideDeck)) {
        for(const cards of data.sideDeck) {
            if (cards && cards.length > 0) exCount += cards.length;
        }
    }
    
    if (thumbSrc) {
        const img = document.createElement('img');
        img.src = thumbSrc;
        thumbArea.appendChild(img);
        
        const counts = document.createElement('div');
        counts.className = 'deck-case-counts';
        counts.textContent = `メイン: ${mainCount}\nEX: ${exCount}`;
        thumbArea.appendChild(counts);
    } else {
        const emptyText = document.createElement('span');
        emptyText.className = 'empty-text';
        emptyText.textContent = 'No Image';
        thumbArea.appendChild(emptyText);
    }
    
    const controls = document.createElement('div');
    controls.className = 'deck-case-controls';
    
    const row = document.createElement('div');
    row.className = 'deck-control-row';
    
    const loadP = document.createElement('button');
    loadP.className = 'deck-storage-btn btn-load-p';
    loadP.textContent = 'Pへ適用';
    loadP.onclick = () => loadFromSample(data, 'player');
    
    const loadO = document.createElement('button');
    loadO.className = 'deck-storage-btn btn-load-o';
    loadO.textContent = 'Oへ適用';
    loadO.onclick = () => loadFromSample(data, 'opponent');
    
    row.appendChild(loadP);
    row.appendChild(loadO);
    controls.appendChild(row);
    
    caseEl.appendChild(header);
    caseEl.appendChild(thumbArea);
    caseEl.appendChild(controls);
    container.appendChild(caseEl);
}

window.loadFromSample = async function(data, target) {
    playSe('ボタン共通.mp3');
    
    const label = target === 'player' ? '自分(Player)' : '相手(Opponent)';
    const confirmMsg = `現在の${label}のデッキ・盤面情報は上書きされます。\nサンプルデッキを適用しますか？`;
    
    if (typeof showCustomConfirm === 'function') {
        if (!await showCustomConfirm(confirmMsg)) return;
    } else if (!confirm(confirmMsg)) return;
    
    if (typeof saveStateForUndo === 'function') saveStateForUndo();
    
    const prefix = target === 'opponent' ? 'opponent-' : '';
    
    if (typeof clearZoneData === 'function') {
        clearZoneData(prefix + 'deck-back-slots');
        clearZoneData(prefix + 'side-deck-back-slots');
        clearZoneData(prefix + 'free-space-slots');
        clearZoneData(prefix + 'token-zone-slots');
    }
    
    if (typeof applyDataToZone === 'function') {
        if (data.deck) applyDataToZone(prefix + 'deck-back-slots', data.deck);
        if (data.sideDeck) applyDataToZone(prefix + 'side-deck-back-slots', data.sideDeck);
        if (data.freeSpace) applyDataToZone(prefix + 'free-space-slots', data.freeSpace);
        if (data.token) applyDataToZone(prefix + 'token-zone-slots', data.token);
    }
    
    if (typeof syncMainZoneImage === 'function') {
        syncMainZoneImage('deck', prefix);
        syncMainZoneImage('side-deck', prefix);
    }
    
    playSe('シャッフル.mp3');
    
    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
};

window.saveToStorage = async function(index, source) {
    playSe('ボタン共通.mp3');
    
    const label = source === 'player' ? '自分(Player)' : '相手(Opponent)';
    const confirmMsg = `スロット${index + 1}に、現在の${label}のデッキ情報を上書き登録しますか？`;
    
    if (typeof showCustomConfirm === 'function') {
        if (!await showCustomConfirm(confirmMsg)) return;
    } else if (!confirm(confirmMsg)) return;
    
    const prefix = source === 'opponent' ? 'opponent-' : '';
    
    if (typeof extractZoneData !== 'function') return;
    
    const mainDeck = extractZoneData(prefix + 'deck-back-slots');
    const sideDeck = extractZoneData(prefix + 'side-deck-back-slots');
    const freeSpace = extractZoneData(prefix + 'free-space-slots');
    const tokenZone = extractZoneData(prefix + 'token-zone-slots');
    
    let thumbSrc = null;
    let mainCount = 0;
    
    if (mainDeck && Array.isArray(mainDeck)) {
        for(const cards of mainDeck) {
            if (cards && cards.length > 0) {
                mainCount += cards.length;
                if (!thumbSrc) thumbSrc = cards[0].src;
            }
        }
    }
    
    let exCount = 0;
    if (sideDeck && Array.isArray(sideDeck)) {
        for(const cards of sideDeck) {
            if (cards && cards.length > 0) {
                exCount += cards.length;
                if (!thumbSrc) thumbSrc = cards[0].src; 
            }
        }
    }
    
    deckStorageData[index].mainDeckData = mainDeck;
    deckStorageData[index].exDeckData = sideDeck;
    deckStorageData[index].freeSpaceData = freeSpace;
    deckStorageData[index].tokenData = tokenZone;
    deckStorageData[index].thumbnailSrc = thumbSrc;
    deckStorageData[index].counts = { main: mainCount, ex: exCount };
    
    playSe('カードを配置する.mp3');
    renderDeckStorage();
};

window.loadFromStorage = async function(index, target) {
    playSe('ボタン共通.mp3');
    
    const slot = deckStorageData[index];
    if (!slot.mainDeckData && !slot.exDeckData && !slot.freeSpaceData && !slot.tokenData) return;
    
    const label = target === 'player' ? '自分(Player)' : '相手(Opponent)';
    const confirmMsg = `現在の${label}のデッキ・EXデッキ・フリー・トークンエリアは上書きされます。\n「${slot.name}」を適用しますか？`;
    
    if (typeof showCustomConfirm === 'function') {
        if (!await showCustomConfirm(confirmMsg)) return;
    } else if (!confirm(confirmMsg)) return;
    
    if (typeof saveStateForUndo === 'function') saveStateForUndo();
    
    const prefix = target === 'opponent' ? 'opponent-' : '';
    
    if (typeof clearZoneData === 'function') {
        clearZoneData(prefix + 'deck-back-slots');
        clearZoneData(prefix + 'side-deck-back-slots');
        clearZoneData(prefix + 'free-space-slots');
        clearZoneData(prefix + 'token-zone-slots');
    }
    
    if (typeof applyDataToZone === 'function') {
        if (slot.mainDeckData) applyDataToZone(prefix + 'deck-back-slots', slot.mainDeckData);
        if (slot.exDeckData) applyDataToZone(prefix + 'side-deck-back-slots', slot.exDeckData);
        if (slot.freeSpaceData) applyDataToZone(prefix + 'free-space-slots', slot.freeSpaceData);
        if (slot.tokenData) applyDataToZone(prefix + 'token-zone-slots', slot.tokenData);
    }
    
    if (typeof syncMainZoneImage === 'function') {
        syncMainZoneImage('deck', prefix);
        syncMainZoneImage('side-deck', prefix);
    }
    
    playSe('シャッフル.mp3');
    
    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
};

window.deleteFromStorage = async function(index) {
    playSe('ボタン共通.mp3');
    
    const slot = deckStorageData[index];
    if (!slot.mainDeckData && !slot.exDeckData && !slot.freeSpaceData && !slot.tokenData) return;

    const confirmMsg = `スロット${index + 1}「${slot.name}」の内容を削除しますか？`;
    
    if (typeof showCustomConfirm === 'function') {
        if (!await showCustomConfirm(confirmMsg)) return;
    } else if (!confirm(confirmMsg)) return;
    
    deckStorageData[index] = {
        id: `deck-slot-${index}`,
        name: `Deck ${index + 1}`,
        mainDeckData: null,
        exDeckData: null,
        freeSpaceData: null,
        tokenData: null,
        thumbnailSrc: null,
        counts: { main: 0, ex: 0 }
    };
    
    renderDeckStorage();
};

window.updateStorageName = function(index, newName) {
    if (deckStorageData[index]) {
        deckStorageData[index].name = newName;
    }
};

window.setupUI = function() {
    if (window.isUiSetupDone) return;
    window.isUiSetupDone = true;

    contextMenu = document.getElementById('custom-context-menu');
    actionMenuItem = document.getElementById('context-menu-action');
    permanentMenuItem = document.getElementById('context-menu-permanent'); 
    attackMenuItem = document.getElementById('context-menu-attack'); 
    targetMenuItem = document.getElementById('context-menu-target');
    deleteMenuItem = document.getElementById('context-menu-delete');
    toGraveMenuItem = document.getElementById('context-menu-to-grave');
    toExcludeMenuItem = document.getElementById('context-menu-to-exclude');
    toHandMenuItem = document.getElementById('context-menu-to-hand');
    toDeckMenuItem = document.getElementById('context-menu-to-deck');
    toSideDeckMenuItem = document.getElementById('context-menu-to-side-deck');
    flipMenuItem = document.getElementById('context-menu-flip');
    changeStyleMenuItem = document.getElementById('context-menu-change-style');
    memoMenuItem = document.getElementById('context-menu-memo');
    addCounterMenuItem = document.getElementById('context-menu-add-counter');
    removeCounterMenuItem = document.getElementById('context-menu-remove-counter');
    addFlavorMenuItem = document.getElementById('context-menu-add-flavor');
    viewIllustrationMenuItem = document.getElementById('context-menu-view-illustration');
    masturbateMenuItem = document.getElementById('context-menu-masturbate');
    blockerMenuItem = document.getElementById('context-menu-blocker');
    exportCardMenuItem = document.getElementById('context-menu-export');
    importCardMenuItem = document.getElementById('context-menu-import');
    
    customCounterMenuItem = document.getElementById('context-menu-custom-counter');
    duplicateMenuItem = document.getElementById('context-menu-duplicate');
    setAsTopMenuItem = document.getElementById('context-menu-set-as-top');
    
    exportPreviewMenuItem = document.getElementById('context-menu-export-preview');
    if (!exportPreviewMenuItem && contextMenu) {
        exportPreviewMenuItem = document.createElement('li');
        exportPreviewMenuItem.id = 'context-menu-export-preview';
        exportPreviewMenuItem.textContent = '画像としてエクスポート';
        exportPreviewMenuItem.style.display = 'none';
        const ul = contextMenu.querySelector('ul');
        if (ul) ul.appendChild(exportPreviewMenuItem);
    }

    memoEditorModal = document.getElementById('memo-editor');
    memoEditorHeader = document.getElementById('memo-editor-header');
    memoTextarea = document.getElementById('memo-editor-textarea');
    memoSaveBtn = document.getElementById('memo-editor-save');
    memoCancelBtn = document.getElementById('memo-editor-cancel');
    memoTooltip = document.getElementById('memo-tooltip');
    memoFontSizeInput = document.getElementById('memo-font-size-input');
    memoWidthInput = document.getElementById('memo-width-input');
    memoHeightInput = document.getElementById('memo-height-input');

    lightboxOverlay = document.getElementById('lightbox-overlay');
    lightboxContent = document.getElementById('lightbox-content');

    commonDrawer = document.getElementById('common-drawer');
    commonDrawerToggle = document.getElementById('common-drawer-toggle');
    cDrawer = document.getElementById('c-drawer');
    cDrawerToggle = document.getElementById('c-drawer-toggle');

    commonFlipBoardBtn = document.getElementById('common-flip-board-btn');
    commonDecorationSettingsBtn = document.getElementById('common-decoration-settings-btn');
    commonToggleNavBtn = document.getElementById('common-toggle-nav-btn');

    commonExportBoardBtn = document.getElementById('common-export-board-btn');
    commonImportBoardBtn = document.getElementById('common-import-board-btn');
    
    recordStartBtn = document.getElementById('record-start-btn');
    recordStopBtn = document.getElementById('record-stop-btn');
    replayPlayBtn = document.getElementById('replay-play-btn');
    replayPauseBtn = document.getElementById('replay-pause-btn');
    replayStopBtn = document.getElementById('replay-stop-btn');
    loadReplayBtn = document.getElementById('load-replay-btn');
    replayFileNameDisplay = document.getElementById('replay-file-name-display');
    replayFileNameText = document.getElementById('replay-file-name-text');
    replayWaitTimeInput = document.getElementById('replay-wait-time-input');

    diceRollBtn = document.getElementById('dice-roll-btn');
    coinTossBtn = document.getElementById('coin-toss-btn');
    randomResultDisplay = document.getElementById('random-result');

    flavorEditorModal = document.getElementById('flavor-editor');
    flavorEditorHeader = document.getElementById('flavor-editor-header');
    flavorPreview1 = document.getElementById('flavor-preview-1');
    flavorPreview2 = document.getElementById('flavor-preview-2');
    flavorDelete1 = document.getElementById('flavor-delete-1');
    flavorDelete2 = document.getElementById('flavor-delete-2');
    flavorDropZone1 = document.getElementById('flavor-drop-zone-1');
    flavorDropZone2 = document.getElementById('flavor-drop-zone-2');
    flavorUpload1 = document.getElementById('flavor-upload-1');
    flavorUpload2 = document.getElementById('flavor-upload-2');
    flavorCancelBtn = document.getElementById('flavor-editor-cancel');
    flavorSaveBtn = document.getElementById('flavor-editor-save-btn'); 
    
    customCounterModal = document.getElementById('custom-counter-modal');
    customCounterCloseBtn = document.getElementById('custom-counter-close-btn');
    customCounterSaveBtn = document.getElementById('custom-counter-save-btn'); 
    createCounterBtn = document.getElementById('create-counter-btn');
    newCounterNameInput = document.getElementById('new-counter-name');
    newCounterImageDrop = document.getElementById('new-counter-image-drop');
    customCounterListContainer = document.getElementById('custom-counter-list');

    decorationSettingsModal = document.getElementById('decoration-settings-modal');
    decorationSettingsHeader = document.getElementById('decoration-settings-header');
    decorationSettingsCloseBtn = document.getElementById('decoration-settings-close-btn');

    battleConfirmModal = document.getElementById('battle-confirm-modal');
    battleConfirmHeader = document.getElementById('battle-confirm-header');
    battleConfirmAttackerImg = document.getElementById('battle-confirm-attacker-img');
    battleConfirmTargetImg = document.getElementById('battle-confirm-target-img');
    battleConfirmAttackerBpInput = document.getElementById('battle-confirm-attacker-bp');
    battleConfirmTargetBpInput = document.getElementById('battle-confirm-target-bp');
    battleConfirmExecuteBtn = document.getElementById('battle-confirm-execute-btn');
    battleConfirmCancelBtn = document.getElementById('battle-confirm-cancel-btn');

    gameResultOverlay = document.getElementById('game-result-overlay');
    gameResultMessage = document.getElementById('game-result-message');
    gameResultCloseBtn = document.getElementById('game-result-close-btn');

    bgmSelect = document.getElementById('bgm-select');
    bgmPlayBtn = document.getElementById('bgm-play-btn');
    bgmPauseBtn = document.getElementById('bgm-pause-btn');
    bgmStopBtn = document.getElementById('bgm-stop-btn');
    bgmVolumeSlider = document.getElementById('bgm-volume-slider');
    bgmVolumeVal = document.getElementById('bgm-volume-val');
    seVolumeSlider = document.getElementById('se-volume-slider');
    seVolumeVal = document.getElementById('se-volume-val');

    seCheckAllBtn = document.getElementById('se-check-all');
    seUncheckAllBtn = document.getElementById('se-uncheck-all');
    effectCheckAllBtn = document.getElementById('effect-check-all');
    effectUncheckAllBtn = document.getElementById('effect-uncheck-all');
    autoCheckAllBtn = document.getElementById('auto-check-all');
    autoUncheckAllBtn = document.getElementById('auto-uncheck-all');
    autoConfigContainer = document.getElementById('auto-config-container');
    
    battleTargetOverlay = document.getElementById('battle-target-overlay');
    battleCancelBtn = document.getElementById('battle-cancel-btn');
    
    playerAutoDecreaseInput = document.getElementById('player-auto-decrease-interval');
    opponentAutoDecreaseInput = document.getElementById('opponent-auto-decrease-interval');
    
    hyphenAutoDecreaseBtn = document.getElementById('hyphen-auto-decrease-btn');
    opponentHyphenAutoDecreaseBtn = document.getElementById('opponent-hyphen-auto-decrease-btn');
    
    shuffleDeckBtn = document.getElementById('shuffle-deck');
    opponentShuffleDeckBtn = document.getElementById('opponent-shuffle-deck');
    shuffleHandBtn = document.getElementById('shuffle-hand');
    opponentShuffleHandBtn = document.getElementById('opponent-shuffle-hand');
    
    systemBtn = document.getElementById('system-btn');
    opponentSystemBtn = document.getElementById('opponent-system-btn');

    duelStartBtn = document.getElementById('duel-start-btn');
    timerPauseBtn = document.getElementById('timer-pause-btn');
    cSearchFilter = document.getElementById('c-search-filter');

    actionLogBody = document.getElementById('action-log-body');
    turnTimerDisplay = document.getElementById('turn-timer-display');
    downloadLogBtn = document.getElementById('download-log-btn');

    if (!contextMenu) {
        console.error("必須UI要素が見つかりません。");
        return;
    }

    const seSettingsContainer = document.getElementById('se-settings-container');
    if (seSettingsContainer && typeof seConfig !== 'undefined') {
        seSettingsContainer.innerHTML = '';
        Object.keys(seConfig).forEach(seName => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = seConfig[seName];
            input.dataset.seName = seName;
            input.addEventListener('change', (e) => {
                seConfig[seName] = e.target.checked;
            });
            
            const span = document.createElement('span');
            span.textContent = seName.replace('.mp3', '').replace('.wav', '');
            
            label.appendChild(input);
            label.appendChild(span);
            seSettingsContainer.appendChild(label);
        });
    }

    if (seCheckAllBtn) {
        seCheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof seConfig !== 'undefined') Object.keys(seConfig).forEach(key => seConfig[key] = true);
            const boxes = seSettingsContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = true);
        });
    }
    if (seUncheckAllBtn) {
        seUncheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof seConfig !== 'undefined') Object.keys(seConfig).forEach(key => seConfig[key] = false);
            const boxes = seSettingsContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = false);
        });
    }

    const effectSettingsContainer = document.getElementById('effect-settings-container');
    if (effectSettingsContainer && typeof effectConfig !== 'undefined') {
        effectSettingsContainer.innerHTML = '';
        const effectNames = {
            'masturbate': 'オナニー',
            'permanent': '常時発動',
            'attack': 'アタック',
            'effect': '効果発動',
            'target': '対象選択',
            'autoDecrease': '自動減少',
            'blocker': 'ブロッカー表示',
            'bpChange': 'BP変動演出',
            'statusFloat': 'ステータス表示'
        };
        Object.keys(effectConfig).forEach(key => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = effectConfig[key];
            input.dataset.effectKey = key;
            input.addEventListener('change', (e) => {
                effectConfig[key] = e.target.checked;
            });
            
            const span = document.createElement('span');
            span.textContent = effectNames[key] || key;
            
            label.appendChild(input);
            label.appendChild(span);
            effectSettingsContainer.appendChild(label);
        });
    }

    if (effectCheckAllBtn) {
        effectCheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof effectConfig !== 'undefined') Object.keys(effectConfig).forEach(key => effectConfig[key] = true);
            const boxes = effectSettingsContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = true);
        });
    }
    if (effectUncheckAllBtn) {
        effectUncheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof effectConfig !== 'undefined') Object.keys(effectConfig).forEach(key => effectConfig[key] = false);
            const boxes = effectSettingsContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = false);
        });
    }

    if (autoConfigContainer && typeof autoConfig !== 'undefined') {
        autoConfigContainer.innerHTML = '';
        const autoConfigLabels = {
            'autoManaTap': 'マナタップ時自動+1',
            'autoManaPlacement': 'マナ配置時自動+1',
            'autoBattleCalc': 'バトル自動計算処理',
            'autoManaTapInZone': 'マナ配置時タップ状態',
            'autoAttackTap': 'アタック後タップ',
            'autoManaCost': 'カード配置時マナ消費',
            'autoGameEnd': '勝敗判定の自動表示',
            'autoBpDestruction': 'BP0以下で自動破壊',
            'autoMasturbateDrain': 'オナニー中BP減少',
            
            'warnMasturbateDrain': '警告:オナニーBP減少',
            'warnFriendlyFire': '警告:自軍への攻撃',
            'warnSummoningSickness': '警告:召喚酔い時攻撃',
            'limitManaPlacement': '警告:マナ手出し制限(1枚)',
            'warnManaCost': '警告:マナコスト不足',
            'warnManaPlacementPhase': '警告:メイン以外マナ操作',
            'warnFieldPlacementPhase': '警告:メイン以外フィールド配置',
            'warnAttackPhase': '警告:バトル以外攻撃',
            'warnUntapPhase': '警告:アンタップ以外で起こす',
            
            'autoDrawPhase': 'ドローステップ自動ドロー',
            'autoBoardFlip': 'ターン開始時盤面反転',
            'autoResetBpOnLeave': '盤面移動時BPリセット',
            
            'msgDrawPhase': '表示:ドローステップ説明',
            'msgUntapPhase': '表示:アンタップステップ説明',
            'msgMainPhase': '表示:メインステップ説明',
            'msgBattlePhase': '表示:バトルステップ説明',
            'msgEndPhase': '表示:エンドステップ説明',
            'msgStartPhase': '表示:ターン開始説明',
            
            'autoUntapPhase': 'アンタップステップ自動処理',
            'msgPhaseCutin': 'ステップカットイン表示',
            'hideOpponentHand': '相手の手札を非公開'
        };
        
        Object.keys(autoConfig).forEach(key => {
            if (key.startsWith('autoDuel')) return;
            if (key === 'drawFlipped') return;
            if (key === 'autoPhaseOnTimeout') return;

            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = autoConfig[key];
            input.dataset.autoKey = key;
            
            if (key === 'hideOpponentHand' && autoConfig[key]) {
                document.body.classList.add('hide-hand-enabled');
            }

            input.addEventListener('change', (e) => {
                autoConfig[key] = e.target.checked;
                if (key === 'hideOpponentHand') {
                    if (e.target.checked) document.body.classList.add('hide-hand-enabled');
                    else document.body.classList.remove('hide-hand-enabled');
                }
            });
            
            const span = document.createElement('span');
            span.textContent = autoConfigLabels[key] || key;
            
            label.appendChild(input);
            label.appendChild(span);
            autoConfigContainer.appendChild(label);
        });
    }

    if (autoCheckAllBtn) {
        autoCheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof autoConfig !== 'undefined') Object.keys(autoConfig).forEach(key => { if(!key.startsWith('autoDuel') && key !== 'drawFlipped' && key !== 'autoPhaseOnTimeout') autoConfig[key] = true; });
            const boxes = autoConfigContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = true);
        });
    }
    if (autoUncheckAllBtn) {
        autoUncheckAllBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof autoConfig !== 'undefined') Object.keys(autoConfig).forEach(key => { if(!key.startsWith('autoDuel') && key !== 'drawFlipped' && key !== 'autoPhaseOnTimeout') autoConfig[key] = false; });
            const boxes = autoConfigContainer.querySelectorAll('input[type="checkbox"]');
            boxes.forEach(box => box.checked = false);
        });
    }

    ['setting-duel-reset', 'setting-duel-shuffle', 'setting-duel-draw', 'setting-auto-flip', 'setting-auto-phase-timeout'].forEach(id => {
        const checkbox = document.getElementById(id);
        if(checkbox && typeof autoConfig !== 'undefined') {
            const configKeyMap = {
                'setting-duel-reset': 'autoDuelReset',
                'setting-duel-shuffle': 'autoDuelShuffle',
                'setting-duel-draw': 'autoDuelDraw',
                'setting-auto-flip': 'autoBoardFlip',
                'setting-auto-phase-timeout': 'autoPhaseOnTimeout'
            };
            const key = configKeyMap[id];
            checkbox.checked = autoConfig[key];
            checkbox.addEventListener('change', (e) => {
                autoConfig[key] = e.target.checked;
            });
        }
    });

    if(typeof initKeyConfigUI === 'function') initKeyConfigUI();

    if(typeof setupContextMenuListeners === 'function') setupContextMenuListeners();
    if(typeof setupModalEvents === 'function') setupModalEvents();
    if(typeof setupGameControlEvents === 'function') setupGameControlEvents();
    if(typeof setupBattleEvents === 'function') setupBattleEvents();

    if(typeof setupCounters === 'function') {
        setupCounters('');
        setupCounters('opponent-');
    }

    const setupHyphenLabelLink = (prefix) => {
        const group = document.getElementById(prefix + 'hyphen-counter-group');
        if (group) {
            const input = group.querySelector('.header-input');
            if (input) {
                const updateLabel = () => {
                    const btn = document.getElementById(prefix + 'hyphen-auto-decrease-btn');
                    if (!btn) return;

                    const val = input.value || '●●';
                    const newText = `${val}自動減少`;
                    if (btn.textContent === '停止') {
                        btn.dataset.originalText = newText;
                    } else {
                        btn.textContent = newText;
                        btn.dataset.originalText = newText;
                    }
                };
                input.addEventListener('input', updateLabel);
                updateLabel();
            }
        }
    };
    setupHyphenLabelLink('');
    setupHyphenLabelLink('opponent-');

    if(typeof setupDrawerResize === 'function') setupDrawerResize();
    if(typeof setupHorizontalScroll === 'function') setupHorizontalScroll();
    
    if(typeof window.renderDeckStorage === 'function') {
        window.renderDeckStorage();
    }

    let currentFocusElement = null;

    function getFocusableElements() {
        return Array.from(document.querySelectorAll('.card-slot, .draw-btn, .counter-btn, .step-btn, .turn-btn, .drawer-toggle')).filter(el => {
            return el.offsetParent !== null && !el.disabled;
        });
    }

    function getCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    function moveFocus(direction) {
        const focusables = getFocusableElements();
        if (focusables.length === 0) return;

        if (!currentFocusElement || !document.body.contains(currentFocusElement)) {
            const defaultStart = document.querySelector('#hand-zone .card-slot');
            if (defaultStart) {
                setFocus(defaultStart);
                return;
            }
            setFocus(focusables[0]);
            return;
        }

        const currentCenter = getCenter(currentFocusElement);
        let bestCandidate = null;
        let minDistance = Infinity;

        focusables.forEach(candidate => {
            if (candidate === currentFocusElement) return;

            const candidateCenter = getCenter(candidate);
            const dx = candidateCenter.x - currentCenter.x;
            const dy = candidateCenter.y - currentCenter.y;
            
            let isValidDirection = false;
            let dist = Math.sqrt(dx * dx + dy * dy);

            switch (direction) {
                case 'ArrowUp':
                    if (dy < -10) isValidDirection = true;
                    dist += Math.abs(dx) * 1.5;
                    break;
                case 'ArrowDown':
                    if (dy > 10) isValidDirection = true;
                    dist += Math.abs(dx) * 1.5;
                    break;
                case 'ArrowLeft':
                    if (dx < -10) isValidDirection = true;
                    dist += Math.abs(dy) * 1.5;
                    break;
                case 'ArrowRight':
                    if (dx > 10) isValidDirection = true;
                    dist += Math.abs(dy) * 1.5;
                    break;
            }

            if (isValidDirection && dist < minDistance) {
                minDistance = dist;
                bestCandidate = candidate;
            }
        });

        if (bestCandidate) {
            setFocus(bestCandidate);
        }
    }

    function setFocus(element) {
        if (currentFocusElement) {
            currentFocusElement.classList.remove('keyboard-focus');
        }
        currentFocusElement = element;
        currentFocusElement.classList.add('keyboard-focus');
        
        if (element.classList.contains('card-slot')) {
            const thumb = element.querySelector('.thumbnail');
            if (thumb && typeof window.updateCardPreview === 'function') {
                window.updateCardPreview(thumb);
                lastHoveredElement = thumb;
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

        const key = e.key; 
        const lowerKey = key.toLowerCase();
        const isFlipped = document.body.classList.contains('board-flipped');

        if (typeof keyConfig === 'undefined') return;
        const conf = keyConfig;

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            moveFocus(key);
            return;
        }

        if (key === 'Enter' && currentFocusElement) {
            e.preventDefault();
            currentFocusElement.click();
            return;
        }

        if (key === 'Tab' && conf.toggleDrawer === 'Tab') {
            e.preventDefault();
            const toggleBtnId = isFlipped ? 'opponent-drawer-toggle' : 'player-drawer-toggle';
            document.getElementById(toggleBtnId)?.click();
            return;
        }

        if (lowerKey === conf.toggleCommon?.toLowerCase()) {
            e.preventDefault();
            commonDrawerToggle?.click();
            return;
        }
        if (lowerKey === conf.toggleBank?.toLowerCase()) {
            e.preventDefault();
            cDrawerToggle?.click();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && lowerKey === conf.undo.toLowerCase()) {
            e.preventDefault();
            if (typeof performUndo === 'function') performUndo();
            return;
        }

        if ((e.ctrlKey || e.metaKey) && lowerKey === conf.redo.toLowerCase()) {
            e.preventDefault();
            if (typeof performRedo === 'function') performRedo();
            return;
        }

        if (lowerKey === conf.toggleNav.toLowerCase()) {
            document.getElementById('common-toggle-nav-btn')?.click();
            return;
        }

        if (lowerKey === conf.flipBoard.toLowerCase()) {
            document.getElementById('common-flip-board-btn')?.click();
            return;
        }

        if (key === 'Escape') {
            if (typeof closeContextMenu === 'function') closeContextMenu();
            if (typeof closeLightbox === 'function') closeLightbox();
            if (typeof closeBattleConfirmModal === 'function') closeBattleConfirmModal();
            if (typeof cancelBattleTargetSelection === 'function' && typeof isBattleTargetMode !== 'undefined' && isBattleTargetMode) cancelBattleTargetSelection();
            if (memoEditorModal && memoEditorModal.style.display === 'flex') {
                memoCancelBtn.click();
            }
            if (flavorEditorModal && flavorEditorModal.style.display === 'block') {
                flavorCancelBtn.click();
            }
            if (currentFocusElement) {
                currentFocusElement.classList.remove('keyboard-focus');
                currentFocusElement = null;
            }
            document.querySelectorAll('.drawer-wrapper.open').forEach(drawer => {
                drawer.classList.remove('open');
            });
            return;
        }

        if ((key === ' ' || key === 'Space') && (conf.stepForward === ' ' || conf.stepForward === 'Space')) {
            e.preventDefault();
            if (typeof stepOrder !== 'undefined' && typeof currentStepIndex !== 'undefined') {
                const nextStepIndex = (currentStepIndex + 1) % stepOrder.length;
                const nextBtn = document.getElementById(stepOrder[nextStepIndex]);
                if (nextBtn && !nextBtn.disabled) nextBtn.click();
            }
            return;
        }

        if (lowerKey === conf.draw.toLowerCase()) {
            const prefix = isFlipped ? 'opponent-' : '';
            if (e.shiftKey) {
                document.getElementById(prefix + 'draw-5-card')?.click();
            } else {
                document.getElementById(prefix + 'draw-card')?.click();
            }
            return;
        }

        if (key === conf.phaseStart) document.getElementById('step-start')?.click();
        if (key === conf.phaseDraw) document.getElementById('step-draw')?.click();
        if (key === conf.phaseMana) document.getElementById('step-mana')?.click();
        if (key === conf.phaseMain) document.getElementById('step-main')?.click();
        if (key === conf.phaseBattle) document.getElementById('step-attack')?.click();
        if (key === conf.phaseEnd) document.getElementById('step-end')?.click();

        if (lowerKey === conf.turnChange?.toLowerCase()) {
            const select = document.getElementById('turn-player-select');
            if (select) {
                select.value = select.value === 'first' ? 'second' : 'first';
                select.dispatchEvent(new Event('change'));
                playSe('ボタン共通.mp3');
            }
        }

        const openDrawerShortcut = (tabId) => {
            const drawerId = isFlipped ? 'opponent-drawer' : 'player-drawer';
            const drawer = document.getElementById(drawerId);
            if (drawer) {
                drawer.classList.add('open');
                const prefix = isFlipped ? 'opponent-' : '';
                if(typeof activateDrawerTab === 'function') activateDrawerTab(prefix + tabId, drawer);
                playSe('ボタン共通.mp3');
            }
        };

        if (lowerKey === conf.openDeck?.toLowerCase()) openDrawerShortcut('deck-back-slots');
        if (lowerKey === conf.openGrave?.toLowerCase()) openDrawerShortcut('grave-back-slots');
        if (lowerKey === conf.openExclude?.toLowerCase()) openDrawerShortcut('exclude-back-slots');
        if (lowerKey === conf.openSideDeck?.toLowerCase()) openDrawerShortcut('side-deck-back-slots');
        
        if (lowerKey === conf.openBank?.toLowerCase()) {
            const drawer = document.getElementById('c-drawer');
            if (drawer) {
                drawer.classList.toggle('open');
                playSe('ボタン共通.mp3');
            }
        }

        if (lowerKey === conf.rollDice?.toLowerCase()) {
            if (commonDrawer) {
                commonDrawer.classList.add('open');
                if(typeof activateDrawerTab === 'function') activateDrawerTab('common-general-panel', commonDrawer);
            }
            document.getElementById('dice-roll-btn')?.click();
        }
        if (lowerKey === conf.tossCoin?.toLowerCase()) {
            if (commonDrawer) {
                commonDrawer.classList.add('open');
                if(typeof activateDrawerTab === 'function') activateDrawerTab('common-general-panel', commonDrawer);
            }
            document.getElementById('coin-toss-btn')?.click();
        }

        const targets = (typeof selectedCards !== 'undefined' && selectedCards.length > 0) 
                        ? selectedCards 
                        : (typeof lastHoveredElement !== 'undefined' && lastHoveredElement ? [lastHoveredElement] : []);

        if (targets.length > 0) {
            if (lowerKey === conf.tap.toLowerCase()) {
                if (typeof saveStateForUndo === 'function') saveStateForUndo();
                targets.forEach(card => {
                    const slotElement = card.parentNode;
                    const imgElement = card.querySelector('.card-image');
                    const parentZoneId = getParentZoneId(slotElement);
                    const baseParentZoneId = getBaseId(parentZoneId);
                    const idPrefix = getPrefixFromZoneId(parentZoneId);
                    
                    if (imgElement && typeof nonRotatableZones !== 'undefined' && !nonRotatableZones.includes(baseParentZoneId) && baseParentZoneId !== 'free-space-slots') {
                        let currentRotation = parseInt(imgElement.dataset.rotation) || 0;
                        
                        if (currentRotation === 0) {
                            currentRotation = 90;
                            slotElement.classList.add('rotated-90');
                            const { width, height } = getCardDimensions();
                            const scaleFactor = height / width;
                            img.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;
                            
                            if (baseParentZoneId.startsWith('mana')) {
                                playSe('マナ増加.mp3');
                                if (typeof autoConfig !== 'undefined' && autoConfig.autoManaTap) {
                                    const manaInput = document.getElementById(idPrefix + 'mana-counter-value');
                                    if (manaInput) {
                                        const newVal = (parseInt(manaInput.value) || 0) + 1;
                                        manaInput.value = newVal;
                                        if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                                            recordAction({
                                                type: 'counterChange',
                                                inputId: idPrefix + 'mana-counter-value',
                                                change: 1
                                            });
                                        }
                                    }
                                }
                            } else {
                                playSe('タップ.mp3');
                            }
                        } else {
                            currentRotation = 0;
                            slotElement.classList.remove('rotated-90');
                            imgElement.style.transform = `rotate(${currentRotation}deg)`;
                            if (!baseParentZoneId.startsWith('mana')) playSe('タップ.mp3');
                        }
                        imgElement.dataset.rotation = currentRotation;
                        
                        if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                            recordAction({
                                type: 'rotate',
                                zoneId: parentZoneId,
                                slotIndex: Array.from(slot.parentNode.children).indexOf(slotElement),
                                rotation: currentRotation
                            });
                        }
                    }
                });
            }
            if (lowerKey === conf.flip.toLowerCase()) {
                if (typeof flipCard === 'function') {
                    if (typeof saveStateForUndo === 'function') saveStateForUndo();
                    targets.forEach(card => {
                        const zoneId = getParentZoneId(card.parentNode);
                        const prefix = getPrefixFromZoneId(zoneId);
                        flipCard(card, prefix, true); 
                    });
                }
            }
            if (lowerKey === conf.toGrave.toLowerCase() || key === 'Delete') {
                if (typeof moveCardToMultiZone === 'function') {
                    if (typeof saveStateForUndo === 'function') saveStateForUndo();
                    const targetsCopy = [...targets];
                    targetsCopy.forEach(card => {
                        moveCardToMultiZone(card, 'grave'); 
                    });
                    
                    if (typeof selectedCards !== 'undefined') {
                        selectedCards = [];
                        document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));
                    }
                }
            }
            if (lowerKey === conf.memo.toLowerCase()) {
                const target = (targets.length === 1) ? targets[0] : (lastHoveredElement || targets[0]);
                if (target) {
                    currentMemoTarget = target;
                    if (memoTextarea) {
                        memoTextarea.value = target.dataset.memo || '';
                        if (typeof openMemoEditor === 'function') openMemoEditor();
                    }
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        const isCard = e.target.closest('.thumbnail');
        const isCtrl = e.ctrlKey || e.metaKey;
        
        if (currentFocusElement) {
            currentFocusElement.classList.remove('keyboard-focus');
            currentFocusElement = null;
        }
        
        const isControl = e.target.closest('.counter-btn') || 
                          e.target.closest('.draw-btn') || 
                          e.target.closest('.drawer-toggle') ||
                          e.target.closest('.modal') || 
                          e.target.closest('#custom-context-menu') ||
                          e.target.closest('.drawer-search-sort-container') ||
                          e.target.closest('#timer-pause-btn') ||
                          e.target.closest('#download-log-btn') ||
                          e.target.closest('.deck-case-name-input') || 
                          e.target.closest('.deck-storage-btn') ||
                          e.target.closest('.deck-case-delete');

        if (!isCard && !isCtrl && !isControl) {
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0) {
                selectedCards.forEach(card => card.classList.remove('selected-card'));
                selectedCards = [];
            }
        }
        
        if (typeof isFileDialogOpen !== 'undefined' && isFileDialogOpen) return;
        if (typeof isResizingDrawer !== 'undefined' && isResizingDrawer) return;
        
        if (contextMenu && contextMenu.style.display === 'block' && !e.target.closest('#custom-context-menu')) {
            if (typeof closeContextMenu === 'function') closeContextMenu();
        }
        
        const isInteractionTarget = 
            e.target.closest('#custom-context-menu') ||
            (memoEditorModal && memoEditorModal.style.display === 'flex' && e.target.closest('.memo-editor-modal')) || 
            (flavorEditorModal && flavorEditorModal.style.display === 'block' && e.target.closest('.flavor-editor-modal')) ||
            (customCounterModal && customCounterModal.style.display === 'block' && e.target.closest('.custom-counter-modal')) ||
            (decorationSettingsModal && decorationSettingsModal.style.display === 'flex' && e.target.closest('.custom-counter-modal')) || 
            (battleConfirmModal && battleConfirmModal.style.display === 'flex' && e.target.closest('.custom-counter-modal')) ||
            (gameResultOverlay && gameResultOverlay.style.display === 'flex' && e.target.closest('.game-result-content')) ||
            e.target.closest('.drawer-toggle') ||
            e.target.closest('#system-modal');

        if (isInteractionTarget) return;

        if (typeof closeContextMenu === 'function') closeContextMenu();

        const clickedInsideCommon = e.target.closest('#common-drawer');
        if (commonDrawer && commonDrawer.classList.contains('open') && !clickedInsideCommon) commonDrawer.classList.remove('open');

        if (decorationSettingsModal && decorationSettingsModal.style.display === 'flex' && e.target === decorationSettingsModal) {
            if (typeof closeDecorationSettingsModal === 'function') closeDecorationSettingsModal();
        }

        const clickedInsideSideDrawers = e.target.closest('#player-drawer') || 
                                         e.target.closest('#opponent-drawer') || 
                                         e.target.closest('#c-drawer');

        if (!clickedInsideCommon) { 
            const playerDrawer = document.getElementById('player-drawer');
            if (playerDrawer && playerDrawer.classList.contains('open') && !clickedInsideSideDrawers) playerDrawer.classList.remove('open');

            const opponentDrawer = document.getElementById('opponent-drawer');
            if (opponentDrawer && opponentDrawer.classList.contains('open') && !clickedInsideSideDrawers) opponentDrawer.classList.remove('open');
            
            const cDrawer = document.getElementById('c-drawer');
            if (cDrawer && cDrawer.classList.contains('open') && !clickedInsideSideDrawers) cDrawer.classList.remove('open');
        }
    });

    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    if (downloadLogBtn) {
        downloadLogBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof downloadActionLog === 'function') downloadActionLog();
        });
    }

    if (diceRollBtn) {
        diceRollBtn.addEventListener('click', () => {
            playSe('サイコロ.mp3');
            const result = Math.floor(Math.random() * 6) + 1;
            randomResultDisplay.textContent = `ダイス: ${result}`;
            if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({ type: 'dice', result: result });
            }
        });
    }

    if (coinTossBtn) {
        coinTossBtn.addEventListener('click', () => {
            playSe('コイントス.mp3');
            const result = Math.random() < 0.5 ? 'ウラ' : 'オモテ';
            randomResultDisplay.textContent = `コイン: ${result}`;
            if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                recordAction({ type: 'coin', result: result });
            }
        });
    }

    if (commonDrawerToggle) {
        commonDrawerToggle.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            commonDrawer.classList.toggle('open');
        });
    }
    if (cDrawerToggle) {
        cDrawerToggle.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            cDrawer.classList.toggle('open');
        });
    }

    if (commonFlipBoardBtn) {
        commonFlipBoardBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            document.body.classList.toggle('board-flipped');
            document.getElementById('player-drawer')?.classList.remove('open');
            document.getElementById('opponent-drawer')?.classList.remove('open');
        });
    }

    if (commonDecorationSettingsBtn) {
        commonDecorationSettingsBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if(typeof openDecorationSettingsModal === 'function') openDecorationSettingsModal();
        });
    }

    if (commonToggleNavBtn) {
        commonToggleNavBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            const isHidden = document.body.classList.toggle('nav-hidden');
            commonToggleNavBtn.textContent = isHidden ? 'ナビ再表示' : 'ナビ非表示';
        });
    }

    if (commonExportBoardBtn) {
        commonExportBoardBtn.addEventListener('click', async () => {
            playSe('ボタン共通.mp3');
            const defaultName = "sm_solitaire_board";
            const fileName = typeof showCustomPrompt === 'function' 
                ? await showCustomPrompt("保存するファイル名を入力してください", defaultName)
                : prompt("保存するファイル名を入力してください", defaultName);
            
            if (fileName) {
                 if (typeof exportAllBoardData === 'function') exportAllBoardData(fileName);
            }
        });
    }
    if (commonImportBoardBtn) {
        commonImportBoardBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof importAllBoardData === 'function') importAllBoardData();
        });
    }

    if (recordStartBtn) {
        recordStartBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof startReplayRecording === 'function') startReplayRecording();
        });
    }
    if (recordStopBtn) {
        recordStopBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof stopReplayRecording === 'function') stopReplayRecording();
        });
    }
    if (replayPlayBtn) {
        replayPlayBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof isReplayPaused !== 'undefined' && isReplayPaused) {
                if (typeof resumeReplay === 'function') resumeReplay();
            } else {
                if (typeof playReplay === 'function') playReplay();
            }
        });
    }
    if (replayPauseBtn) {
        replayPauseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof pauseReplay === 'function') pauseReplay();
        });
    }
    if (replayStopBtn) {
        replayStopBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof stopReplay === 'function') stopReplay();
        });
    }
    if (loadReplayBtn) {
        loadReplayBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof importReplayData === 'function') importReplayData();
        });
    }

    if (bgmSelect && typeof bgmFileList !== 'undefined') {
        bgmFileList.forEach(filename => {
            const option = document.createElement('option');
            option.value = filename;
            option.textContent = filename;
            bgmSelect.appendChild(option);
        });
    }
    if (bgmPlayBtn) {
        bgmPlayBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (bgmSelect) {
                const filename = bgmSelect.value;
                if (filename && typeof playBgm === 'function') {
                    playBgm(filename);
                }
            }
        });
    }
    if (bgmPauseBtn) {
        bgmPauseBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof pauseBgm === 'function') pauseBgm();
        });
    }
    if (bgmStopBtn) {
        bgmStopBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof stopBgm === 'function') stopBgm();
        });
    }
    if (bgmVolumeSlider) {
        bgmVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            bgmVolumeVal.textContent = val;
            if (typeof bgmVolume !== 'undefined') bgmVolume = val; 
            if (typeof updateBgmVolume === 'function') updateBgmVolume();
        });
    }
    if (seVolumeSlider) {
        seVolumeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            seVolumeVal.textContent = val;
            if (typeof seVolume !== 'undefined') seVolume = val; 
        });
    }

    if (shuffleHandBtn) {
        shuffleHandBtn.addEventListener('click', () => {
            playSe('シャッフル.mp3');
            if (typeof shuffleHand === 'function') shuffleHand('');
        });
    }
    if (opponentShuffleHandBtn) {
        opponentShuffleHandBtn.addEventListener('click', () => {
            playSe('シャッフル.mp3');
            if (typeof shuffleHand === 'function') shuffleHand('opponent-');
        });
    }

    const openSystemDrawer = (e) => {
        e.stopPropagation();
        if (commonDrawer.classList.contains('open')) {
            commonDrawer.classList.remove('open');
        } else {
            playSe('ボタン共通.mp3'); 
            commonDrawer.classList.add('open');
            if(typeof activateDrawerTab === 'function') activateDrawerTab('common-spec-panel', commonDrawer);
        }
    };
    if (systemBtn) systemBtn.addEventListener('click', openSystemDrawer);
    if (opponentSystemBtn) opponentSystemBtn.addEventListener('click', openSystemDrawer);

    const allDrawerTabs = document.querySelectorAll('.drawer-tab-btn');
    allDrawerTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            const targetId = tab.dataset.target;
            const drawer = tab.closest('.drawer-wrapper');
            if(typeof activateDrawerTab === 'function') activateDrawerTab(targetId, drawer);
        });
    });

    const openPlayerDrawerBtn = document.getElementById('common-open-player-drawer');
    const openOpponentDrawerBtn = document.getElementById('common-open-opponent-drawer');
    const openBankDrawerBtn = document.getElementById('common-open-bank-drawer');

    const toggleDrawerWithTab = (drawerId, tabId) => {
        const drawer = document.getElementById(drawerId);
        if (drawer) {
            const activePanel = drawer.querySelector('.drawer-panel.active');
            if (drawer.classList.contains('open') && activePanel && activePanel.id === tabId) {
                drawer.classList.remove('open');
            } else {
                drawer.classList.add('open');
                if(typeof activateDrawerTab === 'function') activateDrawerTab(tabId, drawer);
            }
        }
    };

    if (openPlayerDrawerBtn) {
        openPlayerDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSe('ボタン共通.mp3');
            toggleDrawerWithTab('player-drawer', 'deck-back-slots');
        });
    }
    if (openOpponentDrawerBtn) {
        openOpponentDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSe('ボタン共通.mp3');
            toggleDrawerWithTab('opponent-drawer', 'opponent-deck-back-slots');
        });
    }
    if (openBankDrawerBtn) {
        openBankDrawerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSe('ボタン共通.mp3');
            toggleDrawerWithTab('c-drawer', 'c-bank-panel');
        });
    }
    
    if (cSearchFilter) {
        cSearchFilter.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const container = document.getElementById('c-free-space');
            if (!container) return;
            const thumbnails = container.querySelectorAll('.thumbnail');
            thumbnails.forEach(thumb => {
                const memo = (thumb.dataset.memo || '').toLowerCase();
                const slot = thumb.closest('.card-slot');
                if (slot) {
                    if (memo.includes(query)) {
                        slot.style.display = ''; 
                    } else {
                        slot.style.display = 'none';
                    }
                }
            });
            if (!query) {
                 const allSlots = container.querySelectorAll('.card-slot');
                 allSlots.forEach(s => s.style.display = '');
            }
        });
    }

    const extraTexts = document.querySelectorAll('.extra-text');
    extraTexts.forEach(el => {
        el.addEventListener('input', () => { if(typeof adjustFontSize === 'function') adjustFontSize(el); });
        if(typeof adjustFontSize === 'function') adjustFontSize(el); 
    });

    if(typeof activateDrawerTab === 'function') {
        const playerDrawer = document.getElementById('player-drawer');
        if (playerDrawer) activateDrawerTab('deck-back-slots', playerDrawer);
        const opponentDrawer = document.getElementById('opponent-drawer');
        if (opponentDrawer) activateDrawerTab('opponent-deck-back-slots', opponentDrawer);

        if (commonDrawer) activateDrawerTab('common-general-panel', commonDrawer);
        if (cDrawer) activateDrawerTab('c-bank-panel', cDrawer);
    }
    
    const commonDrawerHeader = document.getElementById('common-drawer-header');
    if (commonDrawer && commonDrawerHeader) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        commonDrawerHeader.addEventListener("mousedown", dragStart);
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", drag);

        function dragStart(e) {
            if (e.target.classList.contains('resize-handle') || (typeof isResizingDrawer !== 'undefined' && isResizingDrawer)) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === commonDrawerHeader || e.target.parentNode === commonDrawerHeader) {
                isDragging = true;
                e.preventDefault(); 
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                let newX = e.clientX - initialX;
                let newY = e.clientY - initialY;

                const drawerWidth = commonDrawer.offsetWidth;
                const drawerHeight = commonDrawer.offsetHeight;
                const vw = window.innerWidth;
                const vh = window.innerHeight;

                const limitX = Math.max(0, (vw - drawerWidth) / 2);
                const limitY = Math.max(0, (vh - drawerHeight) / 2);

                if (newX < -limitX) newX = -limitX;
                if (newX > limitX) newX = limitX;
                
                if (newY < -limitY) newY = -limitY;
                if (newY > limitY) newY = limitY;

                currentX = newX;
                currentY = newY;

                xOffset = currentX;
                yOffset = currentY;

                commonDrawer.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
            }
        }
        
        const closeHint = commonDrawerHeader.querySelector('.drawer-close-hint');
        if(closeHint) {
            closeHint.addEventListener('click', (e) => {
                e.stopPropagation();
                playSe('ボタン共通.mp3');
                commonDrawer.classList.remove('open');
            });
        }
    }
};

function initKeyConfigUI() {
    const container = document.getElementById('key-config-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const keyLabels = {
        'toggleDrawer': 'ドロワー開閉',
        'toggleCommon': '共通メニュー開閉',
        'toggleBank': 'バンク開閉',
        'draw': '1ドロー',
        'stepForward': 'ステップ進行',
        'tap': 'タップ',
        'flip': '反転',
        'toGrave': '墓地へ',
        'memo': 'メモ編集',
        'toggleNav': 'ナビ切替',
        'flipBoard': '盤面反転',
        'undo': '元に戻す',
        'redo': 'やり直し',
        
        'phaseStart': 'ターン開始',
        'phaseDraw': 'ドローステップ',
        'phaseMana': 'マナステップ',
        'phaseMain': 'メインステップ',
        'phaseBattle': 'バトルステップ',
        'phaseEnd': 'エンドステップ',
        'turnChange': 'ターンプレイヤー切替',
        'openDeck': 'デッキを開く',
        'openGrave': '墓地を開く',
        'openExclude': '除外を開く',
        'openSideDeck': 'EXデッキを開く',
        'openBank': 'バンクを開く',
        'rollDice': 'ダイスロール',
        'tossCoin': 'コイントス'
    };

    if (typeof keyConfig !== 'undefined') {
        Object.keys(keyConfig).forEach(action => {
            const label = keyLabels[action] || action;
            const item = createKeyConfigItem(action, label, keyConfig[action]);
            container.appendChild(item);
        });
    }
}

function createKeyConfigItem(action, label, currentKey) {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.justifyContent = 'space-between';
    div.style.alignItems = 'center';
    div.style.marginBottom = '5px';
    div.style.borderBottom = '1px solid #555';
    div.style.paddingBottom = '2px';

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontSize = '0.9em';
    labelSpan.style.color = '#ccc';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentKey;
    input.style.width = '60px';
    input.style.textAlign = 'center';
    input.style.backgroundColor = '#444';
    input.style.color = '#fff';
    input.style.border = '1px solid #666';
    input.style.borderRadius = '3px';
    input.readOnly = true;
    input.style.cursor = 'pointer';

    input.addEventListener('click', () => {
        input.value = 'Press...';
        input.style.backgroundColor = '#ffcc00';
        input.style.color = '#333';
        
        const keyHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            let newKey = e.key;
            if (newKey === ' ') newKey = 'Space';
            
            updateKeyConfig(action, newKey);
            input.value = newKey;
            
            input.style.backgroundColor = '#444';
            input.style.color = '#fff';
            document.removeEventListener('keydown', keyHandler);
        };
        document.addEventListener('keydown', keyHandler, { once: true });
    });

    div.appendChild(labelSpan);
    div.appendChild(input);
    return div;
}

function updateKeyConfig(action, newKey) {
    if (typeof keyConfig !== 'undefined') {
        keyConfig[action] = newKey;
    }
}

window.updateSettingsUIFromState = function() {
    if (bgmVolumeSlider && bgmVolumeVal && typeof bgmVolume !== 'undefined') {
        bgmVolumeSlider.value = bgmVolume;
        bgmVolumeVal.textContent = bgmVolume;
    }
    if (seVolumeSlider && seVolumeVal && typeof seVolume !== 'undefined') {
        seVolumeSlider.value = seVolume;
        seVolumeVal.textContent = seVolume;
    }
    
    const seContainer = document.getElementById('se-settings-container');
    if (seContainer && typeof seConfig !== 'undefined') {
        const checkboxes = seContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const seName = box.dataset.seName;
            if (seName && typeof seConfig[seName] !== 'undefined') {
                box.checked = seConfig[seName];
            }
        });
    }
    
    const effectContainer = document.getElementById('effect-settings-container');
    if (effectContainer && typeof effectConfig !== 'undefined') {
        const checkboxes = effectContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const key = box.dataset.effectKey;
            if (key && typeof effectConfig[key] !== 'undefined') {
                box.checked = effectConfig[key];
            }
        });
    }

    const autoContainer = document.getElementById('auto-config-container');
    if (autoContainer && typeof autoConfig !== 'undefined') {
        const checkboxes = autoContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(box => {
            const key = box.dataset.autoKey;
            if (key && typeof autoConfig[key] !== 'undefined') {
                box.checked = autoConfig[key];
                if (key === 'hideOpponentHand') {
                    if (autoConfig[key]) document.body.classList.add('hide-hand-enabled');
                    else document.body.classList.remove('hide-hand-enabled');
                }
            }
        });
    }
};