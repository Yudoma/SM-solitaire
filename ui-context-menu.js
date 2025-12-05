function closeContextMenu() {
    if (contextMenu) {
        contextMenu.style.display = 'none';
        const submenus = contextMenu.querySelectorAll('.submenu');
        submenus.forEach(sub => {
            sub.classList.remove('open-left', 'open-top');
        });
        
        const allItems = contextMenu.querySelectorAll('li');
        allItems.forEach(li => {
            li.style.display = ''; 
        });
        
        const hasSubmenus = contextMenu.querySelectorAll('.has-submenu');
        hasSubmenus.forEach(li => {
            li.style.display = ''; 
        });
    }
    
    currentDeleteHandler = null;
    currentMoveToGraveHandler = null;
    currentMoveToExcludeHandler = null;
    currentMoveToHandHandler = null;
    currentMoveToDeckHandler = null;
    currentMoveToSideDeckHandler = null;
    currentFlipHandler = null;
    currentMemoHandler = null;
    currentAddCounterHandler = null;
    currentRemoveCounterHandler = null;
    currentActionHandler = null;
    currentAttackHandler = null;
    currentTargetHandler = null;
    currentPermanentHandler = null;
    currentAddFlavorHandler = null;
    currentViewIllustrationHandler = null;
    currentBlockerHandler = null;
    currentMasturbateHandler = null;
    currentExportCardHandler = null;
    currentImportCardHandler = null;
    currentStockItemTarget = null;
    currentPreviewExportHandler = null;
}

function handleStockItemContextMenu(e, item, targetType, owner, container) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!contextMenu) return;

    const allItems = contextMenu.querySelectorAll('li');
    allItems.forEach(li => li.style.display = 'none');
    
    const topItems = contextMenu.querySelectorAll('#custom-context-menu > ul > li');
    topItems.forEach(li => li.style.display = 'none');

    if (memoMenuItem) memoMenuItem.style.display = 'block'; 
    if (setAsTopMenuItem) setAsTopMenuItem.style.display = 'block';
    
    if (deleteMenuItem) deleteMenuItem.style.display = 'none';
    
    currentMemoHandler = () => {
        currentMemoTarget = item;
        if (typeof memoTextarea !== 'undefined') {
            memoTextarea.value = item.dataset.memo || '';
        }
        if (typeof openMemoEditor === 'function') {
            openMemoEditor(); 
        }
    };
    
    currentStockItemTarget = () => {
        if (typeof setDecorationAsTop === 'function') {
            setDecorationAsTop(item, targetType, owner, container);
        }
    };

    contextMenu.style.display = 'block';
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.zIndex = '10005'; 
    
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let left = e.pageX;
    let top = e.pageY;

    if (left + menuWidth > windowWidth) left -= menuWidth;
    if (top + menuHeight > windowHeight) top -= menuHeight;

    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.visibility = 'visible';
}

function setupContextMenuListeners() {
    if (contextMenu) {
        contextMenu.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    if (actionMenuItem) {
        actionMenuItem.addEventListener('click', () => { 
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
    
            let isMana = false;
            let isSpell = false;
            
            if (lastRightClickedElement) {
                const zoneId = getParentZoneId(lastRightClickedElement);
                if (zoneId) {
                    const baseId = getBaseId(zoneId);
                    if (zoneId.includes('mana') || baseId.startsWith('mana')) {
                        isMana = true;
                    } else if (baseId === 'spell') {
                        isSpell = true;
                    }
                }
            }
            
            if (isMana) {
            } else if (isSpell) {
                playSe('スペル効果発動.mp3');
            } else {
                playSe('効果発動.mp3');
            }
    
            targets.forEach(target => {
                if (target) {
                    if (typeof triggerEffect === 'function') {
                        triggerEffect(target, 'effect');
                    }
                }
            });
    
            closeContextMenu(); 
        });
    }

    if (targetMenuItem) {
        targetMenuItem.addEventListener('click', () => { 
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
    
            playSe('対象に取る.mp3');
            targets.forEach(target => {
                if(target) {
                    if (typeof triggerEffect === 'function') {
                        triggerEffect(target, 'target');
                    }
                }
            });
            
            closeContextMenu(); 
        });
    }
    
    if (attackMenuItem) {
        attackMenuItem.addEventListener('click', async () => {
            let targets = [];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = [...selectedCards];
            } else if (lastRightClickedElement) {
                targets = [lastRightClickedElement];
            }

            if (targets.length === 0) {
                closeContextMenu();
                return;
            }

            if (typeof currentStepIndex !== 'undefined' && currentStepIndex !== 4) { 
                if (typeof confirmWarning === 'function' && !await confirmWarning('warnAttackPhase', '現在バトルステップではありません。攻撃しますか？')) {
                    closeContextMenu();
                    return;
                }
            }

            const allInBattleZone = targets.every(t => t.closest('.battle-zone'));
            if (!allInBattleZone) {
                 if (typeof confirmWarning === 'function' && !await confirmWarning('warnAttackPhase', 'バトルエリア以外からは攻撃できません。攻撃しますか？')) {
                     closeContextMenu();
                     return;
                 }
            }

            const currentTurnInput = document.getElementById('common-turn-value');
            const currentTurn = currentTurnInput ? parseInt(currentTurnInput.value) : null;
            let hasSickness = false;

            if (currentTurn) {
                hasSickness = targets.some(t => {
                    const deployedTurn = parseInt(t.dataset.deployedTurn);
                    return deployedTurn && deployedTurn === currentTurn;
                });
            }

            if (hasSickness) {
                if (typeof confirmWarning === 'function' && !await confirmWarning('warnSummoningSickness', '召喚酔いのカードが含まれています。攻撃しますか？')) {
                    closeContextMenu();
                    return;
                }
            }

            if (typeof startBattleTargetSelection === 'function') {
                startBattleTargetSelection(targets);
            }
            closeContextMenu();
        });
    }

    if (permanentMenuItem) {
        permanentMenuItem.addEventListener('click', () => { 
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            
            const anyPermanent = targets.some(t => t.dataset.isPermanent === 'true');
            const newState = !anyPermanent; 
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
    
            targets.forEach(target => {
                if (!target) return;
                target.dataset.isPermanent = newState;
                if (newState) playSe('常時発動.mp3');
                
                if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                    const zoneId = getParentZoneId(target.parentNode);
                    const slotIndex = Array.from(target.parentNode.parentNode.children).indexOf(target.parentNode);
                    recordAction({ type: 'permanent', zoneId: zoneId, slotIndex: slotIndex, isPermanent: newState });
                }
            });
            
            closeContextMenu(); 
        });
    }
    
    if (blockerMenuItem) {
        blockerMenuItem.addEventListener('click', () => {
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            
            const anyBlocker = targets.some(t => t.dataset.isBlocker === 'true');
            const shouldBeBlocker = !anyBlocker;
    
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
    
            playSe('ブロッカー.mp3');
            targets.forEach(target => {
                const isCurrentlyBlocker = target.dataset.isBlocker === 'true';
                if (isCurrentlyBlocker !== shouldBeBlocker) {
                    if (typeof toggleBlocker === 'function') {
                        toggleBlocker(target, true); 
                    }
                }
            });
            
            closeContextMenu();
        });
    }

    if (deleteMenuItem) {
        deleteMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = [...selectedCards]; 
                selectedCards = []; 
            }
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
            
            targets.forEach(target => {
                if(target && target.parentNode) deleteCard(target);
            });
            
            closeContextMenu(); 
        });
    }

    const performBatchMove = (destinationType) => {
        let targets = [lastRightClickedElement];
        if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
            targets = [...selectedCards];
            selectedCards = [];
        }
        
        if (typeof saveStateForUndo === 'function') saveStateForUndo();
        
        targets.forEach(target => {
            if(target && target.parentNode) {
                if (typeof moveCardToMultiZone === 'function') {
                    moveCardToMultiZone(target, destinationType);
                }
            }
        });
        
        if (typeof closeBattleConfirmModal === 'function') closeBattleConfirmModal();
    };

    if (toGraveMenuItem) {
        toGraveMenuItem.addEventListener('click', () => { 
            playSe('墓地に送る.mp3');
            performBatchMove('grave');
            closeContextMenu(); 
        });
    }
    if (toExcludeMenuItem) {
        toExcludeMenuItem.addEventListener('click', () => { 
            playSe('除外する.mp3');
            performBatchMove('exclude');
            closeContextMenu(); 
        });
    }
    if (toHandMenuItem) {
        toHandMenuItem.addEventListener('click', () => { 
            playSe('手札に戻す.mp3');
            performBatchMove('hand');
            closeContextMenu(); 
        });
    }
    if (toDeckMenuItem) {
        toDeckMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            performBatchMove('deck');
            closeContextMenu(); 
        });
    }
    if (toSideDeckMenuItem) {
        toSideDeckMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            performBatchMove('side-deck');
            closeContextMenu(); 
        });
    }

    if (flipMenuItem) {
        flipMenuItem.addEventListener('click', () => { 
            playSe('カードを反転させる.wav');
            
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
            
            targets.forEach(target => {
                 if(target) {
                     const zoneId = getParentZoneId(target.parentNode);
                     const prefix = getPrefixFromZoneId(zoneId);
                     if (typeof flipCard === 'function') {
                         flipCard(target, prefix, true); 
                     }
                 }
            });
            
            closeContextMenu(); 
        });
    }

    if (memoMenuItem) {
        memoMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            if (typeof currentMemoHandler === 'function') currentMemoHandler(); 
            closeContextMenu(); 
        });
    }
    
    if (setAsTopMenuItem) {
        setAsTopMenuItem.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof currentStockItemTarget === 'function') currentStockItemTarget();
            closeContextMenu();
        });
    }

    if (addCounterMenuItem) {
        addCounterMenuItem.addEventListener('click', () => { 
            playSe('カウンターを置く.mp3');
            
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
            
            targets.forEach(target => {
                 if (typeof addCounterToCard === 'function') {
                     addCounterToCard(target, true); 
                 }
            });
            
            closeContextMenu(); 
        });
    }

    if (removeCounterMenuItem) {
        removeCounterMenuItem.addEventListener('click', () => { 
            playSe('カウンターを取り除く.mp3');
            
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
            
            targets.forEach(target => {
                 if (typeof removeCounterFromCard === 'function') {
                     removeCounterFromCard(target, true); 
                 }
            });
            
            closeContextMenu(); 
        });
    }
    
    if (customCounterMenuItem) {
        customCounterMenuItem.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (lastRightClickedElement) {
                if (typeof openCustomCounterModal === 'function') {
                    openCustomCounterModal(lastRightClickedElement);
                }
            }
            closeContextMenu();
        });
    }

    if (duplicateMenuItem) {
        duplicateMenuItem.addEventListener('click', () => {
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }

            targets.forEach(target => {
                if (target) {
                    if (typeof duplicateCardToFreeSpace === 'function') {
                        duplicateCardToFreeSpace(target);
                    }
                }
            });
            closeContextMenu();
        });
    }

    if (addFlavorMenuItem) {
        addFlavorMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            if (typeof currentAddFlavorHandler === 'function') currentAddFlavorHandler(); 
            closeContextMenu(); 
        });
    }

    if (viewIllustrationMenuItem) {
        viewIllustrationMenuItem.addEventListener('click', () => { 
            playSe('ボタン共通.mp3');
            if (typeof currentViewIllustrationHandler === 'function') currentViewIllustrationHandler(); 
            closeContextMenu(); 
        });
    }

    if (masturbateMenuItem) {
        masturbateMenuItem.addEventListener('click', async () => { 
            let targets = [lastRightClickedElement];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            }
            
            const anyMasturbating = targets.some(t => t.dataset.isMasturbating === 'true');
            const newState = !anyMasturbating;
    
            if (newState) {
                if (typeof confirmWarning === 'function' && !await confirmWarning('warnMasturbateDrain', 'オナニーを開始するとBPが自動減少します。よろしいですか？')) {
                    closeContextMenu();
                    return;
                }
                playSe('オナニー.wav', true);
            } else {
                stopSe('オナニー.wav');
            }
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();
    
            targets.forEach(target => {
                const isCurrent = target.dataset.isMasturbating === 'true';
                if (isCurrent !== newState) {
                    if(typeof toggleMasturbation === 'function') {
                        toggleMasturbation(target, newState, true); 
                    }
                    if (typeof isRecording !== 'undefined' && isRecording && typeof recordAction === 'function') {
                        const zoneId = getParentZoneId(target.parentNode);
                        const slotIndex = Array.from(target.parentNode.parentNode.children).indexOf(target.parentNode);
                        recordAction({ type: 'masturbate', zoneId: zoneId, slotIndex: slotIndex, isMasturbating: newState });
                    }
                }
            });
            
            closeContextMenu(); 
        });
    }
    
    if (exportCardMenuItem) {
        exportCardMenuItem.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof currentExportCardHandler === 'function') currentExportCardHandler();
            closeContextMenu();
        });
    }
    
    if (importCardMenuItem) {
        importCardMenuItem.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof currentImportCardHandler === 'function') currentImportCardHandler();
            closeContextMenu();
        });
    }

    if (changeStyleMenuItem) {
        changeStyleMenuItem.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            if (typeof openDecorationSettingsModal === 'function') {
                openDecorationSettingsModal();
            }
            closeContextMenu();
        });
    }

    const bpModifyBtns = document.querySelectorAll('.bp-modify-btn');
    bpModifyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const val = parseInt(btn.dataset.value);
            
            let targets = [];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            } else if (lastRightClickedElement) {
                targets = [lastRightClickedElement];
            }

            if (targets.length > 0) {
                if (typeof saveStateForUndo === 'function') saveStateForUndo();

                targets.forEach(el => {
                    if (typeof modifyCardBP === 'function') {
                        modifyCardBP(el, val, true);
                    }
                });

                if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
                    if (typeof updateBattleConfirmModal === 'function') {
                        updateBattleConfirmModal();
                    }
                }
            }
            closeContextMenu();
        });
    });

    const resetBpItem = document.getElementById('context-menu-reset-bp');
    if (resetBpItem) {
        resetBpItem.onclick = (e) => {
            e.stopPropagation();
            
            if (typeof saveStateForUndo === 'function') saveStateForUndo();

            let targets = [];
            if (typeof selectedCards !== 'undefined' && selectedCards.length > 0 && selectedCards.includes(lastRightClickedElement)) {
                targets = selectedCards;
            } else if (lastRightClickedElement) {
                targets = [lastRightClickedElement];
            }

            targets.forEach(target => {
                if (target && typeof resetCardBP === 'function') {
                    resetCardBP(target);
                }
            });

            if (typeof isBattleConfirmMode !== 'undefined' && isBattleConfirmMode) {
                if (typeof updateBattleConfirmModal === 'function') {
                    updateBattleConfirmModal();
                }
            }
            closeContextMenu();
        };
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
