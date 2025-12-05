window.openBattleConfirmModal = async function(attackers, target) {
    if (!battleConfirmModal) return;
    
    if (!Array.isArray(attackers)) {
        attackers = [attackers];
    }

    if (typeof autoConfig !== 'undefined' && autoConfig.warnFriendlyFire) {
        let isFriendlyFire = false;
        
        let targetIsOpponent = false;
        if (target.id === 'opponent-icon-zone' || (target.id && target.id.startsWith('opponent-'))) {
            targetIsOpponent = true;
        } else if (target.parentNode) {
            const targetZone = typeof getParentZoneId === 'function' ? getParentZoneId(target.parentNode) : '';
            if (targetZone && targetZone.startsWith('opponent-')) {
                targetIsOpponent = true;
            }
        }

        for (const attacker of attackers) {
            const attackerZone = typeof getParentZoneId === 'function' ? getParentZoneId(attacker.parentNode) : '';
            const attackerIsOpponent = attackerZone && attackerZone.startsWith('opponent-');
            
            if (attackerIsOpponent === targetIsOpponent) {
                isFriendlyFire = true;
                break;
            }
        }
        
        if (isFriendlyFire) {
            if (typeof confirmWarning === 'function') {
                const confirmed = await confirmWarning('warnFriendlyFire', '自分のカードを選択していますが。よろしいですか？');
                if (!confirmed) {
                    if(typeof cancelBattleTargetSelection === 'function') cancelBattleTargetSelection();
                    return;
                }
            }
        }
    }
    
    document.body.classList.remove('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'none';
    isBattleTargetMode = false;
    const candidates = document.querySelectorAll('.battle-target-candidate');
    candidates.forEach(el => el.classList.remove('battle-target-candidate'));

    if (battleConfirmAttackerImg) {
        battleConfirmAttackerImg.innerHTML = '';
        battleConfirmAttackerImg.style.backgroundImage = 'none';
        
        battleConfirmAttackerImg.style.display = 'flex';
        battleConfirmAttackerImg.style.flexWrap = 'nowrap';
        battleConfirmAttackerImg.style.overflowX = 'auto';
        battleConfirmAttackerImg.style.justifyContent = 'center'; 
        battleConfirmAttackerImg.style.gap = '10px';
        battleConfirmAttackerImg.style.alignItems = 'center';
        battleConfirmAttackerImg.style.padding = '10px';

        const getBP = (element) => {
            if (!element) return 0;
            const memo = element.dataset.memo || '';
            const match = memo.match(/\[BP:(.*?)\]/i);
            if (match && match[1]) {
                const bpValue = match[1].trim();
                if (bpValue === '-' || bpValue === '') return 0;
                const parsedBp = parseInt(bpValue);
                return isNaN(parsedBp) ? 0 : parsedBp;
            }
            return 0;
        };

        attackers.forEach(attacker => {
            const imgElement = attacker.querySelector('.card-image');
            if (imgElement) {
                const container = document.createElement('div');
                container.className = 'battle-attacker-item';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.alignItems = 'center';
                container.style.flexShrink = '0';
                container.style.width = '110px'; 

                const thumb = document.createElement('div');
                thumb.style.width = '100px'; 
                thumb.style.height = '140px'; 
                thumb.style.backgroundSize = 'contain';
                thumb.style.backgroundRepeat = 'no-repeat';
                thumb.style.backgroundPosition = 'center';
                thumb.style.backgroundImage = `url(${imgElement.src})`;
                thumb.style.border = '0px solid #555';
                thumb.style.marginBottom = '5px';
                thumb.style.backgroundColor = '#ffffff';
                thumb.style.borderRadius = '3px';

                const bpInput = document.createElement('input');
                bpInput.type = 'number';
                bpInput.className = 'attacker-individual-bp';
                bpInput.value = getBP(attacker);
                bpInput.style.width = '80px';
                bpInput.style.fontSize = '0.9em';
                bpInput.style.textAlign = 'center';
                bpInput.style.backgroundColor = '#222';
                bpInput.style.color = '#fff';
                bpInput.style.border = '1px solid #444';
                bpInput.style.borderRadius = '3px';
                
                bpInput.addEventListener('input', calculateTotalAttackerBP);

                container.appendChild(thumb);
                container.appendChild(bpInput);
                battleConfirmAttackerImg.appendChild(container);
            }
        });
    }
    
    if (battleConfirmAttackerBpInput) {
        const label = battleConfirmAttackerBpInput.previousElementSibling;
        if (label && label.tagName === 'SPAN') {
            label.textContent = 'Total BP:';
        }
    }
    
    if (battleConfirmTargetImg) {
        battleConfirmTargetImg.style.backgroundImage = 'none'; 
        battleConfirmTargetImg.innerHTML = '';
        
        let targetImgSrc = null;

        if (target.id === 'icon-zone' || target.id === 'opponent-icon-zone') {
            const iconSlot = target.closest('.player-icon-slot'); 
            if (iconSlot) {
                const thumbnail = iconSlot.querySelector('.thumbnail');
                if (thumbnail) {
                    const img = thumbnail.querySelector('.card-image');
                    if (img) targetImgSrc = img.src;
                }
            }
        } 
        else {
            const targetThumb = target.querySelector('.thumbnail');
            const targetImg = targetThumb ? targetThumb.querySelector('.card-image') : null;
            if (targetImg) targetImgSrc = targetImg.src;
        }

        if (targetImgSrc) {
            battleConfirmTargetImg.style.backgroundImage = `url(${targetImgSrc})`;
        } else {
            battleConfirmTargetImg.innerHTML = '<span style="color:#ccc; font-size:0.8em; display: flex; justify-content: center; align-items: center; height: 100%;">No Image</span>';
        }
    }

    battleConfirmModal.style.display = 'flex';
    isBattleConfirmMode = true;
    currentAttackers = attackers;
    currentBattleTarget = target;

    window.updateBattleConfirmModal();
};

window.calculateTotalAttackerBP = function() {
    if (!battleConfirmAttackerImg || !battleConfirmAttackerBpInput) return;
    const inputs = battleConfirmAttackerImg.querySelectorAll('.attacker-individual-bp');
    let total = 0;
    inputs.forEach(input => {
        total += (parseInt(input.value) || 0);
    });
    battleConfirmAttackerBpInput.value = total;
};

window.updateBattleConfirmModal = function() {
    if (!battleConfirmModal || battleConfirmModal.style.display === 'none') return;
    
    const getBP = (element) => {
        if (!element) return '0';
        const memo = element.dataset.memo || '';
        const match = memo.match(/\[BP:(.*?)\]/i);
        if (match && match[1]) {
            const bpValue = match[1].trim();
            if (bpValue === '-') {
                return '-';
            }
            const parsedBp = parseInt(bpValue);
            return isNaN(parsedBp) ? '0' : parsedBp.toString();
        }
        return '0';
    };

    if (currentAttackers && currentAttackers.length > 0) {
        const inputs = battleConfirmAttackerImg.querySelectorAll('.attacker-individual-bp');
        currentAttackers.forEach((attacker, index) => {
            if (inputs[index]) {
                const latestBpStr = getBP(attacker);
                inputs[index].value = (latestBpStr === '-') ? 0 : parseInt(latestBpStr);
            }
        });
    }

    if (typeof calculateTotalAttackerBP === 'function') {
        calculateTotalAttackerBP();
    }

    if (currentBattleTarget && battleConfirmTargetBpInput) {
        let targetEl = currentBattleTarget;
        if (targetEl.id !== 'icon-zone' && targetEl.id !== 'opponent-icon-zone') {
            targetEl = targetEl.querySelector('.thumbnail') || targetEl;
        } else {
             const iconSlot = targetEl.closest('.player-icon-slot');
             if (iconSlot) {
                 const thumb = iconSlot.querySelector('.thumbnail');
                 if (thumb) targetEl = thumb;
             }
        }
        battleConfirmTargetBpInput.value = getBP(targetEl);
    }
};

window.closeBattleConfirmModal = function() {
    if (battleConfirmModal) {
        battleConfirmModal.style.display = 'none';
        
        if (battleConfirmAttackerImg) {
            battleConfirmAttackerImg.innerHTML = '';
            battleConfirmAttackerImg.style.backgroundImage = '';
            battleConfirmAttackerImg.style.display = '';
        }
        
        if (battleConfirmAttackerBpInput) {
            const label = battleConfirmAttackerBpInput.previousElementSibling;
            if (label && label.tagName === 'SPAN') {
                label.textContent = 'BP:'; 
            }
        }
    }
    isBattleConfirmMode = false;
    currentBattleTarget = null;
    
    if (currentAttackers && Array.isArray(currentAttackers)) {
        currentAttackers.forEach(attacker => {
            attacker.classList.remove('battle-attacker');
        });
    }
    currentAttackers = [];
};

function startBattleTargetSelection(attackers) {
    if (!attackers) return;
    
    if (!Array.isArray(attackers)) {
        attackers = [attackers];
    }
    
    isBattleTargetMode = true;
    currentAttackers = attackers;
    
    document.body.classList.add('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'flex';
    
    attackers.forEach(attacker => {
        attacker.classList.add('battle-attacker');
    });

    const allThumbnails = document.querySelectorAll('.card-slot .thumbnail');
    allThumbnails.forEach(thumb => {
        if (attackers.includes(thumb)) return;

        const zone = getParentZoneId(thumb.parentNode);
        const base = getBaseId(zone);
        
        if (['deck', 'grave', 'exclude', 'side-deck', 'hand-zone', 'token-zone-slots', 'c-free-space'].includes(base)) return;
        
        thumb.classList.add('battle-target-candidate');
    });

    const iconZone = document.getElementById('icon-zone');
    const oppIconZone = document.getElementById('opponent-icon-zone');
    
    if(iconZone) {
        const playerIconSlot = iconZone.closest('.player-icon-slot');
        if(playerIconSlot) playerIconSlot.classList.add('battle-target-candidate');
    }
    if(oppIconZone) {
        const oppIconSlot = oppIconZone.closest('.player-icon-slot');
        if(oppIconSlot) oppIconSlot.classList.add('battle-target-candidate');
    }
}

window.cancelBattleTargetSelection = function() {
    isBattleTargetMode = false;
    document.body.classList.remove('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'none';
    
    if (currentAttackers && Array.isArray(currentAttackers)) {
        currentAttackers.forEach(attacker => {
            attacker.classList.remove('battle-attacker');
        });
    }
    currentAttackers = [];

    const candidates = document.querySelectorAll('.battle-target-candidate');
    candidates.forEach(el => el.classList.remove('battle-target-candidate'));
};

function setupBattleEvents() {
    if (battleConfirmExecuteBtn) {
        battleConfirmExecuteBtn.addEventListener('click', () => {
            if (typeof resolveBattle === 'function') {
                const aBp = parseInt(battleConfirmAttackerBpInput.value);
                const tBp = parseInt(battleConfirmTargetBpInput.value);
                resolveBattle(aBp, tBp);
            }
        });
    }
    if (battleConfirmCancelBtn) {
        battleConfirmCancelBtn.addEventListener('click', () => {
            playSe('ボタン共通.mp3');
            closeBattleConfirmModal();
        });
    }

    if (typeof makeDraggable === 'function') {
        if (battleConfirmHeader && battleConfirmModal) makeDraggable(battleConfirmHeader, battleConfirmModal);
    }
    
    if (battleCancelBtn) {
        battleCancelBtn.addEventListener('click', () => {
            if (typeof cancelBattleTargetSelection === 'function') cancelBattleTargetSelection();
        });
    }
}
