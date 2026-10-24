import sqlite3
import asyncio

class Stats:
    def __init__(self, db_path="stats.db"):
        self._lock = asyncio.Lock()
        # Wait for a concurrent writer (e.g. a uvicorn reloader process that is
        # still shutting down) instead of failing immediately.
        self.db = sqlite3.connect(db_path, check_same_thread=False, timeout=30)
        self.db.execute("PRAGMA busy_timeout = 30000")
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
        # Commit the schema setup before the migration below.  Otherwise a
        # duplicate-column error (which is expected on every start after the
        # first) leaves this transaction open and locks the database.
        self.db.commit()

        # For when I add new columns after the stats table has already been created
        try:
            self.db.execute("""
                ALTER TABLE global_stats ADD COLUMN most_active_players INTEGER DEFAULT 0
            """)
            self.db.commit()
        except sqlite3.OperationalError as e:
            self.db.rollback()
            if "duplicate column name" not in str(e).lower():
                raise

        self.active_players = 0
        self.total_joins = 0
        self.total_leaves = 0
        self.most_active_players = 0

    async def on_join(self):
        async with self._lock:
            self.active_players += 1
            self.total_joins += 1
            if self.active_players > self.most_active_players:
                self.most_active_players = self.active_players

    async def on_exit(self):
        async with self._lock:
            self.active_players -= 1
            self.total_leaves += 1

    async def write_to_db(self):
        async with self._lock:
            joins = self.total_joins
            leaves = self.total_leaves
            most_active = self.most_active_players
            self.total_joins = 0
            self.total_leaves = 0

        if joins or leaves or most_active:
            self.db.execute(
                """
                UPDATE global_stats
                SET
                    total_joins = total_joins + ?,
                    total_leaves = total_leaves + ?,
                    most_active_players = MAX(most_active_players, ?)
                WHERE id = 1
                """,
                (joins, leaves, most_active)
            )
            self.db.commit()
    
    async def to_dict(self):
        async with self._lock:
            cursor = self.db.execute(
                "SELECT total_joins, total_leaves, most_active_players FROM global_stats WHERE id = 1"
            )
            row = cursor.fetchone()
            db_joins, db_leaves, db_most_active = row if row else (0, 0, 0)
            
            return {
                "active_players": self.active_players,
                "total_joins": db_joins + self.total_joins,
                "total_leaves": db_leaves + self.total_leaves,
                "most_active_players": max(db_most_active, self.most_active_players),
            }

    def close(self):
        """Flush and release the database file (important for dev reloads)."""
        try:
            self.db.commit()
        except sqlite3.Error:
            pass
        self.db.close()