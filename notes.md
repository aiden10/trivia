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
    --bind 127.0.0.1:8000

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
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://127.0.0.1:8000;
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
