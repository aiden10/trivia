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

export interface RoomState {
    roomId: string;
    hostId: number;
    players: Array<{ playerID: number; playerName: string; score: number }>;
    gamemode: string;
    gamemodeState: TriviaState | null; 
}

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
    Games = "video_games_and_board_games",
    PopCulture = "pop_culture",
    Science = "science_and_nature",
    Music = "music",
    Sports = "sports",
    FoodDrink = "food_and_drink",
    TV = "television",
    Art = "art_and_architecture",
    Miscellaneous = "miscellaneous",
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