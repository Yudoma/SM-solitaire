const masturbateTimers = new WeakMap(); 

function createCardThumbnail(cardData, slotElement, isDecoration = false, insertAtBottom = false, ownerPrefix = '') {
    let imageSrc, isFlipped, originalSrc, counter, memo, flavor1, flavor2, rotation, isMasturbating, isBlocker, isPermanent, customCounters, deployedTurn;

    if (typeof cardData === 'string') {
        imageSrc = cardData;
        isFlipped = false;
        originalSrc = null;
        counter = 0;
        memo = '';
        flavor1 = '';
        flavor2 = '';
        rotation = 0;
        isMasturbating = false;
        isBlocker = false;
        isPermanent = false;
        customCounters = [];
        deployedTurn = null;
    } else { 
        imageSrc = cardData.src;
        isDecoration = cardData.isDecoration || isDecoration; 
        isFlipped = cardData.isFlipped || false;
        originalSrc = cardData.originalSrc || null;
        counter = cardData.counter || 0;
        memo = cardData.memo || '';
        flavor1 = cardData.flavor1 || '';
        flavor2 = cardData.flavor2 || '';
        ownerPrefix = cardData.ownerPrefix || ownerPrefix;
        rotation = cardData.rotation || 0;
        isMasturbating = cardData.isMasturbating || false;
        isBlocker = cardData.isBlocker || false;
        isPermanent = cardData.isPermanent || false;
        customCounters = cardData.customCounters || [];
        deployedTurn = cardData.deployedTurn || null;
    }

    const thumbnailElement = document.createElement('div');
    thumbnailElement.classList.add('thumbnail');
    thumbnailElement.setAttribute('draggable', true);

    if (isDecoration) {
        thumbnailElement.dataset.isDecoration = 'true';
    }
    
    if (isMasturbating) {
        thumbnailElement.dataset.isMasturbating = 'true';
    }
    
    if (isBlocker) {
        thumbnailElement.dataset.isBlocker = 'true';
    }

    if (isPermanent) {
        thumbnailElement.dataset.isPermanent = 'true';
    }

    if (deployedTurn) {
        thumbnailElement.dataset.deployedTurn = deployedTurn;
    }

    const imgElement = document.createElement('img');
    imgElement.classList.add('card-image');
    imgElement.dataset.rotation = rotation; 
    
    if (isFlipped && originalSrc) {
        thumbnailElement.dataset.isFlipped = 'true';
        thumbnailElement.dataset.originalSrc = originalSrc;
        imgElement.src = imageSrc;
    } else {
        thumbnailElement.dataset.isFlipped = 'false';
        imgElement.src = imageSrc;
    }

    thumbnailElement.appendChild(imgElement);

    if (isBlocker) {
        addBlockerOverlay(thumbnailElement);
    }

    const counterOverlay = document.createElement('div');
    counterOverlay.classList.add('card-counter-overlay');
    counterOverlay.dataset.counter = counter;
    counterOverlay.textContent = counter;
    counterOverlay.style.display = counter > 0 ? 'flex' : 'none';
    thumbnailElement.appendChild(counterOverlay);

    const customCounterContainer = document.createElement('div');
    customCounterContainer.classList.add('custom-counter-container');
    customCounterContainer.style.position = 'absolute';
    customCounterContainer.style.bottom = '5px';
    customCounterContainer.style.left = '5px';
    customCounterContainer.style.display = 'flex';
    customCounterContainer.style.flexWrap = 'wrap';
    customCounterContainer.style.gap = '2px';
    customCounterContainer.style.pointerEvents = 'auto'; 
    customCounterContainer.style.zIndex = '15';
    thumbnailElement.appendChild(customCounterContainer);

    if (memo) thumbnailElement.dataset.memo = memo;
    if (flavor1) thumbnailElement.dataset.flavor1 = flavor1;
    if (flavor2) thumbnailElement.dataset.flavor2 = flavor2;
    if (ownerPrefix) thumbnailElement.dataset.ownerPrefix = ownerPrefix;
    
    thumbnailElement.dataset.customCounters = JSON.stringify(customCounters);
    renderCustomCounters(thumbnailElement, customCounters);

    if (rotation) {
        const { width, height } = getCardDimensions();
        if (Math.abs(rotation) % 180 !== 0) {
            slotElement.classList.add('rotated-90');
            const scaleFactor = height / width;
            imgElement.style.transform = `rotate(${rotation}deg) scale(${scaleFactor})`;
        } else {
            imgElement.style.transform = `rotate(${rotation}deg)`;
        }
    }

    if (insertAtBottom) {
        const firstCard = slotElement.querySelector('.thumbnail');
        if (firstCard) {
            slotElement.insertBefore(thumbnailElement, firstCard);
        } else {
            slotElement.appendChild(thumbnailElement);
        }
    } else {
        slotElement.appendChild(thumbnailElement);
    }

    addCardEventListeners(thumbnailElement);

    if (isMasturbating) {
        toggleMasturbation(thumbnailElement, true, true); 
    }

    return thumbnailElement;
}

function addCardEventListeners(thumbnailElement) {
    thumbnailElement.addEventListener('dragstart', handleDragStart);
    thumbnailElement.addEventListener('dragend', handleDragEnd);
    thumbnailElement.addEventListener('click', handleCardClick);
    thumbnailElement.addEventListener('contextmenu', handleCardContextMenu);
    thumbnailElement.addEventListener('mouseover', handleCardMouseOver);
    thumbnailElement.addEventListener('mouseout', handleCardMouseOut);
}

function handleCardClick(e) {
    const thumbnailElement = e.target.closest('.thumbnail');
    if (!thumbnailElement) return;
    const slotElement = thumbnailElement.parentNode;
    const parentZoneId = getParentZoneId(slotElement);
    const baseParentZoneId = getBaseId(parentZoneId);

    if (e.ctrlKey || e.metaKey) {
        e.stopPropagation();
        
        if (thumbnailElement.dataset.isDecoration === 'true') return;

        if (selectedCards.includes(thumbnailElement)) {
            selectedCards = selectedCards.filter(card => card !== thumbnailElement);
            thumbnailElement.classList.remove('selected-card');
        } else {
            selectedCards.push(thumbnailElement);
            thumbnailElement.classList.add('selected-card');
        }
        return; 
    }

    if (baseParentZoneId === 'token-zone-slots' || baseParentZoneId === 'c-free-space') {
        e.stopPropagation();
        return;
    }

    if (isDecorationMode && decorationZones.includes(baseParentZoneId)) {
        openDecorationImageDialog(slotElement);
        e.stopPropagation();
        return;
    }

    if (thumbnailElement.dataset.isDecoration === 'true') {
        return;
    }
    
    if (typeof isBattleTargetMode !== 'undefined' && isBattleTargetMode) {
        return;
    }
    
    if (contextMenu.style.display === 'block' || memoEditorModal.style.display === 'block' || flavorEditorModal.style.display === 'block' || draggedItem) {
        return;
    }

    if (getExistingThumbnail(slotElement) !== thumbnailElement) {
        e.stopPropagation();
        return;
    }

    const imgElement = thumbnailElement.querySelector('.card-image');
    if (!imgElement) return;

    if (nonRotatableZones.includes(baseParentZoneId) || baseParentZoneId === 'free-space-slots') {
        e.stopPropagation();
        return;
    }

    if (typeof saveStateForUndo === 'function') saveStateForUndo();

    let currentRotation = parseInt(imgElement.dataset.rotation) || 0;
    const idPrefix = getPrefixFromZoneId(parentZoneId);
    const manaCounterValueElement = document.getElementById(idPrefix + 'mana-counter-value');

    if (currentRotation === 0) {
        if (baseParentZoneId.startsWith('mana')) {
            if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 3) { 
                if (typeof confirmWarning === 'function' && !confirmWarning('warnManaPlacementPhase', '現在メインステップではありません。マナをタップしますか？')) {
                    e.stopPropagation();
                    return;
                }
            }
        }

        currentRotation = 90;
        slotElement.classList.add('rotated-90');
        const { width, height } = getCardDimensions();
        const scaleFactor = height / width;
        imgElement.style.transform = `rotate(${currentRotation}deg) scale(${scaleFactor})`;

        if (baseParentZoneId.startsWith('mana')) {
            if (typeof autoConfig !== 'undefined' && autoConfig.autoManaTap) {
                if (manaCounterValueElement) {
                    const currentValue = parseInt(manaCounterValueElement.value) || 0;
                    manaCounterValueElement.value = currentValue + 1;
                    
                    if (typeof recordAction === 'function') {
                        recordAction({
                            type: 'counterChange',
                            inputId: idPrefix + 'mana-counter-value',
                            change: 1
                        });
                    }
                }
            }
            playSe('マナ増加.mp3');
        } else {
            playSe('タップ.mp3');
        }
    } else {
        if (!baseParentZoneId.startsWith('mana')) {
            if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 2) { 
                if (typeof confirmWarning === 'function' && !confirmWarning('warnUntapPhase', '現在アンタップステップではありません。カードをアンタップしますか？')) {
                    e.stopPropagation();
                    return;
                }
            }
        }

        currentRotation = 0;
        slotElement.classList.remove('rotated-90');
        imgElement.style.transform = `rotate(${currentRotation}deg)`;
        
        if (!baseParentZoneId.startsWith('mana')) playSe('タップ.mp3'); 
    }
    imgElement.dataset.rotation = currentRotation;
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'rotate',
            zoneId: parentZoneId,
            slotIndex: Array.from(slotElement.parentNode.children).indexOf(slotElement),
            rotation: currentRotation
        });
    }
    
    e.stopPropagation();
}

function handleDragStart(e) {
    const thumbnailElement = e.target;
    if (thumbnailElement.dataset.isDecoration === 'true' && !isDecorationMode) {
        e.preventDefault();
        return;
    }
    draggedItem = thumbnailElement;

    if (!selectedCards.includes(thumbnailElement)) {
        selectedCards.forEach(card => card.classList.remove('selected-card'));
        selectedCards = [thumbnailElement];
        thumbnailElement.classList.add('selected-card');
    }

    const slotElement = thumbnailElement.parentNode;
    const parentZoneId = getParentZoneId(slotElement);
    const baseParentZoneId = getBaseId(parentZoneId);

    if (baseParentZoneId !== 'token-zone-slots') {
        setTimeout(() => {
            selectedCards.forEach(card => {
                card.style.visibility = 'hidden';
            });
        }, 0);
    }
    
    e.dataTransfer.setData('text/plain', '');
}

function handleDragEnd(e) {
    const thumbnailElement = e.target;
    
    selectedCards.forEach(card => {
        card.style.visibility = 'visible';
    });
    
    draggedItem = null;
}

function handleCardContextMenu(e) {
    if (isDecorationMode) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    
    if (typeof isBattleTargetMode !== 'undefined' && isBattleTargetMode) {
        e.preventDefault();
        e.stopPropagation();
        return;
    }
    
    if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
        if (attackMenuItem) attackMenuItem.style.display = 'none';
    } else {
        if (attackMenuItem) attackMenuItem.style.display = 'block';
    }

    e.preventDefault();
    e.stopPropagation();
    const thumbnailElement = e.target.closest('.thumbnail');
    
    lastRightClickedElement = thumbnailElement;

    if (memoEditorModal.style.display === 'block' || flavorEditorModal.style.display === 'block') {
        return;
    }

    const sourceZoneId = getParentZoneId(thumbnailElement.parentNode);
    const sourceBaseId = getBaseId(sourceZoneId);
    const isIconZone = (sourceBaseId === 'icon-zone');
    const isTokenZone = (sourceBaseId === 'token-zone-slots');
    const isCNavi = (sourceBaseId === 'c-free-space');
    const idPrefix = getPrefixFromZoneId(sourceZoneId);

    const slotIndex = Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode);

    if (attackMenuItem) {
        currentAttackHandler = () => {
            triggerEffect(thumbnailElement, 'attack');
        };
    }

    currentActionHandler = () => {
        triggerEffect(thumbnailElement, 'effect');
    };
    
    currentTargetHandler = () => {
        triggerEffect(thumbnailElement, 'target');
    };

    if (permanentMenuItem) {
        const isPermanent = thumbnailElement.dataset.isPermanent === 'true';
        permanentMenuItem.textContent = isPermanent ? '発動停止' : '常時発動';
        
        currentPermanentHandler = () => {
            if (typeof saveStateForUndo === 'function') saveStateForUndo(); 
            const newState = !isPermanent;
            thumbnailElement.dataset.isPermanent = newState;
            
            if (newState) {
                playSe('常時発動.mp3');
            }
            
            if (typeof recordAction === 'function') {
                recordAction({ 
                    type: 'permanent', 
                    zoneId: sourceZoneId, 
                    slotIndex: slotIndex, 
                    isPermanent: newState 
                });
            }
        };
    }

    currentAddFlavorHandler = () => openFlavorEditor(thumbnailElement);
    currentViewIllustrationHandler = () => openIllustrationViewer(thumbnailElement);
    currentDeleteHandler = () => deleteCard(thumbnailElement);
    
    const wrapMoveHandler = (handler) => {
        return () => {
            if (typeof closeBattleConfirmModal === 'function') closeBattleConfirmModal();
            handler();
        };
    };

    currentMoveToGraveHandler = wrapMoveHandler(() => moveCardToMultiZone(thumbnailElement, 'grave'));
    currentMoveToExcludeHandler = wrapMoveHandler(() => moveCardToMultiZone(thumbnailElement, 'exclude'));
    currentMoveToHandHandler = wrapMoveHandler(() => moveCardToMultiZone(thumbnailElement, 'hand'));
    currentMoveToDeckHandler = wrapMoveHandler(() => moveCardToMultiZone(thumbnailElement, 'deck'));
    currentMoveToSideDeckHandler = wrapMoveHandler(() => moveCardToMultiZone(thumbnailElement, 'side-deck'));
    
    if (exportCardMenuItem) {
        currentExportCardHandler = () => exportSingleCard(thumbnailElement);
    }
    
    if (importCardMenuItem) {
        importCardMenuItem.style.display = 'none';
    }
    
    currentAddCounterHandler = () => addCounterToCard(thumbnailElement);
    currentRemoveCounterHandler = () => removeCounterFromCard(thumbnailElement);
    currentMemoHandler = () => {
        currentMemoTarget = thumbnailElement;
        memoTextarea.value = thumbnailElement.dataset.memo || '';
        openMemoEditor();
    };
    currentFlipHandler = () => flipCard(thumbnailElement, idPrefix);

    if (masturbateMenuItem) {
        masturbateMenuItem.style.display = 'block';
        const isMasturbating = thumbnailElement.dataset.isMasturbating === 'true';
        masturbateMenuItem.textContent = isMasturbating ? 'オナニーを止める' : 'オナニーする';

        currentMasturbateHandler = () => {
            if (!isMasturbating && typeof confirmWarning === 'function') {
                if (!confirmWarning('warnMasturbateDrain', 'オナニーを開始するとBPが自動減少します。よろしいですか？')) {
                    return;
                }
            }

            if (typeof saveStateForUndo === 'function') saveStateForUndo(); 
            const newState = !isMasturbating;
            toggleMasturbation(thumbnailElement, newState); 
            
            if (typeof recordAction === 'function') {
                recordAction({ 
                    type: 'masturbate', 
                    zoneId: sourceZoneId, 
                    slotIndex: slotIndex, 
                    isMasturbating: newState 
                });
            }
        };
    }
    
    if (blockerMenuItem) {
        blockerMenuItem.style.display = 'block';
        const isBlocker = thumbnailElement.dataset.isBlocker === 'true';
        blockerMenuItem.textContent = isBlocker ? 'ブロッカー効果を削除' : 'ブロッカー効果を付与';
        currentBlockerHandler = () => {
            toggleBlocker(thumbnailElement);
        };
    }

    const resetBpItem = document.getElementById('context-menu-reset-bp');
    if (resetBpItem) {
        resetBpItem.onclick = (e) => {
            e.stopPropagation();
            if (thumbnailElement && typeof resetCardBP === 'function') {
                resetCardBP(thumbnailElement);
                if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
                    if (typeof window.updateBattleConfirmModal === 'function') {
                        window.updateBattleConfirmModal();
                    }
                }
            }
            closeContextMenu();
        };
    }

    const hideMoveFlip = isIconZone || isTokenZone || isCNavi;
    
    toGraveMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    toExcludeMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    toHandMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    toDeckMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    toSideDeckMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    flipMenuItem.style.display = hideMoveFlip ? 'none' : 'block';
    
    const moveItem = document.getElementById('context-menu-to-grave');
    const moveParentLi = moveItem ? moveItem.closest('.has-submenu') : null;
    
    if (moveParentLi) {
        moveParentLi.style.display = hideMoveFlip ? 'none' : 'flex';
    }
    
    if (exportCardMenuItem) exportCardMenuItem.style.display = 'block';

    actionMenuItem.style.display = 'block';
    if (permanentMenuItem) permanentMenuItem.style.display = 'block'; 
    targetMenuItem.style.display = 'block';
    blockerMenuItem.style.display = 'block';

    memoMenuItem.style.display = 'block';
    if (viewIllustrationMenuItem) viewIllustrationMenuItem.style.display = 'block';
    if (addFlavorMenuItem) {
        addFlavorMenuItem.textContent = 'フレーバーイラスト編集';
        addFlavorMenuItem.style.display = 'block';
    }
    
    const addCounterItem = document.getElementById('context-menu-add-counter');
    const counterParent = addCounterItem ? addCounterItem.closest('.has-submenu') : null;
    
    const bpItem = document.querySelector('.bp-modify-btn');
    const bpParent = bpItem ? bpItem.closest('.has-submenu') : null;
    
    if (counterParent) {
        counterParent.style.display = (isTokenZone || isCNavi) ? 'none' : 'flex';
    }
    if (bpParent) {
         bpParent.style.display = 'flex';
    }

    deleteMenuItem.style.display = 'block';

    const setAsTopItem = document.getElementById('context-menu-set-as-top');
    if (setAsTopItem) setAsTopItem.style.display = 'none';
    
    const duplicateItem = document.getElementById('context-menu-duplicate');
    if (duplicateItem) duplicateItem.style.display = 'block';

    if (!isIconZone && thumbnailElement.dataset.isDecoration === 'true') {
        if (changeStyleMenuItem) changeStyleMenuItem.style.display = 'block';

        if (attackMenuItem) attackMenuItem.style.display = 'none';
        actionMenuItem.style.display = 'none';
        if (permanentMenuItem) permanentMenuItem.style.display = 'none';
        targetMenuItem.style.display = 'none';
        blockerMenuItem.style.display = 'none'; 
        if (counterParent) counterParent.style.display = 'none';
        if (bpParent) bpParent.style.display = 'none'; 
        if (moveParentLi) moveParentLi.style.display = 'none';
        memoMenuItem.style.display = 'none';
        addFlavorMenuItem.style.display = 'none';
        flipMenuItem.style.display = 'none';
        
        if (masturbateMenuItem) masturbateMenuItem.style.display = 'none';
        if (exportCardMenuItem) exportCardMenuItem.style.display = 'none';
        if (duplicateItem) duplicateItem.style.display = 'none';
        
        deleteMenuItem.style.display = 'none'; 
    } else if (isIconZone) {
        if (changeStyleMenuItem) changeStyleMenuItem.style.display = 'block';
    } else {
        if (changeStyleMenuItem) changeStyleMenuItem.style.display = 'none';
    }
    
    if(typeof exportPreviewMenuItem !== 'undefined') exportPreviewMenuItem.style.display = 'none';
    
    contextMenu.style.top = '0px';
    contextMenu.style.left = '0px';
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.display = 'block';
    
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = e.pageX;
    let top = e.pageY;
    
    const submenus = contextMenu.querySelectorAll('.submenu');
    submenus.forEach(sub => {
        sub.classList.remove('open-left', 'open-top');
    });
    
    if (left + menuWidth + 220 > windowWidth) { 
        left -= menuWidth;
        submenus.forEach(sub => sub.classList.add('open-left'));
    }

    if (top + menuHeight > windowHeight) {
        top -= menuHeight;
        submenus.forEach(sub => sub.classList.add('open-top'));
    }

    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.visibility = 'visible';
}

window.updateCardPreview = function(thumbnailElement) {
    if (!thumbnailElement) return;
    const imgElement = thumbnailElement.querySelector('.card-image');
    if (!imgElement) return;

    const commonPreviewArea = document.getElementById('common-card-preview');
    const previewImageContainer = commonPreviewArea.querySelector('#preview-image-container');
    previewImageContainer.innerHTML = '';
    const previewImg = document.createElement('img');
    previewImg.src = thumbnailElement.dataset.isFlipped === 'true' ? (thumbnailElement.dataset.originalSrc || imgElement.src) : imgElement.src;
    
    previewImg.onerror = () => previewImg.remove();

    previewImageContainer.appendChild(previewImg);

    commonPreviewArea.dataset.flavor1 = thumbnailElement.dataset.flavor1 || '';
    commonPreviewArea.dataset.flavor2 = thumbnailElement.dataset.flavor2 || '';

    const memo = thumbnailElement.dataset.memo || '';

    const extractData = (key, altKey = null) => {
        let regex = new RegExp(`\\[${key}:([\\s\\S]*?)\\](?:\\/([^/]*)\\/([^/]*)\\/([^/]*)\\/([^/]*)\\/)?`, 'i');
        let match = memo.match(regex);
        
        if (!match && altKey) {
             regex = new RegExp(`\\[${altKey}:([\\s\\S]*?)\\](?:\\/([^/]*)\\/([^/]*)\\/([^/]*)\\/([^/]*)\\/)?`, 'i');
             match = memo.match(regex);
        }

        if (match && match[1]) {
            const value = match[1].trim();
            if (value === '' || value === '-') return null;
            
            return {
                value: value,
                color: match[2] || null,
                bg: match[3] || null,
                opacity: match[4] || null,
                display: match[5] || null
            };
        }
        return null;
    };

    const cardInfo = {
        attribute: extractData('属性'),
        cost: extractData('マナ', 'コスト'), 
        bp: extractData('BP'),
        spell: extractData('スペル'),
        cardName: extractData('カード名'),
        flavor: extractData('フレーバーテキスト'),
        effect: extractData('効果'),
    };

    const applyStyles = (element, data) => {
        if (!element) return;
        
        element.style.color = '';
        element.style.backgroundColor = '';
        element.style.opacity = '';
        element.classList.remove('preview-hidden');

        if (!data) {
            element.style.display = 'none';
            element.textContent = '';
            return;
        }

        if (data.display === '非表示') {
            element.style.display = 'none';
            return;
        }

        element.style.display = 'block'; 
        
        if (data.color) element.style.color = data.color;
        if (data.bg) element.style.backgroundColor = data.bg;
        if (data.opacity) element.style.opacity = data.opacity;
    };

    const previewElements = {
        'preview-attribute': cardInfo.attribute,
        'preview-cost': cardInfo.cost,
        'preview-card-name': cardInfo.cardName,
        'preview-top-right-stat': cardInfo.spell || cardInfo.bp, 
        'preview-flavor-text': cardInfo.flavor,
        'preview-effect-text': cardInfo.effect,
    };

    const prefixMap = {
        'preview-attribute': '属性: ',
        'preview-cost': 'マナ: ',
        'preview-top-right-stat': (cardInfo.spell) ? 'スペル: ' : 'BP: ',
        'preview-card-name': '',
        'preview-flavor-text': '',
        'preview-effect-text': ''
    };

    Object.keys(previewElements).forEach(id => {
        const el = commonPreviewArea.querySelector(`#${id}`);
        const data = previewElements[id];
        
        if (el) {
            applyStyles(el, data);
            if (data && data.display !== '非表示') {
                el.textContent = (prefixMap[id] || '') + data.value;
            }
        }
    });

    const memoTooltip = document.getElementById('memo-tooltip');
    if (memo && memoTooltip) {
        let displayMemo = memo;

        const tagsToRemove = ['BP内訳', 'フレーバーテキスト', '効果'];
        
        tagsToRemove.forEach(tag => {
            const regex = new RegExp(`\\[${tag}:[\\s\\S]*?\\](?:\\/[^/]*\\/[^/]*\\/[^/]*\\/[^/]*\\/?)(?:\\r\\n|\\n|\\r)?`, 'g');
            displayMemo = displayMemo.replace(regex, '');
        });

        displayMemo = displayMemo.replace(/(\[[^\]]+\])\/[^/]*\/[^/]*\/[^/]*\/[^/]*\/?/g, '$1');
        
        displayMemo = displayMemo.replace(/^\s*[\r\n]/gm, '');

        if (displayMemo.trim()) {
            memoTooltip.textContent = displayMemo;
            memoTooltip.style.display = 'block';
        } else {
            memoTooltip.style.display = 'none';
        }
    } else if (memoTooltip) {
        memoTooltip.style.display = 'none';
    }
};

function handleCardMouseOver(e) {
    const thumbnailElement = e.target.closest('.thumbnail');
    if (thumbnailElement) {
        if (typeof lastHoveredElement !== 'undefined') {
            lastHoveredElement = thumbnailElement;
        }
        window.updateCardPreview(thumbnailElement);
    }
    e.stopPropagation();
}

function handleCardMouseOut(e) {
    const memoTooltip = document.getElementById('memo-tooltip');
    if(memoTooltip) memoTooltip.style.display = 'none';
    if (typeof lastHoveredElement !== 'undefined') {
        lastHoveredElement = null;
    }
    e.stopPropagation();
}

function deleteCard(thumbnailElement) {
    if (typeof saveStateForUndo === 'function') saveStateForUndo();

    const slotElement = thumbnailElement.parentNode;
    if (!slotElement) return;

    const parentZoneId = getParentZoneId(slotElement);
    const baseParentZoneId = getBaseId(parentZoneId);
    
    toggleMasturbation(thumbnailElement, false, true); 

    if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
        if (thumbnailElement === currentAttacker || thumbnailElement === currentBattleTarget) {
            if (typeof closeBattleConfirmModal === 'function') closeBattleConfirmModal();
        }
    }

    if (typeof recordAction === 'function') {
        recordAction({
            type: 'delete',
            zoneId: parentZoneId,
            slotIndex: Array.from(slotElement.parentNode.children).indexOf(slotElement)
        });
    }

    if (typeof selectedCards !== 'undefined' && selectedCards.includes(thumbnailElement)) {
        selectedCards = selectedCards.filter(c => c !== thumbnailElement);
    }

    slotElement.removeChild(thumbnailElement);
    
    const commonPreviewArea = document.getElementById('common-card-preview');
    const previewImageContainer = commonPreviewArea.querySelector('#preview-image-container');
    previewImageContainer.innerHTML = '<p>カードにカーソルを合わせてください</p>';
    
    ['preview-attribute', 'preview-cost', 'preview-top-right-stat', 'preview-card-name', 'preview-flavor-text', 'preview-effect-text'].forEach(id => {
        const el = commonPreviewArea.querySelector(`#${id}`);
        if(el) {
            el.style.display = 'none';
            el.style.color = '';
            el.style.backgroundColor = '';
            el.style.opacity = '';
            el.classList.remove('preview-hidden');
        }
    });

    delete commonPreviewArea.dataset.flavor1;
    delete commonPreviewArea.dataset.flavor2;

    resetSlotToDefault(slotElement);
    updateSlotStackState(slotElement);
    draggedItem = null;

    if (baseParentZoneId.endsWith('-back-slots')) {
        arrangeSlots(parentZoneId);
        syncMainZoneImage(baseParentZoneId.replace('-back-slots', ''));
    } else if (baseParentZoneId === 'hand-zone' || baseParentZoneId === 'free-space-slots' || baseParentZoneId === 'token-zone-slots' || baseParentZoneId === 'c-free-space') {
        arrangeSlots(parentZoneId);
    } else if (thumbnailElement.dataset.isDecoration === 'true') {
        syncMainZoneImage(baseParentZoneId);
    }

    if (typeof window.updatePlaymatState === 'function') {
        window.updatePlaymatState();
    }
}

function addCounterToCard(thumbnailElement, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    const counterOverlay = thumbnailElement.querySelector('.card-counter-overlay');
    if (!counterOverlay) return;
    let count = parseInt(counterOverlay.dataset.counter) || 0;
    count++;
    counterOverlay.dataset.counter = count;
    counterOverlay.textContent = count;
    counterOverlay.style.display = 'flex';
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'cardCounter',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            slotIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            counter: count
        });
    }
}

function removeCounterFromCard(thumbnailElement, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    const counterOverlay = thumbnailElement.querySelector('.card-counter-overlay');
    if (!counterOverlay) return;
    let count = parseInt(counterOverlay.dataset.counter) || 0;
    if (count > 0) count--;
    counterOverlay.dataset.counter = count;
    counterOverlay.textContent = count;
    if (count === 0) counterOverlay.style.display = 'none';
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'cardCounter',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            slotIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            counter: count
        });
    }
}

function flipCard(thumbnailElement, idPrefix, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    const imgElement = thumbnailElement.querySelector('.card-image');
    if (!imgElement) return;

    const isFlipped = thumbnailElement.dataset.isFlipped === 'true';

    if (isFlipped) {
        resetCardFlipState(thumbnailElement);
    } else {
        const deckZone = document.getElementById(idPrefix + 'deck');
        let deckImgSrc = './decoration/デッキ.png';
        if (deckZone) {
            const decoratedThumbnail = deckZone.querySelector('.thumbnail[data-is-decoration="true"]');
            if (decoratedThumbnail) {
                const decoratedImg = decoratedThumbnail.querySelector('.card-image');
                if (decoratedImg) deckImgSrc = decoratedImg.src;
            }
        }
        thumbnailElement.dataset.originalSrc = imgElement.src;
        imgElement.src = deckImgSrc;
        thumbnailElement.dataset.isFlipped = 'true';
    }
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'flip',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            slotIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            isFlipped: !isFlipped
        });
    }

    const slotElement = thumbnailElement.parentNode;
    const parentZoneId = getParentZoneId(slotElement);
    const baseParentZoneId = getBaseId(parentZoneId);

    if (baseParentZoneId.endsWith('-back-slots')) {
        syncMainZoneImage(baseParentZoneId.replace('-back-slots', ''));
    }
}

function resetCardFlipState(thumbnailElement) {
    if (!thumbnailElement || thumbnailElement.dataset.isFlipped !== 'true') {
        return;
    }
    const originalSrc = thumbnailElement.dataset.originalSrc;
    const imgElement = thumbnailElement.querySelector('.card-image');
    if (imgElement && originalSrc) {
        imgElement.src = originalSrc;
        thumbnailElement.dataset.isFlipped = 'false';
        delete thumbnailElement.dataset.originalSrc;
    }
}

function toggleBlocker(thumbnailElement, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    const isBlocker = thumbnailElement.dataset.isBlocker === 'true';
    const newState = !isBlocker;
    thumbnailElement.dataset.isBlocker = newState;
    
    if (newState) {
        addBlockerOverlay(thumbnailElement);
    } else {
        removeBlockerOverlay(thumbnailElement);
    }
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'blocker',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            slotIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            isBlocker: newState
        });
    }
}

function addBlockerOverlay(thumbnailElement) {
    if (thumbnailElement.querySelector('.blocker-overlay')) return;
    const overlay = document.createElement('div');
    overlay.classList.add('blocker-overlay');
    const img = document.createElement('img');
    img.src = './decoration/ブロッカー.png';
    img.onerror = () => { overlay.remove(); console.warn('ブロッカー画像が見つかりません: ./decoration/ブロッカー.png'); };
    overlay.appendChild(img);
    
    const counter = thumbnailElement.querySelector('.card-counter-overlay');
    if(counter) {
        thumbnailElement.insertBefore(overlay, counter);
    } else {
        thumbnailElement.appendChild(overlay);
    }
}

function removeBlockerOverlay(thumbnailElement) {
    const overlay = thumbnailElement.querySelector('.blocker-overlay');
    if (overlay) thumbnailElement.removeChild(overlay);
}

function triggerEffect(thumbnailElement, type) {
    if (typeof effectConfig !== 'undefined' && effectConfig[type] === false) return;

    if (type === 'attack') {
        if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 4) { 
            if (typeof confirmWarning === 'function' && !confirmWarning('warnAttackPhase', '現在バトルステップではありません。攻撃しますか？')) {
                return;
            }
        }

        const inBattleZone = thumbnailElement.closest('.battle-zone');
        if (!inBattleZone) {
             if (typeof confirmWarning === 'function' && !confirmWarning('warnAttackPhase', 'バトルエリア以外からは攻撃できません。攻撃しますか？')) {
                 return;
             }
        }

        const deployedTurn = parseInt(thumbnailElement.dataset.deployedTurn);
        const currentTurnInput = document.getElementById('common-turn-value');
        const currentTurn = currentTurnInput ? parseInt(currentTurnInput.value) : null;

        if (deployedTurn && currentTurn && deployedTurn === currentTurn) {
            if (typeof confirmWarning === 'function' && !confirmWarning('warnSummoningSickness', 'このカードはこのターンに配置されました（召喚酔い）。攻撃しますか？')) {
                return;
            }
        }
    }

    let className = 'effect-active';
    if (type === 'target') className = 'target-active';
    else if (type === 'attack') className = 'attack-active';

    thumbnailElement.classList.add(className);
    
    setTimeout(() => {
        thumbnailElement.classList.remove(className);
        
        if (type === 'attack' && typeof autoConfig !== 'undefined' && autoConfig.autoAttackTap) {
            const imgElement = thumbnailElement.querySelector('.card-image');
            const slotElement = thumbnailElement.parentNode;
            if (imgElement && slotElement) {
                const currentRotation = parseInt(imgElement.dataset.rotation) || 0;
                if (currentRotation === 0) { 
                    if (typeof saveStateForUndo === 'function') saveStateForUndo(); 

                    const newRotation = 90;
                    slotElement.classList.add('rotated-90');
                    const { width, height } = getCardDimensions();
                    const scaleFactor = height / width;
                    imgElement.style.transform = `rotate(${newRotation}deg) scale(${scaleFactor})`;
                    imgElement.dataset.rotation = newRotation;
                    playSe('タップ.mp3');
                    
                    if (typeof recordAction === 'function') {
                        recordAction({
                            type: 'rotate',
                            zoneId: getParentZoneId(slotElement),
                            slotIndex: Array.from(slotElement.parentNode.children).indexOf(slotElement),
                            rotation: newRotation
                        });
                    }
                }
            }
        }
    }, 1000); 
    
    if (typeof recordAction === 'function') {
        recordAction({
            type: 'effect',
            subType: type,
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            slotIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode)
        });
    }
}

function toggleMasturbation(thumbnailElement, newState, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function' && thumbnailElement.dataset.isMasturbating !== String(newState)) {
         saveStateForUndo();
    }

    thumbnailElement.dataset.isMasturbating = newState;
    
    if (newState) {
        if (typeof autoConfig !== 'undefined' && autoConfig.autoMasturbateDrain) {
            const timerId = setInterval(() => {
                if (!document.body.contains(thumbnailElement)) {
                    clearInterval(timerId);
                    masturbateTimers.delete(thumbnailElement);
                    return;
                }
                modifyCardBP(thumbnailElement, -100, true);
                
                const memo = thumbnailElement.dataset.memo || '';
                const match = memo.match(/\[BP:(.*?)\]/i);
                if (match) {
                    const bp = parseInt(match[1]);
                    if (bp <= 0) {
                        toggleMasturbation(thumbnailElement, false);
                        playSe('オナニー後.mp3');
                    }
                }
            }, 1000);
            masturbateTimers.set(thumbnailElement, timerId);
        }
        playSe('オナニー.wav', true);
    } else {
        const timerId = masturbateTimers.get(thumbnailElement);
        if (timerId) {
            clearInterval(timerId);
            masturbateTimers.delete(thumbnailElement);
        }
        stopSe('オナニー.wav');
    }
}

window.modifyCardBP = function(thumbnailElement, amount, isAuto = false) {
    if (!thumbnailElement) return;
    
    if (!isAuto && typeof saveStateForUndo === 'function') saveStateForUndo();

    let memo = thumbnailElement.dataset.memo || '';
    
    let baseBP = 0;
    let plusMod = 0;
    let minusMod = 0;

    const bpMatch = memo.match(/\[BP:(-?\d+|-)\]/i);
    const detailMatch = memo.match(/\[BP内訳:(.*?)\]/);
    
    if (!bpMatch) return; 
    
    if (detailMatch) {
        const content = detailMatch[1];
        const baseMatch = content.match(/基本(-?\d+)/);
        if (baseMatch) baseBP = parseInt(baseMatch[1]);
        
        const plusMatch = content.match(/補正\+(\d+)/);
        if (plusMatch) plusMod = parseInt(plusMatch[1]);

        const minusMatch = content.match(/補正-(\d+)/);
        if (minusMatch) minusMod = parseInt(minusMatch[1]);
    } else {
        const val = bpMatch[1];
        if (val === '-') return;
        baseBP = parseInt(val);
    }
    
    if (amount > 0) {
        plusMod += amount;
    } else {
        minusMod += Math.abs(amount);
    }
    
    let newBP = baseBP + plusMod - minusMod;
    if (newBP < 0) newBP = 0;
    
    let detailString = `基本${baseBP}`;
    if (plusMod > 0) detailString += `/補正+${plusMod}`;
    if (minusMod > 0) detailString += `/補正-${minusMod}`;
    
    const newDetailTag = `[BP内訳:${detailString}]`;
    const newBPTag = `[BP:${newBP}]`;
    
    let newMemo = memo.replace(/\[BP:(-?\d+|-)\]/i, newBPTag);
    
    if (detailMatch) {
        newMemo = newMemo.replace(/\[BP内訳:.*?\]/, newDetailTag);
    } else {
        if (!newMemo.endsWith('\n')) {
            newMemo += '\n';
        }
        newMemo += newDetailTag;
    }
    
    thumbnailElement.dataset.memo = newMemo;
    
    const enableBpEffect = typeof effectConfig === 'undefined' || effectConfig.bpChange !== false;

    if (amount > 0) {
        playSe('BPプラス.mp3');
        if (enableBpEffect) {
            thumbnailElement.classList.add('bp-increase-active');
            setTimeout(() => thumbnailElement.classList.remove('bp-increase-active'), 800);
            
            if (typeof showFloatingPopup === 'function') {
                showFloatingPopup(thumbnailElement, amount, 'BP', 'BP');
            }
        }
    } else if (amount < 0) {
        playSe('BPマイナス.mp3');
        if (enableBpEffect) {
            thumbnailElement.classList.add('bp-decrease-active');
            setTimeout(() => thumbnailElement.classList.remove('bp-decrease-active'), 800);
            
            if (typeof showFloatingPopup === 'function') {
                showFloatingPopup(thumbnailElement, amount, 'BP', 'BP');
            }
        }
    }
    
    if (typeof window.updateCardPreview === 'function') {
        if (typeof lastHoveredElement !== 'undefined' && lastHoveredElement === thumbnailElement) {
            window.updateCardPreview(thumbnailElement);
        } else if (typeof lastHoveredElement === 'undefined' && !isAuto) {
             window.updateCardPreview(thumbnailElement);
        }
    }
    
    if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
        if (typeof window.updateBattleConfirmModal === 'function') {
            window.updateBattleConfirmModal();
        }
    }
    
    if (typeof autoConfig !== 'undefined' && autoConfig.autoBpDestruction) {
        if (newBP <= 0) {
            checkBpDestruction(thumbnailElement);
        }
    }
    
    if (!isAuto && typeof recordAction === 'function') {
         recordAction({
            type: 'memoChange',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            cardIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            memo: newMemo
        });
    }
};

window.resetCardBP = function(thumbnailElement, skipUndo = false) {
    if (!thumbnailElement) return;
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    let memo = thumbnailElement.dataset.memo || '';
    const detailMatch = memo.match(/\[BP内訳:(.*?)\]/);
    
    if (!detailMatch) {
        return;
    }
    
    const parts = detailMatch[1].split('/');
    const basePart = parts[0]; 
    const baseMatch = basePart.match(/基本(-?\d+)/);
    
    if (!baseMatch) return;
    
    const baseBP = parseInt(baseMatch[1]);
    const newBPTag = `[BP:${baseBP}]`;
    
    let newMemo = memo.replace(/\[BP:(-?\d+|-)\]/i, newBPTag);
    newMemo = newMemo.replace(/\[BP内訳:.*?\](\r\n|\n|\r)?/, '');
    
    newMemo = newMemo.replace(/\n\n/g, '\n');
    newMemo = newMemo.trim();

    thumbnailElement.dataset.memo = newMemo;
    playSe('ボタン共通.mp3');
    
    if (typeof window.updateCardPreview === 'function') {
        window.updateCardPreview(thumbnailElement);
    }
    
    if (typeof recordAction === 'function') {
         recordAction({
            type: 'memoChange',
            zoneId: getParentZoneId(thumbnailElement.parentNode),
            cardIndex: Array.from(thumbnailElement.parentNode.parentNode.children).indexOf(thumbnailElement.parentNode),
            memo: newMemo
        });
    }
};

function checkBpDestruction(thumbnailElement) {
    const slot = thumbnailElement.parentNode;
    const zoneId = getParentZoneId(slot);
    const baseZoneId = getBaseId(zoneId);
    
    const targetZones = ['battle', 'special1', 'special2', 'spell', 'mana', 'mana-left', 'mana-right'];
    const isTargetZone = targetZones.some(z => baseZoneId.includes(z));
    
    if (isTargetZone) {
        if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
             if (typeof closeBattleConfirmModal === 'function') closeBattleConfirmModal();
        }
        
        thumbnailElement.classList.add('target-active');
        
        setTimeout(() => {
            
            thumbnailElement.classList.remove('target-active');
            thumbnailElement.classList.add('attack-active');
            
            setTimeout(() => {
                thumbnailElement.classList.remove('attack-active');
                if (typeof moveCardToMultiZone === 'function') {
                    moveCardToMultiZone(thumbnailElement, 'grave'); 
                }
            }, 800);
        }, 600);
    }
}

function exportSingleCard(thumbnailElement) {
    if (!thumbnailElement) return;

    const imgElement = thumbnailElement.querySelector('.card-image');
    const cardData = {
        src: imgElement ? imgElement.src : '',
        isDecoration: thumbnailElement.dataset.isDecoration === 'true',
        isFlipped: thumbnailElement.dataset.isFlipped === 'true',
        originalSrc: thumbnailElement.dataset.originalSrc || null,
        counter: parseInt(thumbnailElement.querySelector('.card-counter-overlay')?.dataset.counter) || 0,
        memo: thumbnailElement.dataset.memo || '',
        flavor1: thumbnailElement.dataset.flavor1 || '',
        flavor2: thumbnailElement.dataset.flavor2 || '',
        rotation: parseInt(imgElement?.dataset.rotation) || 0,
        isMasturbating: thumbnailElement.dataset.isMasturbating === 'true',
        isBlocker: thumbnailElement.dataset.isBlocker === 'true',
        isPermanent: thumbnailElement.dataset.isPermanent === 'true',
        ownerPrefix: thumbnailElement.dataset.ownerPrefix || '',
        customCounters: JSON.parse(thumbnailElement.dataset.customCounters || '[]'),
        deployedTurn: thumbnailElement.dataset.deployedTurn || null
    };

    let fileName = 'card_data';
    const nameMatch = cardData.memo.match(/\[カード名:(.*?)\]/);
    if (nameMatch && nameMatch[1]) {
        fileName = nameMatch[1].trim();
    }

    const userInput = prompt("保存するファイル名を入力してください", fileName);
    if (!userInput) return;

    const jsonData = JSON.stringify(cardData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userInput}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

window.addCustomCounter = function(thumbnailElement, counterId, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    let counters = JSON.parse(thumbnailElement.dataset.customCounters || '[]');
    counters.push(counterId);
    thumbnailElement.dataset.customCounters = JSON.stringify(counters);
    
    if (typeof renderCustomCounters === 'function') {
        renderCustomCounters(thumbnailElement, counters);
    }
};

window.removeCustomCounter = function(thumbnailElement, counterId, skipUndo = false) {
    if (!skipUndo && typeof saveStateForUndo === 'function') saveStateForUndo();

    let counters = JSON.parse(thumbnailElement.dataset.customCounters || '[]');
    const index = counters.findIndex(c => String(c.id) === String(counterId));
    if (index > -1) {
        counters.splice(index, 1);
        thumbnailElement.dataset.customCounters = JSON.stringify(counters);
        
        if (typeof renderCustomCounters === 'function') {
            renderCustomCounters(thumbnailElement, counters);
        }
        playSe('カウンターを取り除く.mp3');
    }
};

window.renderCustomCounters = function(thumbnailElement, countersArray) {
    const container = thumbnailElement.querySelector('.custom-counter-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const counts = {};
    countersArray.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    
    Object.keys(counts).forEach(id => {
        const typeDef = customCounterTypes.find(c => String(c.id) === String(id));
        if (!typeDef) return;
        
        const item = document.createElement('div');
        item.className = 'custom-counter-item';
        item.title = typeDef.name;
        
        item.style.width = '24px';
        item.style.height = '24px';
        item.style.position = 'relative';
        item.style.display = 'inline-block';
        item.style.margin = '1px';
        
        const img = document.createElement('img');
        img.src = typeDef.icon;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        
        if(counts[id] > 1) {
            const badge = document.createElement('div');
            badge.className = 'counter-badge';
            badge.textContent = counts[id];
            badge.style.position = 'absolute';
            badge.style.bottom = '0';
            badge.style.right = '0';
            badge.style.backgroundColor = 'red';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.fontSize = '10px';
            badge.style.width = '12px';
            badge.style.height = '12px';
            badge.style.display = 'flex';
            badge.style.justifyContent = 'center';
            badge.style.alignItems = 'center';
            
            item.appendChild(badge);
        }
        
        item.addEventListener('click', (e) => {
            e.stopPropagation(); 
            e.preventDefault();
            window.removeCustomCounter(thumbnailElement, id);
        });
        
        item.insertBefore(img, item.firstChild); 
        
        container.appendChild(item);
    });
};

window.executeBattle = function(attackerThumbnail, targetSlot) {
    if (typeof openBattleConfirmModal === 'function') {
        openBattleConfirmModal(attackerThumbnail, targetSlot);
    }
};

window.updateSummoningSicknessVisuals = function() {
    const currentTurnInput = document.getElementById('common-turn-value');
    const currentTurn = currentTurnInput ? parseInt(currentTurnInput.value) : 1;
    
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        if (thumb.dataset.isDecoration === 'true') return;

        const slot = thumb.parentNode;
        const zoneId = getParentZoneId(slot); 
        const baseZoneId = getBaseId(zoneId); 

        if (baseZoneId === 'battle') {
            const deployedTurn = parseInt(thumb.dataset.deployedTurn);
            if (deployedTurn && deployedTurn === currentTurn) {
                thumb.classList.add('summoning-sickness');
            } else {
                thumb.classList.remove('summoning-sickness');
            }
        } else {
            thumb.classList.remove('summoning-sickness');
        }
    });
};