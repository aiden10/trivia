
export interface Player {
    playerID: number;
    playerName: string;
    score: number;
    guessedCorrectly: boolean;
};

export enum Stages {
    Lobby,
    QuestionDisplay,
    Reveal,
    Results,
};

export type Question = {
    body: string;
    value: number;
    options: string[];
    answer: string;
};
