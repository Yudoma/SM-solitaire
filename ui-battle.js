// ============================================================================
// ui-battle.js
// バトル処理、攻撃対象選択、バトル確認モーダルの制御
// ============================================================================

// ※ isBattleTargetMode, isBattleConfirmMode, currentAttacker, currentBattleTarget 
//    などの状態変数は ui-globals.js で定義されています。

// --- Battle Confirm Modal Logic ---

/**
 * バトル確認モーダルを開く
 * @param {HTMLElement} attacker 攻撃側カード要素
 * @param {HTMLElement} target 対象カード要素
 */
window.openBattleConfirmModal = function(attacker, target) {
    if (!battleConfirmModal) return;
    
    // --- フレンドリーファイア警告 ---
    if (typeof autoConfig !== 'undefined' && autoConfig.warnFriendlyFire) {
        // 攻撃側のオーナー特定
        // getParentZoneId は zone.js 等で定義される想定
        const attackerZone = typeof getParentZoneId === 'function' ? getParentZoneId(attacker.parentNode) : '';
        const attackerIsOpponent = attackerZone && attackerZone.startsWith('opponent-');
        
        // 対象のオーナー特定
        let targetIsOpponent = false;
        if (target.id === 'opponent-icon-zone' || (target.id && target.id.startsWith('opponent-'))) {
            targetIsOpponent = true;
        } else if (target.parentNode) {
            const targetZone = typeof getParentZoneId === 'function' ? getParentZoneId(target.parentNode) : '';
            if (targetZone && targetZone.startsWith('opponent-')) {
                targetIsOpponent = true;
            }
        }
        
        // 同じサイドなら警告
        if (attackerIsOpponent === targetIsOpponent) {
            // confirmWarning は ui-utils.js 等で定義される想定
            if (typeof confirmWarning === 'function' && !confirmWarning('warnFriendlyFire', '自分のカードを対象として選択しています。よろしいですか？')) {
                // キャンセルの場合、ターゲット選択モードを終了して戻る
                if(typeof cancelBattleTargetSelection === 'function') cancelBattleTargetSelection();
                return;
            }
        }
    }
    // ----------------------------
    
    document.body.classList.remove('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'none';
    isBattleTargetMode = false;
    const candidates = document.querySelectorAll('.battle-target-candidate');
    candidates.forEach(el => el.classList.remove('battle-target-candidate'));

    const attackerImg = attacker.querySelector('.card-image');
    if (attackerImg && battleConfirmAttackerImg) {
        battleConfirmAttackerImg.style.backgroundImage = `url(${attackerImg.src})`;
    }
    
    if (battleConfirmTargetImg) {
        battleConfirmTargetImg.style.backgroundImage = 'none'; 
        if (target.id === 'icon-zone' || target.id === 'opponent-icon-zone') {
            const iconImg = target.closest('.player-icon-slot')?.querySelector('.thumbnail .card-image');
            if (iconImg) {
                battleConfirmTargetImg.style.backgroundImage = `url(${iconImg.src})`;
            } else {
                battleConfirmTargetImg.innerHTML = '<span style="color:#ccc; font-size:0.8em; display: flex; justify-content: center; align-items: center; height: 100%;">Player</span>';
            }
        } else {
            const targetThumb = target.querySelector('.thumbnail');
            const targetImg = targetThumb ? targetThumb.querySelector('.card-image') : null;
            if (targetImg) {
                battleConfirmTargetImg.style.backgroundImage = `url(${targetImg.src})`;
            }
        }
    }

    battleConfirmModal.style.display = 'flex';
    isBattleConfirmMode = true;
    currentAttacker = attacker;
    currentBattleTarget = target;

    window.updateBattleConfirmModal();
};

/**
 * バトル確認モーダルの内容（BPなど）を更新する
 */
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

    if (currentAttacker && battleConfirmAttackerBpInput) {
        battleConfirmAttackerBpInput.value = getBP(currentAttacker);
    }

    if (currentBattleTarget && battleConfirmTargetBpInput) {
        let targetEl = currentBattleTarget;
        if (targetEl.id !== 'icon-zone' && targetEl.id !== 'opponent-icon-zone') {
            targetEl = targetEl.querySelector('.thumbnail') || targetEl;
        }
        battleConfirmTargetBpInput.value = getBP(targetEl);
    }
};

/**
 * バトル確認モーダルを閉じる
 */
window.closeBattleConfirmModal = function() {
    if (battleConfirmModal) {
        battleConfirmModal.style.display = 'none';
    }
    isBattleConfirmMode = false;
    currentBattleTarget = null;
    if (currentAttacker) {
        currentAttacker.classList.remove('battle-attacker');
    }
};


// --- Battle Target Selection Logic ---

/**
 * 攻撃対象選択モードを開始する
 * @param {HTMLElement} attackerThumbnail 攻撃側のカード要素
 */
function startBattleTargetSelection(attackerThumbnail) {
    if (!attackerThumbnail) return;
    
    isBattleTargetMode = true;
    currentAttacker = attackerThumbnail;
    document.body.classList.add('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'flex';
    attackerThumbnail.classList.add('battle-attacker');

    // ターゲット候補のハイライト
    const allThumbnails = document.querySelectorAll('.card-slot .thumbnail');
    allThumbnails.forEach(thumb => {
        const zone = getParentZoneId(thumb.parentNode);
        const base = getBaseId(zone);
        
        // 攻撃対象にならないゾーンを除外
        if (['deck', 'grave', 'exclude', 'side-deck', 'hand-zone', 'token-zone-slots', 'c-free-space'].includes(base)) return;
        
        thumb.classList.add('battle-target-candidate');
    });

    // プレイヤーアイコンも候補に追加
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

/**
 * 攻撃対象選択モードをキャンセルする
 */
window.cancelBattleTargetSelection = function() {
    isBattleTargetMode = false;
    document.body.classList.remove('battle-target-mode');
    if (battleTargetOverlay) battleTargetOverlay.style.display = 'none';
    if (currentAttacker) {
        currentAttacker.classList.remove('battle-attacker');
        currentAttacker = null;
    }

    const candidates = document.querySelectorAll('.battle-target-candidate');
    candidates.forEach(el => el.classList.remove('battle-target-candidate'));
};


// --- Initialization ---

/**
 * バトル関連のイベントリスナーを設定
 * ui-main.js から呼び出される
 */
function setupBattleEvents() {
    // バトル確認モーダル用
    if (battleConfirmExecuteBtn) {
        battleConfirmExecuteBtn.addEventListener('click', () => {
            // resolveBattle は main.js 等で定義される想定
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

    // モーダルドラッグ機能の有効化 (headerがあれば)
    if (typeof makeDraggable === 'function') {
        if (battleConfirmHeader && battleConfirmModal) makeDraggable(battleConfirmHeader, battleConfirmModal);
    }
    
    // バトルターゲット選択キャンセルボタン
    if (battleCancelBtn) {
        battleCancelBtn.addEventListener('click', () => {
            if (typeof cancelBattleTargetSelection === 'function') cancelBattleTargetSelection();
        });
    }
}