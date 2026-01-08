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

# Codenames with pictures
Basically just codenames but instead of words being on the grid, it's images. Maybe the spymaster can draw a picture as the hint or give a word. 

# Imposter
All players except one (the imposter) are given the same word. Players take turns saying another word related to it, but can't say the word itself. If the imposter does, they instantly lose, and non-imposters can't. Every n turns, players vote on who they think the imposter is. After m votes, if the imposter hasn't been found, they win.    

# TODO
- Game rules somewhere 
- Chat window
- The chat window and game rules can be components which are small tabs on the left or right sides of the screen, which when clicked, expand to a larger panel. Probably with a small arrow to indicate it can be clicked. The chat window tab should have a small circle next to the arrow which is red if there is a new message, and half transparent otherwise.   
- Pressing join on the name select should request the current room state so it has the up to date stage
    Maybe also keep track of the time left on the server so clients always see an accurate countdown
- Make host option
- Show public rooms
- Show trivia question quantities
- Revamp "winning" aspect of 20Q. It might be better to just make it so that winning means guessing the thing within the amount of questions. 
- Synchronize settings so non-host players can see it too
    - Update settings style for non-host players
- Handle players losing connection better and show reconnect button
- Remove special characters when checking answers
- Add npm run build check before commits can be pushed to main
- Make things feel more responsive
- Change attraction questions to: "In what country would you find the {name}?"