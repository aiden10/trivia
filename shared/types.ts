
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
    PeopleGuesser = "people",
    Rotanika = "rotanika"
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
    },
    {
        id: GameModes.Rotanika,
        name: "Rotanika",
        description: "20 Questions style game - guess what the picker is thinking of"
    }
];

export interface RoomState {
    roomId: string;
    hostId: number;
    players: Array<{ playerID: number; playerName: string; score: number, guess: string, correctGuesses: string[] }>;
    gamemode: string;
    triviaState: TriviaState | null; 
    peopleState: PeopleState | null;
    rotanikaState: RotanikaState | null;
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

export enum RotanikaStages {
    Lobby = 0,
    Picking = 1,
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
    Games = "games",
    PopCulture = "pop_culture",
    Science = "science_and_nature",
    Music = "music",
    Sports = "sports",
    FoodDrink = "food_and_drink",
    TV = "television",
    Art = "art_and_architecture",
    Miscellaneous = "miscellaneous",
}

export enum ImageCategories {
    Dishes = "dishes",
    Basketball = "basketball",
    Philosophers = "philosophers",
    Attractions = "attractions",
    Flags = "flags",
    Paintings = "paintings",
    Musicians = "musicians",
    Characters = "characters"
}

export const TEXT_CATEGORIES = Object.values(TriviaCategories);
export const IMAGE_CATEGORIES = Object.values(ImageCategories);

export const CONTINENTS = [
    PeopleProperties.Asia,
    PeopleProperties.NorthAmerica,
    PeopleProperties.SouthAmerica,
    PeopleProperties.Europe,
    PeopleProperties.Africa,
    PeopleProperties.Oceania
];

export const GENDERS = [PeopleProperties.Male, PeopleProperties.Female];

export const OCCUPATIONS = [
    PeopleProperties.Athlete,
    PeopleProperties.Actor,
    PeopleProperties.Politician,
    PeopleProperties.Musician,
    PeopleProperties.Scientist,
    PeopleProperties.Author
];

export interface TriviaSettings {
    categories?: string[];
    imageCategories?: string[];
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

export interface RotanikaSettings {
    minQuestions?: number;
    maxQuestions?: number;
    pickerId?: number;
}

export interface TriviaQuestion {
    body: string;
    answer: string;
    image?: string | null;
}

export interface RotanikaQuestion {
    text: string;
    answer: 'yes' | 'no' | 'unsure' | null;
    isDeciding: boolean;
    askedBy: number;
    turnNumber: number;
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

export interface RotanikaState {
    currentStage: number;
    pickerId: number;
    secretThing: string | null;
    questions: RotanikaQuestion[];
    currentAsker: number;
    currentQuestion: string | null;
    waitingForAnswer: boolean;
    settings: RotanikaSettings;
    winner: number | null;
    winReason: 'guessed' | 'maxReached' | 'minNotReached' | null;
}
