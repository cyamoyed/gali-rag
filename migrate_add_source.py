import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'gali_rag.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE conversations ADD COLUMN source VARCHAR(16) DEFAULT 'test'")
        print("Added source column to conversations table")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("source column already exists")
        else:
            raise
    
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_conv_agent_source ON conversations (agent_id, source)")
    print("Created index ix_conv_agent_source")
    
    conn.commit()
    conn.close()
    print("Migration completed")

if __name__ == "__main__":
    migrate()
