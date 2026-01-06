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
Use last.fm to get 500-1000 most popular songs from a particular genre, then use Deezer to get preview links from each song. Store data in JSON files. Allow either artist, album, or song name to be accepted as answers and use fuzzy matching but with a higher threshold (85-90%). Could get:
- 5 points for guessing song name
- 5 points for guessing artist
- 10 points for guessing album
Album might not work very well because a lot of the albums are things like "greatest hits" instead. Since this will be a part of the trivia mode, I should have a new component which shows if the song and artist have been guessed yet.  
- Songs have to be downloaded locally
- Ignore words in parentheses when checking song answers

# People Guesser Bomb Party
Instead of everyone guessing as many as they can, players take turns guessing a person who has the specific properties on their turn. I think I'd try to have the UI still mainly text based instead of showing players in a circle with an arrow. A grid with different sized cells which contain information about: prompt (properties), lives left of other players, your lives left, who's next, and above that would be the search bar. On mobile it can resize to have more rows and less columns.  

# Codenames with pictures
Basically just codenames but instead of words being on the grid, it's images. Maybe the spymaster can draw a picture as the hint or give a word. 

# TODO
- Game rules somewhere 
- Pressing join on the name select should request the current room state so it has the up to date stage
    Maybe also keep track of the time left on the server so clients always see an accurate countdown
- Chat window
- Make host option
- Show public rooms
~~- Fix 20Q Results screen~~
    ~~Also make question log wider~~
~~- Trivia should automatically advance when all players have guessed correctly~~
~~- Scores and guesses not properly resetting after game ends ~~
- Clean trivia answers (remove disambiguation and try to prevent exact matches of words from the question itself) 
- Show question quantities 
- Revamp "winning" aspect of 20Q. It might be better to just make it so that winning means guessing the thing within the amount of questions. 
~~- Show correct answers during Reveal~~
- Synchronize settings so non-host players can see it too
- Handle players losing connection better and show reconnect button
