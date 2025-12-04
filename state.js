let draggedItem = null;
let isDecorationMode = false;

let undoStack = [];
let redoStack = [];
const MAX_UNDO_STACK = 20;

let selectedCards = [];

let manaPlacedThisTurn = false;

let isRecording = false;
let isPlaying = false;
let isReplayPaused = false;
let currentReplayIndex = 0;
let currentReplayFileName = '';
let actionLog = [];
let replayStartTime = 0;
let replayTimerIds = [];

let turnTimerDuration = 60;
let currentTimerId = null;
let timerRemaining = 0;

let bgmVolume = 5;
let seVolume = 5;
let currentBgmAudio = null;

const bgmFileList = [
    '【通常戦闘】For The Glorious Achievement.mp3',
    '6月の雨傘.mp3',
    'イベント31.mp3',
    'カジノ01.mp3',
    '困惑.mp3',
    '戦闘曲19.mp3',
    '夢の終わり.mp3'
];

const seConfig = {
    'ボタン共通.mp3': true,
    'カードを配置する.mp3': true,
    'スペル配置.mp3': true,
    'バトル配置.mp3': true,
    '特殊配置.mp3': true,
    'マナ配置.mp3': true,
    'タップ.mp3': true,
    'マナ増加.mp3': true,
    'シャッフル.mp3': true,
    '1枚ドロー＆5枚ドロー.mp3': true,
    '勝利.mp3': true,
    '敗北.mp3': true,
    '墓地に送る.mp3': true,
    '除外する.mp3': true,
    '手札に戻す.mp3': true,
    'カードを反転させる.wav': true,
    'カウンターを置く.mp3': true,
    'カウンターを取り除く.mp3': true,
    'サイコロ.mp3': true,
    'コイントス.mp3': true,
    '自動減少.mp3': true,
    '効果発動.mp3': true,
    'スペル効果発動.mp3': true,
    '対象に取る.mp3': true,
    'アタック.mp3': true,
    '常時発動.mp3': true,
    'ブロッカー.mp3': true,
    'オナニー.wav': true,
    'オナニー後.mp3': true,
    'ターン開始.mp3': true,
    'BPプラス.mp3': true,
    'BPマイナス.mp3': true
};

const effectConfig = {
    'masturbate': true,
    'permanent': true,
    'attack': true,
    'effect': true,
    'target': true,
    'autoDecrease': true,
    'blocker': true,
    'bpChange': true
};

const autoConfig = {
    'autoManaTap': true,
    'autoManaPlacement': true,
    'autoBattleCalc': true,
    'autoManaTapInZone': true,
    'autoAttackTap': true,
    'autoManaCost': true,
    'autoGameEnd': true,
    'autoBpDestruction': true,
    'autoMasturbateDrain': true,

    'warnMasturbateDrain': true,
    'warnFriendlyFire': true,
    'warnSummoningSickness': false,
    'limitManaPlacement': false,
    'warnManaCost': false,
    'warnManaPlacementPhase': false,
    'warnAttackPhase': false,
    'autoDrawPhase': true,
    'msgDrawPhase': false,
    'msgUntapPhase': false,
    'warnUntapPhase': true,
    'msgMainPhase': false,
    'msgBattlePhase': false,
    'msgEndPhase': false,
    'msgStartPhase': false,
    'autoBoardFlip': false,

    'autoResetBpOnLeave': true,
    'autoDuelReset': true,
    'autoDuelShuffle': true,
    'autoDuelDraw': true,

    'autoUntapPhase': false,
    'msgPhaseCutin': true
};

const keyConfig = {
    'toggleDrawer': 'Tab',
    'draw': 'd',
    'stepForward': ' ',
    'tap': 't',
    'flip': 'f',
    'toGrave': 'g',
    'memo': 'm',
    'toggleNav': 'h',
    'flipBoard': 'b',
    'undo': 'z',
    'redo': 'y',
    
    'phaseStart': '1',
    'phaseDraw': '2',
    'phaseMana': '3',
    'phaseMain': '4',
    'phaseBattle': '5',
    'phaseEnd': '6',
    
    'turnChange': 'c',
    
    'openDeck': 'q',
    'openGrave': 'w',
    'openExclude': 'e',
    'openSideDeck': 'r',
    'openBank': 'v',
    
    'rollDice': 'i',
    'tossCoin': 'o'
};

window.customCounterTypes = [];

let isBattleTargetMode = false;
let isBattleConfirmMode = false;
let currentAttacker = null;
let currentBattleTarget = null;

let currentDeleteHandler = null;
let currentMoveToGraveHandler = null;
let currentMoveToExcludeHandler = null;
let currentMoveToHandHandler = null;
let currentMoveToDeckHandler = null;
let currentMoveToSideDeckHandler = null;
let currentFlipHandler = null;
let currentMemoHandler = null;
let currentAddCounterHandler = null;
let currentRemoveCounterHandler = null;
let currentActionHandler = null;
let currentAttackHandler = null; 
let currentTargetHandler = null;
let currentPermanentHandler = null;
let currentAddFlavorHandler = null;
let currentMasturbateHandler = null;
let currentBlockerHandler = null;
let currentExportCardHandler = null;
let currentImportCardHandler = null;
let currentMemoTarget = null;
let currentFlavorTarget = null;
let currentStockItemTarget = null;
let currentPreviewExportHandler = null;

const nonRotatableZones = ['deck', 'grave', 'exclude', 'hand-zone', 'deck-back-slots', 'side-deck', 'grave-back-slots', 'exclude-back-slots', 'side-deck-back-slots', 'icon-zone', 'token-zone-slots'];
const decorationZones = ['exclude', 'side-deck', 'grave', 'deck', 'icon-zone'];
const stackableZones = ['battle', 'spell', 'mana', 'special1', 'special2'];

let deckStorageData = Array.from({ length: 8 }, (_, i) => ({
    id: `deck-slot-${i}`,
    name: `Deck ${i + 1}`,
    mainDeckData: null,
    exDeckData: null,
    thumbnailSrc: null,
    counts: { main: 0, ex: 0 }
}));