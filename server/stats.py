import sqlite3
import asyncio

class Stats:
    def __init__(self, db_path="stats.db"):
        self._lock = asyncio.Lock()
        self.db = sqlite3.connect(db_path, check_same_thread=False)
        self.db.execute("""
            CREATE TABLE IF NOT EXISTS global_stats (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                total_joins INTEGER NOT NULL,
                total_leaves INTEGER NOT NULL
            )
        """)
        self.db.execute("""
            INSERT OR IGNORE INTO global_stats (id, total_joins, total_leaves)
            VALUES (1, 0, 0)
        """)
        self.db.commit()

        self.active_players = 0
        self.total_joins = 0
        self.total_leaves = 0

    async def on_join(self):
        async with self._lock:
            self.active_players += 1
            self.total_joins += 1

    async def on_exit(self):
        async with self._lock:
            self.active_players -= 1
            self.total_leaves += 1

    async def write_to_db(self):
        async with self._lock:
            joins = self.total_joins
            leaves = self.total_leaves
            self.total_joins = 0
            self.total_leaves = 0

        if joins or leaves:
            self.db.execute(
                """
                UPDATE global_stats
                SET
                    total_joins = total_joins + ?,
                    total_leaves = total_leaves + ?
                WHERE id = 1
                """,
                (joins, leaves)
            )
            self.db.commit()
    
    async def to_dict(self):
        async with self._lock:
            cursor = self.db.execute(
                "SELECT total_joins, total_leaves FROM global_stats WHERE id = 1"
            )
            row = cursor.fetchone()
            db_joins, db_leaves = row if row else (0, 0)
            
            return {
                "active_players": self.active_players,
                "total_joins": db_joins + self.total_joins,
                "total_leaves": db_leaves + self.total_leaves,
            }