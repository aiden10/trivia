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

# Trivia
This can be expanded to include images of things or people. Could also include songs using the Deezer API. Wikipedia would be good for images, but it also has way too many obscure pages, and if I wanted categories for these, then it would need to be categorized as well. Songs would have a similar issue because even if you pick categories, there are way too many. With songs though I could maybe use the Spotify API too to determine if a song is popular enough to include. 
    
# People Guesser Bomb Party
Instead of everyone guessing as many as they can, players take turns guessing a person who has the specific properties on their turn. I think I'd try to have the UI still mainly text based instead of showing players in a circle with an arrow. A grid with different sized cells which contain information about: prompt (properties), lives left of other players, your lives left, who's next, and above that would be the search bar. On mobile it can resize to have more rows and less columns.  

# TODO
- Game rules somewhere 
- Pressing join on the name select should request the current room state so it has the up to date stage
    Maybe also keep track of the time left on the server so clients always see an accurate countdown
- Chat window
- Move player list to side when image is shown in trivia
- Lobby

