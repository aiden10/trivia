
export interface Player {
    playerID: number;
    playerName: string;
    score: number;
    guess: string;
    correctGuesses: string[];
    guessedCorrectly: boolean;
}

export enum GameModes {
    Default = "default",
    Trivia = "trivia",
    PeopleGuesser = "people"
}

export const GamemodeOptions: Array<{ id: GameModes; name: string; description: string }> = [
    { 
        id: GameModes.Trivia, 
        name: "OpenTrivia", 
        description: "Uses questions from the OpenTriviaQA dataset and fuzzy logic to check guesses" 
    },
    {
        id: GameModes.PeopleGuesser,
        name: "PeopleGuesser",
        description: "Guess people who have specific properties"
    }
];

export interface RoomState {
    roomId: string;
    hostId: number;
    players: Array<{ playerID: number; playerName: string; score: number, guess: string, correctGuesses: string[] }>;
    gamemode: string;
    triviaState: TriviaState | null; 
    peopleState: PeopleState | null;
}

export enum TriviaStages {
    Lobby = 0,
    QuestionDisplay = 1,
    Reveal = 2,
    Results = 3,
}

export enum PeopleStages {
    Lobby = 0,
    PropertiesDisplay = 1,
    GuessingPeriod = 2,
    Results = 3,
}

export enum PeopleProperties {
    Male = "male",
    Female = "female",
    Asia = "asia",
    NorthAmerica = "north_america",
    SouthAmerica = "south_america",
    Europe = "europe",
    Africa = "africa",
    Oceania = "oceania",
    Athlete = "athlete",
    Actor = "actor",
    Politician = "politician",
    Musician = "musician",
    Scientist = "scientist",
    Author = "author"
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
    questionDuration?: number;
    winningScore?: number;
    questionValue?: number;
}

export interface PeopleSettings {
    properties?: string[];
    duration?: number;
    winningScore?: number;
    combinationLowerBound?: number;
    combinationUpperBound?: number;
}

export interface TriviaQuestion {
    body: string;
    answer: string;
}

export interface TriviaState {
    currentQuestion: TriviaQuestion | null;
    currentStage: number;
    settings: TriviaSettings;
}

export interface PeopleState {
    currentProperties: PeopleProperties[];
    currentStage: number;
    correctValue: number;
    settings: PeopleSettings;
}