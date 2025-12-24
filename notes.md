# Linux System File
[Unit]
Description=Trivia FastAPI Server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/trivia/server

Environment="PATH=/home/ubuntu/trivia/server/venv/bin"
Environment="PYTHONPATH=/home/ubuntu/trivia/server"

ExecStart=/home/ubuntu/trivia/server/venv/bin/gunicorn \
    -k uvicorn.workers.UvicornWorker \
    server:app \
    --bind 127.0.0.1:9000

Restart=always
RestartSec=3

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target

## Creating Service
``` vi /etc/systemd/system/trivia.service ```
Then paste contents into file

## Starting Service
``` 
sudo systemctl daemon-reload
sudo systemctl enable trivia
sudo systemctl start trivia
```

## Restarting
``` sudo systemctl restart trivia ```

## Viewing Logs
``` journalctl -u trivia.service -f ```


# nginx Config
```
server {
    server_name trivia.aiden.photo;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    listen 80;
}
```

# Trivia
Remake to use larger, categorized dataset
Use fuzzy logic to compare strings to answers, if above matching threshold, answer is correct
If answer contains more than one word, allow acronyms

# 20 Questions Inspired Game: Rotanika (Akinator backwards)
One player picks a person or thing (picker)
Other players take turns asking questions
picker answers with yes/no, or 'unsure'.
Guessers can ask a special 'deciding' question when they think they know what it is ("is it...?")
picker once again picks yes/no (only these this time though)
If the guesser was correct, then they win
If they were incorrect, then they have to wait n turns to be able to ask the deciding question again

If after the max number of questions has been asked and nobody got it, then nobody wins. If the thing is guessed after too few questions, then the picker also loses. So you need to pick something that can be guessed, but not too easily.  

Maybe instead of taking turns between who is the picker, only one person is the picker each round, and after it's been answered, the game ends. A random player is chosen to ask the first question.

The deciding questions are able to be asked only when it's your turn. There are no time limits for coming up with or answering questions in this game mode. 

## Components
- Question Log
    Color/style the questions differently depending on the answer
    Add questions as soon as they are asked
    When a question is answered, do an animated transition to its new color
    Show turn number next to each question 
- Question (not really a component, just text)
    Just shows the question which was asked. This should be shown to all players
- AnswerOptions
    Picker sees yes, no, unsure buttons, other players see "waiting for picker". The 'unsure' option should be unavailable for deciding questions.
- DecisionButton
    Shown to non-pickers, this probably wouldn't need to be its own component, but when pressed it will set the current question as a "deciding" one. Doing this should update the appearance of the QuestionInput
- QuestionInput
    Shown when the decision button is pressed or when it's their turn to ask a question.
    When submitted, the guess is broadcasted to all players and added to the Question Log even before being answered

- Settings
    - Max/min questions
        If thing/person is guessed before min questions, the guesser wins
        If thing/person is not guessed before max questions, the picker loses, and everyone else wins?
        If thing/person is guessed between the two, the picker and guesser win
    - PlayerDropdown to select who the picker will be
    Settings should have a tooltip shown on hover

## Stages
- Lobby
- Picking
    Input field for picker, everyone else just sees "waiting for picker..."
- GuessingPeriod
- Results

# Trivia
This can be expanded to include images of things or people. Could also include songs using the Deezer API. Wikipedia would be good for images, but it also has way too many obscure pages, and if I wanted categories for these, then it would need to be categorized as well. Songs would have a similar issue because even if you pick categories, there are way too many. With songs though I could maybe use the Spotify API too to determine if a song is popular enough to include. 

## Images
Use PageImages and get random wikipedia page available in more than 10-15 languages. 

# TODO
- Game rules somewhere 
- Pressing join on the name select should request the current room state so it has the up to date stage
    Maybe also keep track of the time left on the server so clients always see an accurate countdown
- Chat window
- Trivia categories labels on mobile 