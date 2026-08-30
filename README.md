# About
The site has 4 different multiplayer games which can be played with other people. You can create rooms and select different gamemodes. 
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/f1b15b8d-61d5-42e7-8134-6bea0514a879" />
<img width="1026" height="717" alt="image" src="https://github.com/user-attachments/assets/84827b12-e042-4ae3-8b4c-3d31a35e2b76" />

## Gamemodes

### Trivia
This gamemode uses questions from the TriviaQA dataset, Wikidata for the image questions, and I used Last.fm and Deezer for the music questions. You can also pick different categories.
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/a4af9281-17c0-4fd5-a715-9e67820256b3" />

#### Rules
<img width="584" height="726" alt="image" src="https://github.com/user-attachments/assets/eac5d5f8-5106-4368-8081-9bfa2d8d3ec0" />

### People Guesser
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/0a0d4a55-697d-436e-ada6-e8b1e3e9b382" />

#### Rules
<img width="584" height="722" alt="image" src="https://github.com/user-attachments/assets/08f2e420-0f8f-49e4-8a77-da73a9af7b59" />

### People Guesser Bomb Party
<img width="1920" height="914" alt="image" src="https://github.com/user-attachments/assets/f02b8bd5-1d7c-4bdd-8851-669172bdd5f3" />

#### Rules
<img width="672" height="768" alt="image" src="https://github.com/user-attachments/assets/186bf980-0a41-44fb-a174-67a73a5e436a" />

### 20Q
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/0f42119c-d7cc-4f86-95ea-b32ca478a496" />

#### Rules
<img width="760" height="606" alt="image" src="https://github.com/user-attachments/assets/49c429b6-60a3-4681-9f12-ae4969b83848" />

## Other Features
- Collapsible chat window
<img width="527" height="913" alt="image" src="https://github.com/user-attachments/assets/8bbf2c5f-2197-4dc7-9da2-5fb6a3f1d747" />
 
- Each gamemode has many settings which can be customized
<img width="1197" height="873" alt="image" src="https://github.com/user-attachments/assets/f1a6aff0-4a0c-4725-ad50-2376d6855cae" />

# Running Locally
To run locally, clone the repo, install the dependencies (```npm i```), start the server (```fastapi dev server.py```), and also start the frontend server (```npm run dev```). However, the frontend is set to use the hosted server address by default, so you'd need to also update constants.ts to use localhost addresses instead. 

