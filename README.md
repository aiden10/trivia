# About
Multiplayer trivia game using questions from "Who Wants to Be a Millionaire". You can create rooms to play with other people and select different question difficulties. I hosted this online by using Vercel, and an Oracle Cloud Instance (the equivalent to EC2). Because of the web sockets I figured that I actually need a real server and it can't just be run in a "serverless" environment like AWS Lambda. To make the backend instance accessible through HTTPS (because Vercel domains are HTTPS) I had to create a certificate, use a registered domain, and use nginx to host it. I also added a system service to automatically run and restart the server. I wrote some of the details in notes.md.

# Running Locally
To run locally, clone the repo, install the dependencies (```npm i```), start the server (```fastapi dev server.py```), and also start the frontend server (```npm run dev```). However, the frontend is set to use the hosted server address by default, so you'd need to also update constants.ts to use localhost instead. 

# Screenshots
## Home
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/32d4a165-8e9b-4818-8728-8058a4818c71" />

## Lobby
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/c3c4dffc-c21d-4175-97fb-79fcf7cb8fe0" />

## Question
<img width="1920" height="953" alt="image" src="https://github.com/user-attachments/assets/d01735c6-1faf-4bba-b847-8d9edcc9ba78" />

## Reveal
<img width="1920" height="953" alt="image" src="https://github.com/user-attachments/assets/4f474738-d1d9-4b3f-8d40-39170818ebf3" />

## Results
<img width="1920" height="913" alt="image" src="https://github.com/user-attachments/assets/cd14b3c5-9ebc-4882-8bd9-236d01079a51" />

# Issues
- No scaling
- Room states are stored in memory
- Not as fun as PopSauce
- Lacking some QoL features 
