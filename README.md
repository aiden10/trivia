# About
The site has 3 different multiplayer games which can be played with other people. You can create rooms and select different gamemodes. 
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/f1b15b8d-61d5-42e7-8134-6bea0514a879" />
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/0ae78237-9517-45e3-be89-3ca4eec07ec0" />


## TriviaQA
This gamemode uses questions from the TriviaQA dataset and Wikidata for the image questions. You can also pick different categories.
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/a4af9281-17c0-4fd5-a715-9e67820256b3" />
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/f4af6e61-4775-466e-993c-cf8abb5f6f5a" />

## People Guesser
Gives a "prompt" which consists of certain properties that a person can have. For example: male, north america, actor would mean that you need to guess a male actor from north america. 
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/0a0d4a55-697d-436e-ada6-e8b1e3e9b382" />

## 20Q
Pretty much just 20 Questions but online. I added some other rules regarding win conditions though. 
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/0f42119c-d7cc-4f86-95ea-b32ca478a496" />

# Running Locally
To run locally, clone the repo, install the dependencies (```npm i```), start the server (```fastapi dev server.py```), and also start the frontend server (```npm run dev```). However, the frontend is set to use the hosted server address by default, so you'd need to also update constants.ts to use localhost addresses instead. 

