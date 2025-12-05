async function extractCardDataFromPng(file) {
    if (!file) return null;
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const textChunk = findPngChunk(bytes, 'tEXt');
        if (!textChunk) return null;

        const decoder = new TextDecoder('utf-8');
        const chunkText = decoder.decode(textChunk);

        const separatorIndex = chunkText.indexOf('\0');
        if (separatorIndex === -1) return null;

        const key = chunkText.substring(0, separatorIndex);
        const value = chunkText.substring(separatorIndex + 1);

        if (key === 'smCardData') {
            return JSON.parse(value);
        }

        return null;
    } catch (e) {
        console.error("PNGメタデータの解析に失敗しました:", e);
        return null;
    }
}

function findPngChunk(bytes, type) {
    let offset = 8;
    
    while (offset < bytes.length) {
        const view = new DataView(bytes.buffer);
        const length = view.getUint32(offset, false);
        const chunkType = String.fromCharCode.apply(null, bytes.subarray(offset + 4, offset + 8));

        if (chunkType === type) {
            return bytes.subarray(offset + 8, offset + 8 + length);
        }
        
        offset += 12 + length;
    }
    
    return null;
}


const DEFAULT_CARD_MEMO = `[カード名:-]/#e0e0e0/#555/1.0/非表示/
[属性:-]/#e0e0e0/#555/1.0/非表示/
[マナ:-]/#e0e0e0/#555/1.0/非表示/
[BP:-]/#e0e0e0/#555/1.0/非表示/
[スペル:-]/#e0e0e0/#555/1.0/非表示/
[フレーバーテキスト:-]/#fff/#555/1.0/非表示/
[効果:-]/#e0e0e0/#555/0.7/非表示/`;

function tryResetStatusOnMove(card, targetBaseId) {
    const leaveZones = [
        'hand-zone', 
        'deck', 'deck-back-slots', 
        'grave', 'grave-back-slots', 
        'exclude', 'exclude-back-slots', 
        'side-deck', 'side-deck-back-slots', 
        'c-free-space',
        'token-zone-slots'
    ];

    if (leaveZones.includes(targetBaseId) || targetBaseId.endsWith('-back-slots')) {
        if (typeof autoConfig !== 'undefined' && autoConfig.autoResetBpOnLeave) {
            if (typeof window.resetCardBP === 'function') {
                window.resetCardBP(card, true); 
            }
        }
        delete card.dataset.isPermanent;
    }
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

async function handleManaConsumption(memo, idPrefix) {
    if (typeof autoConfig === 'undefined' || !autoConfig.autoManaCost) return true; 
    if (!memo) return true;

    const match = memo.match(/\[マナ:([0-9]+)\]/);
    if (!match) return true;

    const cost = parseInt(match[1]);
    if (cost <= 0) return true;

    const manaInput = document.getElementById(idPrefix + 'mana-counter-value');
    const currentMana = manaInput ? (parseInt(manaInput.value) || 0) : 0;

    if (cost > currentMana) {
        if (autoConfig.warnManaCost) {
            return await showCustomConfirm(`マナが足りません（コスト:${cost} / 現在:${currentMana}）。\nマナを消費せずに配置しますか？`);
        } else {
            return true;
        }
    }

    if (autoConfig.warnManaCost) {
        const consumeConfirm = await showCustomConfirm(`マナを消費して配置しますか？\n(消費マナ: ${cost})`);
        if (consumeConfirm) {
            if (manaInput) {
                manaInput.value = currentMana - cost;
                if (typeof recordAction === 'function') {
                    recordAction({
                        type: 'counterChange',
                        inputId: idPrefix + 'mana-counter-value',
                        change: -cost
                    });
                }
            }
            return true;
        } 
        else {
            return await showCustomConfirm("マナを消費せずに配置しますか？");
        }
    } else {
        if (manaInput) {
            manaInput.value = currentMana - cost;
            if (typeof recordAction === 'function') {
                recordAction({
                    type: 'counterChange',
                    inputId: idPrefix + 'mana-counter-value',
                    change: -cost
                });
            }
        }
        return true;
    }
}

function tryAutoManaTapIn(slotElement, idPrefix, zoneId) {
    if (typeof autoConfig === 'undefined' || !autoConfig.autoManaTapInZone) return;
    
    const card = slotElement.querySelector('.thumbnail');
    if (!card) return;
    
    const img = card.querySelector('.card-image');
    if (!img) return;

    const currentRotation = parseInt(img.dataset.rotation) || 0;
    if (currentRotation === 0) {
        const newRotation = 90;
        slotElement.classList.add('rotated-90');
        const { width, height } = getCardDimensions();
        const scaleFactor = height / width;
        img.style.transform = `rotate(${newRotation}deg) scale(${scaleFactor})`;
        img.dataset.rotation = newRotation;
        
        if (typeof recordAction === 'function') {
            recordAction({
                type: 'rotate',
                zoneId: zoneId,
                slotIndex: Array.from(slot.parentNode.children).indexOf(slotElement),
                rotation: newRotation
            });
        }
    }
}

async function checkMainPhaseWarning(targetBaseId) {
    const fieldZones = ['battle', 'special1', 'special2', 'spell', 'extra-image-zone'];
    
    if (fieldZones.some(z => targetBaseId.includes(z))) {
        if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
            if (typeof autoConfig !== 'undefined' && autoConfig.warnFieldPlacementPhase) {
                return await showCustomConfirm("メインステップではありません。カードを配置しますか？");
            }
        }
    }
    return true;
}

function addSlotEventListeners(slot) {
    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('dragleave', handleDragLeave);
    slot.addEventListener('drop', handleDropOnSlot);
    slot.addEventListener('click', handleSlotClick);
    slot.addEventListener('contextmenu', handleSlotContextMenu);
}

function handleSlotContextMenu(e) {
    if (typeof isBattleTargetMode !== 'undefined' && isBattleTargetMode) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    
    const slot = e.currentTarget;
    if (slot.querySelector('.thumbnail')) return;

    const zoneId = getParentZoneId(slot);
    const baseZoneId = getBaseId(zoneId);
    const isDecorationZone = ['deck', 'grave', 'exclude', 'side-deck', 'icon-zone'].includes(baseZoneId);

    e.preventDefault();
    e.stopPropagation();

    if (typeof contextMenu === 'undefined') return;

    Array.from(contextMenu.querySelectorAll('li')).forEach(li => li.style.display = 'none');
    
    const topItems = contextMenu.querySelectorAll('#custom-context-menu > ul > li');
    topItems.forEach(li => li.style.display = 'none');

    if (isDecorationZone) {
        const changeStyleItem = document.getElementById('context-menu-change-style');
        if (changeStyleItem) changeStyleItem.style.display = 'block';
    } else {
        const importItem = document.getElementById('context-menu-import');
        if (importItem) {
            importItem.style.display = 'block';
            currentImportCardHandler = () => importCardToSlot(slot);
        }
    }

    contextMenu.style.display = 'block';
    contextMenu.style.visibility = 'hidden';
    
    const submenus = contextMenu.querySelectorAll('.submenu');
    submenus.forEach(sub => sub.classList.remove('open-left', 'open-top'));

    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = e.pageX;
    let top = e.pageY;

    if (left + menuWidth > windowWidth) {
        left -= menuWidth;
    }

    if (top + menuHeight > windowHeight) {
        top -= menuHeight;
    }

    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.visibility = 'visible';
    
    lastRightClickedElement = slot;
}

function importCardToSlot(slot) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json, application/json';
    fileInput.style.display = 'none';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const cardData = JSON.parse(event.target.result);
                const zoneId = getParentZoneId(slot);
                const idPrefix = getPrefixFromZoneId(zoneId);
                const baseZoneId = getBaseId(zoneId);
                const owner = (baseZoneId === 'c-free-space') ? '' : idPrefix;

                if (!await checkMainPhaseWarning(baseZoneId)) return;

                if (baseZoneId.startsWith('mana')) {
                    if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
                        if (typeof autoConfig !== 'undefined' && autoConfig.warnManaPlacementPhase) {
                            if (!await showCustomConfirm('現在メインステップではありません。マナエリアにカードを配置しますか？')) {
                                return;
                            }
                        }
                    }
                    if (typeof manaPlacedThisTurn !== 'undefined' && manaPlacedThisTurn) {
                        if (typeof autoConfig !== 'undefined' && autoConfig.limitManaPlacement) {
                            if (!await showCustomConfirm('今ターン既にマナを配置済みです。さらに配置しますか？')) {
                                return;
                            }
                        }
                    }
                }

                const targetZonesForCost = ['special1', 'battle', 'special2', 'spell']; 
                if (targetZonesForCost.some(z => baseZoneId.includes(z))) {
                    if (!await handleManaConsumption(cardData.memo, idPrefix)) return;
                }
                
                if (typeof saveStateForUndo === 'function') saveStateForUndo(); 
                
                cardData.ownerPrefix = owner;
                
                const currentTurnVal = document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1";
                cardData.deployedTurn = currentTurnVal;
                
                const thumb = createCardThumbnail(cardData, slot, false, false, owner);
                
                if (baseZoneId === 'extra-image-zone') {
                    thumb.dataset.timestamp = Date.now();
                }

                updateSlotStackState(slot);
                
                const isMana = baseZoneId.startsWith('mana');
                if (isMana) {
                    playSe('マナ配置.mp3');
                    if (autoConfig.autoManaPlacement) {
                        const manaInput = document.getElementById(idPrefix + 'mana-counter-value');
                        if (manaInput) {
                            manaInput.value = parseInt(manaInput.value || 0) + 1;
                            if (typeof recordAction === 'function') {
                                recordAction({
                                    type: 'counterChange',
                                    inputId: idPrefix + 'mana-counter-value',
                                    change: 1
                                });
                            }
                        }
                    }
                    tryAutoManaTapIn(slot, idPrefix, zoneId);
                    
                    if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = true;
                } else {
                    playPlacementSe(baseZoneId);
                }
                
                if (typeof recordAction === 'function') {
                    recordAction({
                        type: 'newCard',
                        zoneId: zoneId,
                        slotIndex: Array.from(slot.parentNode.children).indexOf(slot),
                        cardData: cardData
                    });
                }
                
                if (zoneId.endsWith('-back-slots') || baseZoneId === 'c-free-space') {
                    arrangeSlots(zoneId);
                }

                if (typeof window.updatePlaymatState === 'function') {
                    window.updatePlaymatState();
                }
                if (typeof window.updateSummoningSicknessVisuals === 'function') {
                    window.updateSummoningSicknessVisuals();
                }
                
            } catch (err) {
                console.error("Import failed:", err);
                await showCustomAlert("カードの読み込みに失敗しました。");
            }
        };
        reader.readAsText(file);
    };
    
    document.body.appendChild(fileInput);
    isFileDialogOpen = true;
    fileInput.click();
    document.body.removeChild(fileInput);
    setTimeout(() => { isFileDialogOpen = false; }, 100);
}

function handleSlotClick(e) {
    const slot = e.currentTarget;
    
    if (typeof isBattleTargetMode !== 'undefined' && isBattleTargetMode) {
        e.stopPropagation();
        
        const isPlayerIcon = slot.id === 'icon-zone' || slot.id === 'opponent-icon-zone';
        const hasCard = slot.querySelector('.thumbnail');

        if (hasCard || isPlayerIcon) {
            if (typeof openBattleConfirmModal === 'function') {
                openBattleConfirmModal(currentAttackers, slot);
            }
        }
        return;
    }

    const parentZoneId = getParentZoneId(slot);
    const baseParentZoneId = getBaseId(parentZoneId);

    const drawerOpeningZones = ['deck', 'grave', 'exclude', 'side-deck'];
    
    if (drawerOpeningZones.includes(baseParentZoneId)) {
        return;
    }

    if (memoEditorModal.style.display === 'flex' || contextMenu.style.display === 'block' || flavorEditorModal.style.display === 'block') {
        return;
    }

    if (slot.querySelector('.thumbnail')) {
        return;
    }

    const allowedZonesForNormalModeFileDrop = [
        'hand-zone', 'battle', 'spell', 'special1', 'special2', 'free-space-slots',
        'deck-back-slots', 'grave-back-slots', 'exclude-back-slots', 'side-deck-back-slots', 'token-zone-slots',
        'c-free-space', 'extra-image-zone'
    ];

    if (allowedZonesForNormalModeFileDrop.includes(baseParentZoneId) || (baseParentZoneId && baseParentZoneId.startsWith('mana'))) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        document.body.appendChild(fileInput);

        fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
                return;
            }
            const reader = new FileReader();
            reader.onload = async (readEvent) => {
                try {
                    const idPrefix = getPrefixFromZoneId(getParentZoneId(slot));
                    
                    if (!await checkMainPhaseWarning(baseParentZoneId)) return;

                    if (baseParentZoneId.startsWith('mana')) {
                        if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
                            if (typeof autoConfig !== 'undefined' && autoConfig.warnManaPlacementPhase) {
                                if (!await showCustomConfirm('現在メインステップではありません。マナエリアにカードを配置しますか？')) {
                                    return;
                                }
                            }
                        }
                        if (typeof manaPlacedThisTurn !== 'undefined' && manaPlacedThisTurn) {
                            if (typeof autoConfig !== 'undefined' && autoConfig.limitManaPlacement) {
                                if (!await showCustomConfirm('今ターン既にマナを配置済みです。さらに配置しますか？')) {
                                    return;
                                }
                            }
                        }
                    }

                    const targetZonesForCost = ['special1', 'battle', 'special2', 'spell']; 
                    const isTargetZone = targetZonesForCost.some(z => baseParentZoneId.includes(z));
                    
                    if (isTargetZone) {
                        if (!await handleManaConsumption(DEFAULT_CARD_MEMO, idPrefix)) return;
                    }

                    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

                    const imageData = readEvent.target.result;
                    const owner = (baseParentZoneId === 'c-free-space') ? '' : idPrefix;
                    
                    const currentTurnVal = document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1";

                    let rotation = 0;
                    if (baseParentZoneId === 'extra-image-zone') {
                        const tempImg = new Image();
                        await new Promise(r => {
                            tempImg.onload = r;
                            tempImg.onerror = r;
                            tempImg.src = imageData;
                        });
                        if (tempImg.height > tempImg.width) {
                            rotation = 90;
                        }
                    }

                    const thumb = createCardThumbnail({
                        src: imageData,
                        memo: DEFAULT_CARD_MEMO,
                        ownerPrefix: owner,
                        deployedTurn: currentTurnVal,
                        rotation: rotation
                    }, slot, false, false, owner);
                    
                    if (baseParentZoneId === 'extra-image-zone') {
                        thumb.dataset.timestamp = Date.now();
                    }
                    
                    if (baseParentZoneId === 'c-free-space') {
                        if (thumb) delete thumb.dataset.ownerPrefix;
                    }

                    updateSlotStackState(slot);
                    
                    const isMana = baseParentZoneId.startsWith('mana');
                    if (isMana) {
                        playSe('マナ配置.mp3');
                        if (autoConfig.autoManaPlacement) {
                            const manaInput = document.getElementById(idPrefix + 'mana-counter-value');
                            if (manaInput) {
                                manaInput.value = parseInt(manaInput.value || 0) + 1;
                                if (typeof recordAction === 'function') {
                                    recordAction({
                                        type: 'counterChange',
                                        inputId: idPrefix + 'mana-counter-value',
                                        change: 1
                                    });
                                }
                            }
                        }
                        tryAutoManaTapIn(slot, idPrefix, parentZoneId);
                        
                        if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = true;
                    } else {
                        playPlacementSe(baseParentZoneId);
                    }

                    if (typeof recordAction === 'function') {
                        recordAction({
                            type: 'newCard',
                            zoneId: getParentZoneId(slot),
                            slotIndex: Array.from(slot.parentNode.children).indexOf(slot),
                            cardData: {
                                src: imageData,
                                memo: DEFAULT_CARD_MEMO,
                                rotation: rotation
                            }
                        });
                    }

                    if (typeof window.updatePlaymatState === 'function') {
                        window.updatePlaymatState();
                    }
                    if (typeof window.updateSummoningSicknessVisuals === 'function') {
                        window.updateSummoningSicknessVisuals();
                    }
                } catch (error) {
                    console.error("File read failed:", error);
                } finally {
                     if (document.body.contains(fileInput)) {
                        document.body.removeChild(fileInput);
                    }
                }
            };
            reader.readAsDataURL(file);
        };
        
        isFileDialogOpen = true;
        fileInput.click();
        setTimeout(() => { isFileDialogOpen = false; }, 100);

        e.stopPropagation();
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
        e.dataTransfer.dropEffect = 'copy';
    } else {
        e.dataTransfer.dropEffect = 'move';
    }
    
    const slot = e.currentTarget;
    const parentZoneId = getParentZoneId(slot);
    const baseParentZoneId = getBaseId(parentZoneId);
    
    let tooltip = document.getElementById('cost-warning-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'cost-warning-tooltip';
        tooltip.className = 'memo-tooltip'; 
        document.body.appendChild(tooltip);
    }

    if (baseParentZoneId.startsWith('mana')) {
        slot.classList.add('cost-ok-active');
        slot.classList.remove('cost-warning-active');
        tooltip.style.display = 'none';
    } else {
        const targetZonesForCost = ['special1', 'battle', 'special2', 'spell'];
        const isTargetZone = targetZonesForCost.some(z => baseParentZoneId.includes(z));
        
        if (isTargetZone && draggedItem) {
            const idPrefix = getPrefixFromZoneId(parentZoneId);
            const memo = draggedItem.dataset.memo || '';
            const match = memo.match(/\[マナ:([0-9]+)\]/);
            
            if (match) {
                const cost = parseInt(match[1]);
                const currentManaInput = document.getElementById(idPrefix + 'mana-counter-value');
                const currentMana = currentManaInput ? (parseInt(currentManaInput.value) || 0) : 0;
                
                const sourceSlot = draggedItem.parentNode;
                const sourceZoneId = getParentZoneId(sourceSlot);
                const sourceBaseZoneId = getBaseId(sourceZoneId);
                const costSourceZones = ['hand-zone', 'deck', 'deck-back-slots', 'grave', 'grave-back-slots', 'exclude', 'exclude-back-slots', 'side-deck', 'side-deck-back-slots'];
                
                if (costSourceZones.includes(sourceBaseZoneId)) {
                    if (cost > currentMana) {
                        slot.classList.add('cost-warning-active');
                        slot.classList.remove('cost-ok-active');
                        
                        tooltip.textContent = `マナ不足 (${cost}/${currentMana})`;
                        tooltip.style.color = '#ff4444';
                        tooltip.style.borderColor = '#ff4444';
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.pageX + 15) + 'px';
                        tooltip.style.top = (e.pageY + 15) + 'px';
                        tooltip.style.zIndex = 10000;
                    } else {
                        slot.classList.add('cost-ok-active');
                        slot.classList.remove('cost-warning-active');
                        
                        if(cost > 0) {
                            tooltip.textContent = `消費マナ: ${cost}`;
                            tooltip.style.color = '#44ff44';
                            tooltip.style.borderColor = '#44ff44';
                            tooltip.style.display = 'block';
                            tooltip.style.left = (e.pageX + 15) + 'px';
                            tooltip.style.top = (e.pageY + 15) + 'px';
                            tooltip.style.zIndex = 10000;
                        } else {
                            tooltip.style.display = 'none';
                        }
                    }
                } else {
                    tooltip.style.display = 'none';
                }
            } else {
                tooltip.style.display = 'none';
            }
        } else {
            tooltip.style.display = 'none';
        }
    }
    
    slot.classList.add('drag-over');
}

function handleDragLeave(e) {
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    slot.classList.remove('cost-warning-active');
    slot.classList.remove('cost-ok-active');
    
    const tooltip = document.getElementById('cost-warning-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

async function handleDropOnSlot(e) {
    e.preventDefault();
    e.stopPropagation();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    slot.classList.remove('cost-warning-active');
    slot.classList.remove('cost-ok-active');
    
    const tooltip = document.getElementById('cost-warning-tooltip');
    if (tooltip) tooltip.style.display = 'none';

    const idPrefix = getPrefixFromZoneId(getParentZoneId(slot));

    if (typeof draggedItem !== 'undefined' && draggedItem && draggedItem.dataset.isStockDecoration === 'true') {
        handleStockDecorationDrop(draggedItem, slot, idPrefix);
        return;
    }

    if (e.dataTransfer.files.length > 0) {
        await handleFileDrop(e, slot, idPrefix);
        return;
    }

    if (typeof draggedItem !== 'undefined' && draggedItem) {
        await handleCardDrop(draggedItem, slot, idPrefix);
    }
}

function handleStockDecorationDrop(stockItem, targetSlot, idPrefix) {
    const img = stockItem.querySelector('img');
    if (!img) return;
    const imageData = img.src;
    
    const targetParentZoneId = getParentZoneId(targetSlot);
    const targetParentBaseId = getBaseId(targetParentZoneId);
    
    const validTargets = ['icon-zone', 'deck', 'grave', 'exclude', 'side-deck'];
    if (!validTargets.includes(targetParentBaseId)) return;

    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    let memoToSet = '';
    if (targetParentBaseId === 'icon-zone') {
        memoToSet = DEFAULT_CARD_MEMO;
    }

    const existingThumbnail = targetSlot.querySelector('.thumbnail[data-is-decoration="true"]');
    if (existingThumbnail) {
        const existingImg = existingThumbnail.querySelector('img');
        if (existingImg) existingImg.src = imageData;
        if (memoToSet) existingThumbnail.dataset.memo = memoToSet;
    } else {
        const anyExistingThumbnail = getExistingThumbnail(targetSlot);
        if (anyExistingThumbnail) targetSlot.removeChild(anyExistingThumbnail);
        
        createCardThumbnail({
            src: imageData,
            isDecoration: true,
            memo: memoToSet,
            ownerPrefix: idPrefix
        }, targetSlot, true, false, idPrefix);
    }

    playSe('カードを配置する.mp3');
    
    if (targetParentBaseId !== 'icon-zone') {
        syncMainZoneImage(targetParentBaseId, idPrefix);
    }

    if (typeof recordAction === 'function') {
        recordAction({
            type: 'updateDecoration',
            zoneId: targetParentZoneId,
            imageData: imageData
        });
        if (memoToSet) {
             const slotIndex = Array.from(targetSlot.parentNode.children).indexOf(targetSlot);
             recordAction({
                type: 'memoChange',
                zoneId: targetParentZoneId,
                cardIndex: slotIndex,
                memo: memoToSet
            });
        }
    }

    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
}

async function handleFileDrop(e, targetSlot, idPrefix) {
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length === 0) return;

    const processFile = async (file, currentSlot) => {
        const cardData = await extractCardDataFromPng(file);
        let memo = DEFAULT_CARD_MEMO;

        if (cardData) {
            const isNumericBp = /^\d+$/.test(cardData.bp.trim());
            const bpText = cardData.bp.trim() === '' ? '[BP:-]' : (isNumericBp ? `[BP:${cardData.bp}]` : `[スペル:${cardData.bp}]`);
            
            memo = `[カード名:${cardData.cardName}]////非表示/
[属性:${cardData.attribute}]////非表示/
[マナ:${cardData.mana}]////非表示/
${bpText}////非表示/
[効果:${cardData.effect}]////非表示/
[フレーバーテキスト:${cardData.flavor}]////非表示/`;
        }

        const targetParentZoneId = getParentZoneId(currentSlot);
        const targetParentBaseId = getBaseId(targetParentZoneId);

        if (!await checkMainPhaseWarning(targetParentBaseId)) return;

        if (targetParentBaseId.startsWith('mana')) {
            if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
                if (typeof autoConfig !== 'undefined' && autoConfig.warnManaPlacementPhase) {
                    if (!await showCustomConfirm('現在メインステップではありません。マナエリアにカードを配置しますか？')) {
                        return;
                    }
                }
            }
            if (typeof manaPlacedThisTurn !== 'undefined' && manaPlacedThisTurn) {
                if (typeof autoConfig !== 'undefined' && autoConfig.limitManaPlacement) {
                    if (!await showCustomConfirm('今ターン既にマナを配置済みです。さらに配置しますか？')) {
                        return;
                    }
                }
            }
        }

        const targetZonesForCost = ['special1', 'battle', 'special2', 'spell']; 
        if (targetZonesForCost.some(z => targetParentBaseId.includes(z))) {
            if (!await handleManaConsumption(memo, idPrefix)) return;
        }

        if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

        const imageUrl = URL.createObjectURL(file);
        
        const currentTurnVal = document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1";

        let rotation = 0;
        if (targetParentBaseId === 'extra-image-zone') {
            const tempImg = new Image();
            await new Promise(r => {
                tempImg.onload = r;
                tempImg.onerror = r;
                tempImg.src = imageUrl;
            });
            if (tempImg.height > tempImg.width) {
                rotation = 90;
            }
        }

        if (targetParentBaseId === 'icon-zone') {
            const existingThumbnail = currentSlot.querySelector('.thumbnail[data-is-decoration="true"]');
            if (existingThumbnail) {
                const existingImg = existingThumbnail.querySelector('img');
                if (existingImg) existingImg.src = imageUrl;
                existingThumbnail.dataset.memo = memo;
            } else {
                createCardThumbnail({ src: imageUrl, isDecoration: true, memo: memo, ownerPrefix: idPrefix }, currentSlot, true, false, idPrefix);
            }
        } else {
            const isTargetStackable = stackableZones.includes(targetParentBaseId);
            const existingThumbnail = getExistingThumbnail(currentSlot);
            if (!isTargetStackable && existingThumbnail) {
                currentSlot.removeChild(existingThumbnail);
                resetSlotToDefault(currentSlot);
            }
             createCardThumbnail({ 
                 src: imageUrl, 
                 memo: memo, 
                 ownerPrefix: idPrefix, 
                 deployedTurn: currentTurnVal,
                 rotation: rotation
             }, currentSlot, false, false, idPrefix);
            if (isTargetStackable) {
                updateSlotStackState(currentSlot);
            }
        }
        
        playPlacementSe(targetParentBaseId);
        if (targetParentBaseId.startsWith('mana')) {
            tryAutoManaTapIn(currentSlot, idPrefix, targetParentZoneId);
            if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = true;
        }
        
        if (typeof window.updatePlaymatState === 'function') {
            window.updatePlaymatState();
        }
        if (typeof window.updateSummoningSicknessVisuals === 'function') {
            window.updateSummoningSicknessVisuals();
        }

        const zoneId = getParentZoneId(currentSlot);
        const baseId = getBaseId(zoneId);
        if (baseId.endsWith('-back-slots')) {
            const mainBaseId = baseId.replace('-back-slots', '');
            if (['deck', 'grave', 'exclude', 'side-deck'].includes(mainBaseId)) {
                syncMainZoneImage(mainBaseId, idPrefix);
            }
        }
    };

    const targetParentZoneId = getParentZoneId(targetSlot);
    const targetParentBaseId = getBaseId(targetParentZoneId);
    
    const pileZones = ['deck', 'grave', 'exclude', 'side-deck'];
    if (pileZones.includes(targetParentBaseId)) {
        const backSlotsId = idPrefix + targetParentBaseId + '-back-slots';
        const container = document.getElementById(backSlotsId);
        if (container) {
            const slotsContainer = container.querySelector('.deck-back-slot-container');
            if (slotsContainer) {
                const allSlots = Array.from(slotsContainer.querySelectorAll('.card-slot'));
                const availableSlots = allSlots.filter(s => !s.querySelector('.thumbnail'));
                
                for (let i = 0; i < files.length; i++) {
                    if (availableSlots[i]) {
                        await processFile(files[i], availableSlots[i]);
                    }
                }
                arrangeSlots(backSlotsId); 
            }
        }
        return; 
    }

    const isSlotSpecificDrop = targetSlot.classList.contains('card-slot');

    if (isSlotSpecificDrop && !targetParentBaseId.endsWith('-back-slots') && !targetParentBaseId.includes('free-space')) {
        await processFile(files[0], targetSlot);
    } else {
        const container = document.getElementById(targetParentZoneId);
        if (!container) return;
        
        let slotsContainer = container.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container');
        if (!slotsContainer) return; 

        const allSlots = Array.from(slotsContainer.querySelectorAll('.card-slot'));
        let availableSlots = allSlots.filter(s => !s.querySelector('.thumbnail'));

        if (targetSlot.classList.contains('card-slot') && !getExistingThumbnail(targetSlot)) {
            const isTargetInAvailable = availableSlots.some(s => s === targetSlot);
            if (isTargetInAvailable) {
                availableSlots = [targetSlot, ...availableSlots.filter(s => s !== targetSlot)];
            }
        }
        
        for (let i = 0; i < files.length; i++) {
            if (availableSlots[i]) {
                await processFile(files[i], availableSlots[i]);
            }
        }
    }
}

async function handleCardDrop(draggedItem, targetSlot, idPrefix) {
    if (draggedItem.dataset.isDecoration === 'true') return;

    const targetZoneId = getParentZoneId(targetSlot);
    const targetBaseZoneId = getBaseId(targetZoneId);

    if (typeof selectedCards !== 'undefined' && selectedCards.length > 1 && selectedCards.includes(draggedItem)) {
        if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

        const cardsToProcess = [...selectedCards];
        selectedCards = [];
        document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));

        let emptySlots = [];
        let containerId = targetZoneId;
        const isPileZone = ['deck', 'grave', 'exclude', 'side-deck'].includes(targetBaseZoneId);
        const isBackSlots = targetBaseZoneId.endsWith('-back-slots') || 
                            targetBaseZoneId === 'hand-zone' || 
                            targetBaseZoneId.includes('free-space') || 
                            targetBaseZoneId === 'token-zone-slots';

        if (isBackSlots || isPileZone) {
            if (isPileZone) {
                containerId = idPrefix + targetBaseZoneId + '-back-slots';
            }
            
            const container = document.getElementById(containerId);
            if (container) {
                const slotsContainer = container.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container, .hand-zone-slots') || container;
                const allSlots = Array.from(slotsContainer.querySelectorAll('.card-slot'));
                emptySlots = allSlots.filter(s => !s.querySelector('.thumbnail'));

                let targetSlotIndex = -1;
                if (targetSlot.classList.contains('card-slot') && !targetSlot.querySelector('.thumbnail')) {
                    targetSlotIndex = emptySlots.indexOf(targetSlot);
                }
                if (targetSlotIndex !== -1) {
                    const head = emptySlots.slice(targetSlotIndex);
                    const tail = emptySlots.slice(0, targetSlotIndex);
                    emptySlots = head.concat(tail);
                }
            }
        }

        cardsToProcess.forEach((card, index) => {
            const sourceSlot = card.parentNode;
            const sourceZoneId = getParentZoneId(sourceSlot);
            const sourceBaseZoneId = getBaseId(sourceZoneId);

            if (sourceBaseZoneId === 'token-zone-slots' || sourceBaseZoneId === 'c-free-space') {
                const destSlot = emptySlots[index];
                if (!destSlot) return; 

                const imgElement = card.querySelector('.card-image');
                const cardData = {
                    src: imgElement ? imgElement.src : '',
                    memo: card.dataset.memo || '',
                    flavor1: card.dataset.flavor1 || '',
                    flavor2: card.dataset.flavor2 || '',
                    ownerPrefix: (targetBaseZoneId === 'c-free-space') ? '' : idPrefix,
                    customCounters: JSON.parse(card.dataset.customCounters || '[]'),
                    deployedTurn: document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1"
                };

                const thumb = createCardThumbnail(cardData, destSlot, false, false, cardData.ownerPrefix);
                
                if (targetBaseZoneId === 'extra-image-zone') {
                    thumb.dataset.timestamp = Date.now();
                    const img = thumb.querySelector('.card-image');
                    if (img && img.naturalHeight > img.naturalWidth) {
                        const r = 90;
                        img.dataset.rotation = r;
                        const { width, height } = getCardDimensions();
                        const scaleFactor = height / width;
                        img.style.transform = `rotate(${r}deg) scale(${scaleFactor})`;
                    }
                }
                if (targetBaseZoneId === 'c-free-space') delete thumb.dataset.ownerPrefix;

                updateSlotStackState(destSlot);
                card.style.visibility = 'visible'; 
            } 
            else if (emptySlots.length > 0) {
                const destSlot = emptySlots[index];
                if (destSlot && sourceSlot !== destSlot) {
                    sourceSlot.removeChild(card);
                    destSlot.appendChild(card);
                    
                    tryResetStatusOnMove(card, targetBaseZoneId);
                    resetSlotToDefault(destSlot);
                    updateSlotStackState(destSlot);
                    resetSlotToDefault(sourceSlot);
                    updateSlotStackState(sourceSlot);
                    card.style.visibility = 'visible';
                    
                    if (containerId === 'c-free-space') delete card.dataset.ownerPrefix;
                    if (targetBaseZoneId !== 'hand-zone') {
                        const img = card.querySelector('.card-image');
                        if(img) {
                            img.dataset.rotation = 0;
                            img.style.transform = '';
                        }
                        destSlot.classList.remove('rotated-90');
                    }
                }
            } else {
                card.style.visibility = 'visible';
            }
        });

        if (isBackSlots || isPileZone) {
            arrangeSlots(containerId);
            const mainBaseId = containerId.replace(idPrefix, '').replace('-back-slots', '');
            if (['deck', 'grave', 'exclude', 'side-deck'].includes(mainBaseId)) {
                syncMainZoneImage(mainBaseId, idPrefix);
            }
        }
        
        playSe('カードを配置する.mp3');
        if (typeof window.updatePlaymatState === 'function') window.updatePlaymatState();
        if (typeof window.updateSummoningSicknessVisuals === 'function') window.updateSummoningSicknessVisuals();
        return; 
    }

    const sourceSlot = draggedItem.parentNode;
    const sourceZoneId = getParentZoneId(sourceSlot);
    const sourceBaseZoneId = getBaseId(sourceZoneId);

    if (sourceSlot === targetSlot) return;

    if (sourceBaseZoneId === 'hand-zone') {
        if (!await checkMainPhaseWarning(targetBaseZoneId)) return;
    }

    if (targetBaseZoneId.startsWith('mana')) {
        if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
            if (typeof autoConfig !== 'undefined' && autoConfig.warnManaPlacementPhase) {
                if (!await showCustomConfirm('現在メインステップではありません。マナエリアにカードを配置しますか？')) {
                    return;
                }
            }
        }
        if (typeof manaPlacedThisTurn !== 'undefined' && manaPlacedThisTurn) {
            if (typeof autoConfig !== 'undefined' && autoConfig.limitManaPlacement) {
                if (!await showCustomConfirm('今ターン既にマナを配置済みです。さらに配置しますか？')) {
                    return;
                }
            }
        }
    }

    const costSourceZones = ['hand-zone', 'deck', 'deck-back-slots', 'grave', 'grave-back-slots', 'exclude', 'exclude-back-slots', 'side-deck', 'side-deck-back-slots'];
    const targetZonesForCost = ['special1', 'battle', 'special2', 'spell']; 
    
    if (costSourceZones.includes(sourceBaseZoneId)) {
        if (targetZonesForCost.some(z => targetBaseZoneId.includes(z))) {
            if (!await handleManaConsumption(draggedItem.dataset.memo, idPrefix)) return;
        }
    }

    if (typeof saveStateForUndo === 'function') saveStateForUndo();

    if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
        if (draggedItem === currentAttacker || draggedItem === currentBattleTarget) {
            if (typeof closeBattleConfirmModal === 'function') {
                closeBattleConfirmModal();
                await showCustomAlert("バトル中のカードが移動したため、バトルを中断しました。");
            }
        }
    }

    const fromZoneId = sourceZoneId;
    const fromSlotIndex = Array.from(sourceSlot.parentNode.children).indexOf(sourceSlot);

    if (sourceBaseZoneId === 'token-zone-slots' || sourceBaseZoneId === 'c-free-space') {
        const imgElement = draggedItem.querySelector('.card-image');
        const src = imgElement ? imgElement.src : '';
        const memo = draggedItem.dataset.memo || '';
        const flavor1 = draggedItem.dataset.flavor1 || '';
        const flavor2 = draggedItem.dataset.flavor2 || '';
        const customCounters = JSON.parse(draggedItem.dataset.customCounters || '[]');
        
        const newOwnerPrefix = (targetBaseZoneId === 'c-free-space') ? '' : idPrefix;
        
        const currentTurnVal = document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1";

        const cardData = {
            src: src,
            memo: memo,
            flavor1: flavor1,
            flavor2: flavor2,
            ownerPrefix: newOwnerPrefix,
            customCounters: customCounters,
            deployedTurn: currentTurnVal
        };

        let destSlot = targetSlot;
        let destZoneId = targetZoneId;
        
        const isPileZone = ['deck', 'grave', 'exclude', 'side-deck'].includes(targetBaseZoneId);
        const isBackSlots = targetBaseZoneId.endsWith('-back-slots');
        const isHand = targetBaseZoneId === 'hand-zone';

        if (isPileZone || isBackSlots || isHand) {
             let containerId = targetZoneId;
             if (isPileZone) {
                 containerId = idPrefix + targetBaseZoneId + '-back-slots';
             } else if (isHand) {
                 containerId = idPrefix + 'hand-zone';
             }
             
             const container = document.getElementById(containerId);
             if (!container) return;
             
             const slotsContainer = container.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container, .hand-zone-slots') || container;
             const emptySlot = Array.from(slotsContainer.querySelectorAll('.card-slot')).find(s => !s.querySelector('.thumbnail'));
             
             if (!emptySlot) {
                 console.warn('空きスロットがありません');
                 return;
             }
             destSlot = emptySlot;
             destZoneId = getParentZoneId(destSlot);
        } else {
            const isTargetStackable = stackableZones.includes(targetBaseZoneId);
            const existing = getExistingThumbnail(targetSlot);
            if (!isTargetStackable && existing) {
                return; 
            }
            destSlot = targetSlot;
        }

        const thumb = createCardThumbnail(cardData, destSlot, false, false, newOwnerPrefix);
        
        if (targetBaseZoneId === 'extra-image-zone') {
            thumb.dataset.timestamp = Date.now();
            const img = thumb.querySelector('.card-image');
            if (img && img.naturalHeight > img.naturalWidth) {
                const r = 90;
                img.dataset.rotation = r;
                const { width, height } = getCardDimensions();
                const scaleFactor = height / width;
                img.style.transform = `rotate(${r}deg) scale(${scaleFactor})`;
            }
        }
        if (targetBaseZoneId === 'c-free-space') delete thumb.dataset.ownerPrefix;
        
        if (targetBaseZoneId.startsWith('mana')) {
             if (autoConfig.autoManaPlacement) {
                const manaInput = document.getElementById(idPrefix + 'mana-counter-value');
                if (manaInput) {
                    manaInput.value = parseInt(manaInput.value || 0) + 1;
                    if (typeof recordAction === 'function') {
                        recordAction({
                            type: 'counterChange',
                            inputId: idPrefix + 'mana-counter-value',
                            change: 1
                        });
                    }
                }
            }
            tryAutoManaTapIn(destSlot, idPrefix, destZoneId);
            playSe('マナ配置.mp3');
            
            if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = true;
        } else {
            playPlacementSe(targetBaseZoneId);
        }
        
        updateSlotStackState(destSlot);
        
        if (typeof recordAction === 'function') {
            recordAction({
                type: 'newCard',
                zoneId: destZoneId,
                slotIndex: Array.from(destSlot.parentNode.children).indexOf(destSlot),
                cardData: cardData
            });
        }
        
        const destBaseId = getBaseId(destZoneId);
        if (destBaseId.endsWith('-back-slots') || destBaseId === 'hand-zone' || destBaseId === 'free-space-slots' || destBaseId === 'c-free-space') {
            arrangeSlots(destZoneId);
        }
        const mainBaseId = destBaseId.replace('-back-slots', '');
        if (['deck', 'grave', 'exclude', 'side-deck'].includes(mainBaseId)) {
            syncMainZoneImage(mainBaseId, idPrefix);
        }

        if (typeof window.updatePlaymatState === 'function') {
            window.updatePlaymatState();
        }
        if (typeof window.updateSummoningSicknessVisuals === 'function') {
            window.updateSummoningSicknessVisuals();
        }

        return;
    }
    
    if (sourceBaseZoneId === 'hand-zone' && targetZonesForCost.includes(targetBaseZoneId)) {
        const currentTurnVal = document.getElementById('common-turn-value') ? document.getElementById('common-turn-value').value : "1";
        draggedItem.dataset.deployedTurn = currentTurnVal;
    }

    const isGrave = targetBaseZoneId === 'grave' || targetBaseZoneId === 'grave-back-slots';
    const isExclude = targetBaseZoneId === 'exclude' || targetBaseZoneId === 'exclude-back-slots';
    const isMana = targetBaseZoneId.startsWith('mana');
    
    if (isGrave) {
        playSe('墓地に送る.mp3');
    } else if (isExclude) {
        playSe('除外する.mp3');
    } else if (isMana) {
        playSe('マナ配置.mp3');
    } else {
        playPlacementSe(targetBaseZoneId);
    }

    if (isMana && !sourceBaseZoneId.startsWith('mana')) {
        if (autoConfig.autoManaPlacement) {
            const targetPrefix = getPrefixFromZoneId(targetZoneId);
            const manaInputId = targetPrefix + 'mana-counter-value';
            const manaInput = document.getElementById(manaInputId);
            if (manaInput) {
                manaInput.value = parseInt(manaInput.value || 0) + 1;
                if (typeof recordAction === 'function') {
                    recordAction({
                        type: 'counterChange',
                        inputId: manaInputId,
                        change: 1
                    });
                }
            }
        }
        if (typeof manaPlacedThisTurn !== 'undefined') manaPlacedThisTurn = true;
    }

    const isTargetStackable = stackableZones.includes(targetBaseZoneId);
    const existingThumbnail = getExistingThumbnail(targetSlot);

    if (targetBaseZoneId.endsWith('-back-slots') || ['deck', 'grave', 'exclude', 'side-deck'].includes(targetBaseZoneId) || targetBaseZoneId === 'c-free-space') {
        let multiZoneId = targetZoneId;
        if(['deck', 'grave', 'exclude', 'side-deck'].includes(targetBaseZoneId)) {
            multiZoneId = idPrefix + targetBaseZoneId + '-back-slots';
        }
        moveCardToMultiZone(draggedItem, getBaseId(multiZoneId).replace('-back-slots',''));
        return;
    }

    if (isTargetStackable) {
        sourceSlot.removeChild(draggedItem);
        targetSlot.insertBefore(draggedItem, targetSlot.firstChild);
        
        if (typeof recordAction === 'function') {
            recordAction({
                type: 'move',
                fromZone: fromZoneId,
                fromSlotIndex: fromSlotIndex,
                toZone: targetZoneId,
                toSlotIndex: Array.from(targetSlot.parentNode.children).indexOf(targetSlot)
            });
        }
    }
    else if (existingThumbnail && sourceSlot !== targetSlot) {
        sourceSlot.appendChild(existingThumbnail);
        targetSlot.appendChild(draggedItem);
        
        if (typeof recordAction === 'function') {
            recordAction({
                type: 'move',
                fromZone: fromZoneId,
                fromSlotIndex: fromSlotIndex,
                toZone: targetZoneId,
                toSlotIndex: Array.from(targetSlot.parentNode.children).indexOf(targetSlot)
            });
        }
    }
    else if (!existingThumbnail) {
        sourceSlot.removeChild(draggedItem);
        targetSlot.appendChild(draggedItem);
        
        if (targetBaseZoneId === 'extra-image-zone') {
            draggedItem.dataset.timestamp = Date.now();
        }
        
        if (typeof recordAction === 'function') {
            recordAction({
                type: 'move',
                fromZone: fromZoneId,
                fromSlotIndex: fromSlotIndex,
                toZone: targetZoneId,
                toSlotIndex: Array.from(targetSlot.parentNode.children).indexOf(targetSlot)
            });
        }
    } else {
        return; 
    }

    tryResetStatusOnMove(draggedItem, targetBaseZoneId);

    [sourceSlot, targetSlot].forEach(slot => {
        resetSlotToDefault(slot);
        updateSlotStackState(slot);
        
        const zoneId = getParentZoneId(slot);
        const baseId = getBaseId(zoneId);

        if(zoneId.endsWith('-back-slots')) arrangeSlots(zoneId);
        const realBaseId = baseId.replace('-back-slots', '');
        if (['deck', 'grave', 'exclude', 'side-deck'].includes(realBaseId)) {
             syncMainZoneImage(realBaseId, getPrefixFromZoneId(zoneId));
        }
        
        if (baseId === 'c-free-space') {
            const thumb = slot.querySelector('.thumbnail');
            if(thumb) delete thumb.dataset.ownerPrefix;
        }
    });

    if (targetBaseZoneId === 'extra-image-zone') {
        const thumb = targetSlot.querySelector('.thumbnail');
        if (thumb) {
            const img = thumb.querySelector('.card-image');
            if (img) {
                const checkAndRotate = () => {
                    if (img.naturalHeight > img.naturalWidth) {
                        const r = 90;
                        img.dataset.rotation = r;
                        const { width, height } = getCardDimensions();
                        const scaleFactor = height / width;
                        img.style.transform = `rotate(${r}deg) scale(${scaleFactor})`;
                    } else {
                        img.dataset.rotation = 0;
                        img.style.transform = 'rotate(0deg)';
                    }
                };
                if (img.complete) checkAndRotate();
                else img.onload = checkAndRotate;
            }
        }
    }

    if (targetBaseZoneId.startsWith('mana') && !sourceBaseZoneId.startsWith('mana')) {
        tryAutoManaTapIn(targetSlot, idPrefix, targetZoneId);
    }

    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
    if (typeof window.updateSummoningSicknessVisuals === 'function') {
        window.updateSummoningSicknessVisuals();
    }
}


function updateSlotStackState(slotElement) {
    if (!slotElement) return;
    const thumbnailCount = slotElement.querySelectorAll('.thumbnail:not([data-is-decoration="true"])').length;
    slotElement.classList.toggle('stacked', thumbnailCount > 1);
}

function arrangeSlots(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let slotsContainer = container.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container') || container;
    if (!slotsContainer) return;

    const slots = Array.from(slotsContainer.querySelectorAll('.card-slot'));
    let cardThumbnails = [];
    slots.forEach(slot => {
        slot.querySelectorAll('.thumbnail').forEach(thumbnail => {
            cardThumbnails.push(thumbnail);
            slot.removeChild(thumbnail);
        });
        resetSlotToDefault(slot);
    });

    cardThumbnails.forEach((thumbnail, i) => {
        if (slots[i]) {
            slots[i].appendChild(thumbnail);
            resetSlotToDefault(slots[i]);
            updateSlotStackState(slots[i]);
        }
    });
}

function syncMainZoneImage(baseZoneId, idPrefix) {
    const mainZone = document.getElementById(idPrefix + baseZoneId);
    if (!mainZone) return;
    const mainSlot = mainZone.querySelector('.card-slot');
    if (!mainSlot) return;

    const backSlotsId = `${idPrefix}${baseZoneId}-back-slots`;
    const backSlotsContainer = document.getElementById(backSlotsId);
    const backSlots = backSlotsContainer ? backSlotsContainer.querySelector('.deck-back-slot-container') : null;
    const occupiedThumbnails = backSlots ? Array.from(backSlots.querySelectorAll('.thumbnail')) : [];
    const cardCount = occupiedThumbnails.length;

    let countOverlay = mainSlot.querySelector('.count-overlay');
    if (!countOverlay) {
        countOverlay = document.createElement('div');
        countOverlay.classList.add('count-overlay');
        mainSlot.appendChild(countOverlay);
    }
    countOverlay.textContent = cardCount;
    countOverlay.style.display = cardCount > 0 ? 'block' : 'none';

    const decoratedThumbnail = mainSlot.querySelector('.thumbnail[data-is-decoration="true"]');
    let targetCardThumbnail = null;
    if (cardCount > 0) {
        if (baseZoneId === 'deck' || baseZoneId === 'side-deck') {
            targetCardThumbnail = occupiedThumbnails[0];
        } else if (baseZoneId === 'grave' || baseZoneId === 'exclude') {
            targetCardThumbnail = occupiedThumbnails[occupiedThumbnails.length - 1];
        }
    }

    let mainSlotImg = mainSlot.querySelector('img.zone-image');
    if (!mainSlotImg) {
        mainSlotImg = document.createElement('img');
        mainSlotImg.classList.add('zone-image');
        mainSlotImg.draggable = false;
        mainSlot.insertBefore(mainSlotImg, countOverlay);
    }

    if (decoratedThumbnail) {
        mainSlotImg.style.display = 'none';
        decoratedThumbnail.style.display = 'block';
    } else if (targetCardThumbnail) {
        const cardImg = targetCardThumbnail.querySelector('.card-image');
        mainSlotImg.src = targetCardThumbnail.dataset.isFlipped === 'true' ? targetCardThumbnail.dataset.originalSrc : cardImg.src;
        mainSlotImg.style.display = 'block';
    } else {
        mainSlotImg.style.display = 'none';
    }
    mainSlot.dataset.hasCard = !!(decoratedThumbnail || targetCardThumbnail);
}

function moveCardToMultiZone(thumbnailElement, targetBaseZoneId) {
    const sourceSlot = thumbnailElement.parentNode;
    if (!sourceSlot) return;

    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    const idPrefix = thumbnailElement.dataset.ownerPrefix || '';

    const isCNavi = (targetBaseZoneId === 'c-free-space' || targetBaseZoneId === 'c-free-space-slots');
    const isTargetHand = (targetBaseZoneId === 'hand');
    
    let destinationMultiZoneId;
    if (isCNavi) {
        destinationMultiZoneId = 'c-free-space';
    } else if (isTargetHand) {
        destinationMultiZoneId = idPrefix + 'hand-zone';
    } else {
        destinationMultiZoneId = idPrefix + targetBaseZoneId + '-back-slots';
    }

    if (sourceSlot === destinationMultiZoneId || sourceSlot.id === destinationMultiZoneId) return;

    const fromZoneId = getParentZoneId(sourceSlot);
    const fromSlotIndex = Array.from(sourceSlot.parentNode.children).indexOf(sourceSlot);

    const destinationContainer = document.getElementById(destinationMultiZoneId);
    if (!destinationContainer) return;

    const slotsContainer = destinationContainer.querySelector('.deck-back-slot-container, .free-space-slot-container') || destinationContainer;
    const emptySlot = Array.from(slotsContainer.querySelectorAll('.card-slot')).find(s => !s.querySelector('.thumbnail'));

    if (!emptySlot) {
        console.warn(`「${targetBaseZoneId}」がいっぱいです。`);
        return;
    }

    sourceSlot.removeChild(thumbnailElement);
    emptySlot.appendChild(thumbnailElement);
    
    tryResetStatusOnMove(thumbnailElement, targetBaseZoneId);

    const img = thumbnailElement.querySelector('.card-image');
    if (img) {
        img.dataset.rotation = 0;
        img.style.transform = 'rotate(0deg)';
    }
    emptySlot.classList.remove('rotated-90');
    
    if (isCNavi) {
        delete thumbnailElement.dataset.ownerPrefix;
    }

    if (typeof recordAction === 'function') {
        recordAction({
            type: 'move',
            fromZone: fromZoneId,
            fromSlotIndex: fromSlotIndex,
            toZone: destinationMultiZoneId,
            toSlotIndex: Array.from(emptySlot.parentNode.children).indexOf(emptySlot)
        });
    }

    resetCardFlipState(thumbnailElement);
    resetSlotToDefault(emptySlot);
    updateSlotStackState(emptySlot);

    const sourceParentZoneId = getParentZoneId(sourceSlot);
    const sourceParentBaseId = getBaseId(sourceParentZoneId);

    if (sourceParentZoneId.endsWith('-back-slots') || sourceParentBaseId === 'hand-zone' || sourceParentBaseId === 'free-space-slots' || sourceParentBaseId === 'token-zone-slots' || sourceParentBaseId === 'c-free-space') {
        arrangeSlots(sourceParentZoneId);
    }
    resetSlotToDefault(sourceSlot);
    updateSlotStackState(sourceSlot);

    const realSourceBaseId = sourceParentBaseId.replace('-back-slots', '');
    if (['deck', 'grave', 'exclude', 'side-deck'].includes(realSourceBaseId)) {
         syncMainZoneImage(realSourceBaseId, getPrefixFromZoneId(sourceParentZoneId));
    }

    arrangeSlots(destinationMultiZoneId);
    if (!isTargetHand && !isCNavi) {
        syncMainZoneImage(targetBaseZoneId, idPrefix);
    }

    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
    if (typeof window.updateSummoningSicknessVisuals === 'function') {
        window.updateSummoningSicknessVisuals();
    }
}

window.setupDrawerSearchAndSort = function() {
    const searchInputs = document.querySelectorAll('.drawer-search-input');
    const sortButtons = document.querySelectorAll('.sort-btn');

    searchInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const controlContainer = e.target.closest('.drawer-search-sort-container');
            if (!controlContainer) return;
            const panel = controlContainer.parentElement; 
            
            const container = panel.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container');
            if (!container) return;

            const cards = Array.from(container.querySelectorAll('.card-slot:has(.thumbnail)'));
            
            cards.forEach(slot => {
                const thumb = slot.querySelector('.thumbnail');
                const memo = (thumb.dataset.memo || '').toLowerCase();
                if (memo.includes(query)) {
                    slot.style.display = '';
                } else {
                    slot.style.display = 'none';
                }
            });
        });
    });

    sortButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const type = e.target.dataset.sort; 
            const controlContainer = e.target.closest('.drawer-search-sort-container');
            if (!controlContainer) return;
            const panel = controlContainer.parentElement;
            
            const container = panel.querySelector('.deck-back-slot-container, .free-space-slot-container, .token-slot-container');
            if (!container) return;

            const slots = Array.from(container.querySelectorAll('.card-slot'));
            const cards = [];
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();

            slots.forEach(slot => {
                const thumb = slot.querySelector('.thumbnail');
                if (thumb) {
                    cards.push(thumb);
                    slot.removeChild(thumb);
                }
            });

            cards.sort((a, b) => {
                const getVal = (el, key) => {
                    const memo = el.dataset.memo || '';
                    let regex;
                    if (key === 'name') regex = /\[カード名:(.*?)\]/;
                    else if (key === 'cost') regex = /\[マナ:(.*?)\]/;
                    else if (key === 'bp') regex = /\[BP:(.*?)\]/;
                    
                    const match = memo.match(regex);
                    return match ? match[1].trim() : '';
                };

                const valA = getVal(a, type);
                const valB = getVal(b, type);

                if (type === 'name') {
                    return valA.localeCompare(valB, 'ja');
                } else {
                    const numA = parseInt(valA);
                    const numB = parseInt(valB);
                    if (isNaN(numA) && isNaN(numB)) return 0;
                    if (isNaN(numA)) return 1;
                    if (isNaN(numB)) return -1;
                    return numB - numA; 
                }
            });

            cards.forEach((card, i) => {
                if (slots[i]) slots[i].appendChild(card);
            });
            
            playSe('シャッフル.mp3');
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (typeof setupDrawerSearchAndSort === 'function') {
            setupDrawerSearchAndSort();
        }
    }, 100);
});

window.duplicateCardToFreeSpace = async function(sourceCard) {
    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

    const freeSpaceContainer = document.getElementById('free-space-slots');
    if (!freeSpaceContainer) return;
    
    const slotsContainer = freeSpaceContainer.querySelector('.free-space-slot-container');
    if (!slotsContainer) return;

    const emptySlot = Array.from(slotsContainer.querySelectorAll('.card-slot')).find(s => !s.querySelector('.thumbnail'));
    
    if (!emptySlot) {
        if (typeof showCustomAlert === 'function') {
            await showCustomAlert("フリースペースに空きがありません。");
        } else {
            alert("フリースペースに空きがありません。");
        }
        return;
    }

    const imgElement = sourceCard.querySelector('.card-image');
    const cardData = {
        src: imgElement ? imgElement.src : '',
        memo: sourceCard.dataset.memo || '',
        flavor1: sourceCard.dataset.flavor1 || '',
        flavor2: sourceCard.dataset.flavor2 || '',
        ownerPrefix: '', 
        customCounters: JSON.parse(sourceCard.dataset.customCounters || '[]'),
        isFlipped: false, 
        rotation: 0
    };

    if (typeof createCardThumbnail === 'function') {
        createCardThumbnail(cardData, emptySlot, false, false, '');
        if (typeof updateSlotStackState === 'function') updateSlotStackState(emptySlot);
        playSe('カードを配置する.mp3');
        
        const drawer = document.getElementById('player-drawer');
        if (drawer) {
            drawer.classList.add('open');
            if(typeof activateDrawerTab === 'function') activateDrawerTab('free-space-slots', drawer);
        }
    }
};
