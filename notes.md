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

# Todo
- Skip to reveal after all players guessed
    - This is a bit more difficult because I only track when players guess correctly 
- Send question duration to new players
- Show what other players guessed 
- Fix being able to join non-existent rooms

# Trivia
Remake to use larger, categorized dataset
Use fuzzy logic to compare strings to answers, if above matching threshold, answer is correct
If answer contains more than one word, allow acronyms

# 20 Questions Game
One player picks a person or thing (person picker, PP)
Other players take turns asking questions
PP answers with yes/no, or potentially 'other'.
Guessers can ask a special 'deciding' question when they think they know what it is ("is it...?")
PP once again picks yes/no (only these this time though)
If the guesser was correct, then they get points
If they were incorrect, then they have to wait n turns to be able to ask the deciding question again

If after the max number of questions has been asked and nobody got it, the PP gets no points. If the thing is guessed after too few questions, then the PP also gets no points. So you need to pick something that can be guessed, but not too easily.  
Maybe make it so that players get some points if their question was answered with what they expected

## Lobby
The host would be able to denote who begins as the PP as well as the max number of questions

# Refactoring
Refactor current setup to support different gamemodes

## Client
Creating a room is done not for any particular gamemode
    You make a room, then you can select the gamemode
Separate components into folders for each gamemode
Client events also have to be separated

