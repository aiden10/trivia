// === Core Types ===
export interface Player {
    playerID: number;
    playerName: string;
    score: number;
    guess: string;
    guessedCorrectly: boolean;
}

export enum GameModes {
    Default = "default",
    Trivia = "trivia",
}

// === Room State (matches server Room.to_dict()) ===
export interface RoomState {
    roomId: string;
    hostId: number;
    players: Array<{ playerID: number; playerName: string; score: number }>;
    gamemode: string;
    gamemodeState: TriviaState | null; 
}

// === Trivia Types ===
export enum TriviaStages {
    Lobby = 0,
    QuestionDisplay = 1,
    Reveal = 2,
    Results = 3,
}

export enum TriviaCategories {
    History = "history",
    Literature = "literature",
    Geography = "geography",
    Movies = "movies",
    Games = "games",
    PopCulture = "pop_culture",
}

export interface TriviaSettings {
    categories?: string[];
    duration?: number;
    winningScore?: number;
}

export interface TriviaQuestion {
    body: string;
    answer: string;
}

export interface TriviaState {
    currentQuestion: TriviaQuestion | null;
    currentStage: number;
    questionDuration: number;
    categories: string[];
    questionValue: number;
    winningScore: number;
}