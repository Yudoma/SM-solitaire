// ============================================================================
// ui-globals.js
// UI要素の参照、および state.js に含まれないUI固有の変数を定義
// ============================================================================

// --- コンテキストメニュー関連 (DOM要素) ---
let contextMenu, deleteMenuItem, toGraveMenuItem, toExcludeMenuItem, toHandMenuItem, toDeckMenuItem, toSideDeckMenuItem, flipMenuItem, memoMenuItem, addCounterMenuItem, removeCounterMenuItem, masturbateMenuItem, blockerMenuItem, permanentMenuItem, attackMenuItem;
let actionMenuItem, targetMenuItem, addFlavorMenuItem, viewIllustrationMenuItem;
let customCounterMenuItem, changeStyleMenuItem, duplicateMenuItem; 
let exportCardMenuItem, importCardMenuItem, setAsTopMenuItem;
let exportPreviewMenuItem; 

// ※ currentDeleteHandler 等のハンドラ変数は state.js で定義済みのため削除

// --- メモエディタ関連 (DOM要素) ---
let memoEditorModal, memoTextarea, memoSaveBtn, memoCancelBtn, memoTooltip, memoEditorHeader;
let memoFontSizeInput, memoWidthInput, memoHeightInput;
let currentMemoOriginalText = ''; // UI固有の一時変数

// --- 画像ビューア（ライトボックス）関連 (DOM要素) ---
let lightboxOverlay, lightboxContent;

// --- ドロワー（サイドメニュー）関連 (DOM要素) ---
let commonDrawer, commonDrawerToggle;
let cDrawer, cDrawerToggle;
let isResizingDrawer = false; // UI固有の操作フラグ

// --- 共通コントロール・ランダム機能関連 (DOM要素) ---
let commonFlipBoardBtn, commonDecorationSettingsBtn, commonToggleSeBtn;
let diceRollBtn, coinTossBtn, randomResultDisplay;
let commonToggleNavBtn;

// --- フレーバーエディタ関連 (DOM要素) ---
let flavorEditorModal, flavorEditorHeader, flavorPreview1, flavorPreview2;
let flavorDelete1, flavorDelete2, flavorCancelBtn, flavorSaveBtn; 
let flavorUpload1, flavorUpload2;
let flavorDropZone1, flavorDropZone2;

// --- カスタムカウンターモーダル用 (DOM要素) ---
let customCounterModal, customCounterCloseBtn, customCounterSaveBtn, createCounterBtn, newCounterNameInput, newCounterImageDrop, customCounterListContainer; 
let newCounterImageSrc = null; 
// state.js に currentCustomCounterTarget がない場合はここで定義が必要ですが、
// 重複エラーが出る場合は削除してください。一旦定義しておきます。
let currentCustomCounterTarget = null; 

// ※ customCounterTypes は state.js で定義済みのため削除

// --- ファイルダイアログ用のグローバルフラグ (UI固有) ---
let isFileDialogOpen = false;

// --- 装飾＆アイコン設定モーダル用 (DOM要素・データ) ---
let decorationSettingsModal, decorationSettingsHeader, decorationSettingsCloseBtn;
let draggedStockItem = null; // state.js の draggedItem (カード移動用) とは別物

// state.js に無いため定義 (装飾データ)
const defaultDecorations = {
    'deck': ['./decoration/デッキ.png'],
    'side-deck': ['./decoration/EXデッキ.png'],
    'grave': ['./decoration/墓地エリア.png'],
    'exclude': ['./decoration/除外エリア.png']
};

const defaultIconsPlayer = [
    './decoration/マゾヒスト.png',
    './decoration/マジッカーズ.png',
    './decoration/ストライカー.png',
    './decoration/サディスト.png',
    './decoration/シンプル.png'
];

const defaultIconsOpponent = [
    './decoration/サディスト.png',
    './decoration/マジッカーズ.png',
    './decoration/マゾヒスト.png',
    './decoration/ストライカー.png',
    './decoration/シンプル.png'
];

let customIconStocks = {
    player: {
        deck: [...defaultDecorations['deck']],
        'side-deck': [...defaultDecorations['side-deck']],
        grave: [...defaultDecorations['grave']],
        exclude: [...defaultDecorations['exclude']],
        icon: [...defaultIconsPlayer]
    }, 
    opponent: {
        deck: [...defaultDecorations['deck']],
        'side-deck': [...defaultDecorations['side-deck']],
        grave: [...defaultDecorations['grave']],
        exclude: [...defaultDecorations['exclude']],
        icon: [...defaultIconsOpponent]
    }
};

// --- バトル関連 (DOM要素) ---
let battleConfirmModal, battleConfirmHeader, battleConfirmAttackerImg, battleConfirmTargetImg;
let battleConfirmAttackerBpInput, battleConfirmTargetBpInput;
let battleConfirmExecuteBtn, battleConfirmCancelBtn;
let battleTargetOverlay, battleCancelBtn;

// ※ isBattleTargetMode, isBattleConfirmMode, currentAttacker, currentBattleTarget は state.js で定義済みのため削除

// --- ゲーム進行・タイマー関連 (DOM要素・ステップ管理) ---
let duelStartBtn;
let timerPauseBtn;
let turnTimerDisplay;

// state.js に無いため定義 (ステップ進行管理)
let stepButtons = [];
const stepOrder = ['step-start', 'step-draw', 'step-mana', 'step-main', 'step-attack', 'step-end'];
let currentStepIndex = -1; 

// ターン終了判定フラグ (true: ターン終了済み/開始可能, false: ターン継続中)
let isTurnEnded = true;

// ※ turnTimerDuration, timerRemaining, currentTimerId は state.js で定義済みのため削除

// --- 勝敗表示用 (DOM要素) ---
let gameResultOverlay, gameResultMessage, gameResultCloseBtn;

// --- ログ・I/O関連 (DOM要素) ---
let actionLogBody;
let commonExportBoardBtn, commonImportBoardBtn;
let downloadLogBtn;

// --- リプレイ・記録関連 (DOM要素) ---
let recordStartBtn, recordStopBtn, replayPlayBtn, replayPauseBtn, replayStopBtn, loadReplayBtn;
let replayFileNameDisplay, replayFileNameText, replayWaitTimeInput;

// --- BGM・SE設定関連 (DOM要素) ---
let bgmSelect, bgmPlayBtn, bgmPauseBtn, bgmStopBtn;
let bgmVolumeSlider, bgmVolumeVal, seVolumeSlider, seVolumeVal;

// --- 設定チェックボックス関連 (DOM要素) ---
let seCheckAllBtn, seUncheckAllBtn, effectCheckAllBtn, effectUncheckAllBtn;
let autoCheckAllBtn, autoUncheckAllBtn, autoConfigContainer;

// --- 自動減少設定用入力 (DOM要素) ---
let playerAutoDecreaseInput, opponentAutoDecreaseInput;

// --- シャッフル・システムボタン (DOM要素) ---
let shuffleDeckBtn, shuffleHandBtn;
let opponentShuffleDeckBtn, opponentShuffleHandBtn;
let systemBtn, opponentSystemBtn;

// --- その他 (DOM要素) ---
let cSearchFilter;
let lastHoveredElement = null; 
let lastRightClickedElement = null; 

// ※ selectedCards は state.js で定義済みのため削除