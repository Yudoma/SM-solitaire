let contextMenu, deleteMenuItem, toGraveMenuItem, toExcludeMenuItem, toHandMenuItem, toDeckMenuItem, toSideDeckMenuItem, flipMenuItem, memoMenuItem, addCounterMenuItem, removeCounterMenuItem, masturbateMenuItem, blockerMenuItem, permanentMenuItem, attackMenuItem;
let actionMenuItem, targetMenuItem, addFlavorMenuItem, viewIllustrationMenuItem;
let customCounterMenuItem, changeStyleMenuItem, duplicateMenuItem; 
let exportCardMenuItem, importCardMenuItem, setAsTopMenuItem;
let exportPreviewMenuItem; 

let memoEditorModal, memoTextarea, memoSaveBtn, memoCancelBtn, memoTooltip, memoEditorHeader;
let memoFontSizeInput, memoWidthInput, memoHeightInput;
let currentMemoOriginalText = ''; 

let lightboxOverlay, lightboxContent;

let commonDrawer, commonDrawerToggle;
let cDrawer, cDrawerToggle;
let isResizingDrawer = false; 

let commonFlipBoardBtn, commonDecorationSettingsBtn, commonToggleSeBtn;
let diceRollBtn, coinTossBtn, randomResultDisplay;
let commonToggleNavBtn;

let flavorEditorModal, flavorEditorHeader, flavorPreview1, flavorPreview2;
let flavorDelete1, flavorDelete2, flavorCancelBtn, flavorSaveBtn; 
let flavorUpload1, flavorUpload2;
let flavorDropZone1, flavorDropZone2;

let customCounterModal, customCounterCloseBtn, customCounterSaveBtn, createCounterBtn, newCounterNameInput, newCounterImageDrop, customCounterListContainer; 
let newCounterImageSrc = null; 
let currentCustomCounterTarget = null; 

let isFileDialogOpen = false;

let decorationSettingsModal, decorationSettingsHeader, decorationSettingsCloseBtn;
let draggedStockItem = null; 

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

let battleConfirmModal, battleConfirmHeader, battleConfirmAttackerImg, battleConfirmTargetImg;
let battleConfirmAttackerBpInput, battleConfirmTargetBpInput;
let battleConfirmExecuteBtn, battleConfirmCancelBtn;
let battleTargetOverlay, battleCancelBtn;

let duelStartBtn;
let timerPauseBtn;
let turnTimerDisplay;

let stepButtons = [];
const stepOrder = ['step-start', 'step-draw', 'step-mana', 'step-main', 'step-attack', 'step-end'];
let currentStepIndex = -1; 

let isTurnEnded = true;

let gameResultOverlay, gameResultMessage, gameResultCloseBtn;

let actionLogBody;
let commonExportBoardBtn, commonImportBoardBtn;
let downloadLogBtn;

let recordStartBtn, recordStopBtn, replayPlayBtn, replayPauseBtn, replayStopBtn, loadReplayBtn;
let replayFileNameDisplay, replayFileNameText, replayWaitTimeInput;

let bgmSelect, bgmPlayBtn, bgmPauseBtn, bgmStopBtn;
let bgmVolumeSlider, bgmVolumeVal, seVolumeSlider, seVolumeVal;

let seCheckAllBtn, seUncheckAllBtn, effectCheckAllBtn, effectUncheckAllBtn;
let autoCheckAllBtn, autoUncheckAllBtn, autoConfigContainer;

let playerAutoDecreaseInput, opponentAutoDecreaseInput;
let hyphenAutoDecreaseBtn, opponentHyphenAutoDecreaseBtn;

let shuffleDeckBtn, shuffleHandBtn;
let opponentShuffleDeckBtn, opponentShuffleHandBtn;
let systemBtn, opponentSystemBtn;

let cSearchFilter;
let lastHoveredElement = null; 
let lastRightClickedElement = null;