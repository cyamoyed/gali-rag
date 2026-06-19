import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'gali_rag.db')


def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. 创建 prompt_presets 表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prompt_presets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(128) NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            is_system BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_prompt_presets_name ON prompt_presets (name)")
    print("Created prompt_presets table")

    # 2. 给 prompt_templates 添加 preset_id 列
    try:
        cursor.execute("ALTER TABLE prompt_templates ADD COLUMN preset_id INTEGER REFERENCES prompt_presets(id) ON DELETE CASCADE")
        print("Added preset_id column to prompt_templates")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("preset_id column already exists in prompt_templates")
        else:
            raise

    cursor.execute("CREATE INDEX IF NOT EXISTS ix_prompt_templates_preset_id ON prompt_templates (preset_id)")

    # 3. 给 agents 添加 preset_id 列
    try:
        cursor.execute("ALTER TABLE agents ADD COLUMN preset_id INTEGER REFERENCES prompt_presets(id) ON DELETE SET NULL")
        print("Added preset_id column to agents")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("preset_id column already exists in agents")
        else:
            raise

    # 4. 从现有模板名称前缀解析预设，创建 PromptPreset 记录并回填 preset_id
    cursor.execute("SELECT id, name FROM prompt_templates WHERE is_system = 1")
    rows = cursor.fetchall()

    preset_map = {}  # preset_name -> preset_id
    for template_id, template_name in rows:
        if template_name.startswith("[") and "]" in template_name:
            preset_name = template_name[1:template_name.index("]")]
        else:
            preset_name = "通用知识库"

        if preset_name not in preset_map:
            is_active = 1 if preset_name == "通用知识库" else 0
            cursor.execute(
                "INSERT OR IGNORE INTO prompt_presets (name, is_system, is_active) VALUES (?, 1, ?)",
                (preset_name, is_active),
            )
            cursor.execute("SELECT id FROM prompt_presets WHERE name = ?", (preset_name,))
            preset_map[preset_name] = cursor.fetchone()[0]
            print(f"  Created preset: {preset_name} (id={preset_map[preset_name]}, active={is_active})")

        cursor.execute("UPDATE prompt_templates SET preset_id = ? WHERE id = ?", (preset_map[preset_name], template_id))

    # 确保至少有一个 active preset
    cursor.execute("SELECT COUNT(*) FROM prompt_presets WHERE is_active = 1")
    if cursor.fetchone()[0] == 0:
        cursor.execute("SELECT id FROM prompt_presets LIMIT 1")
        row = cursor.fetchone()
        if row:
            cursor.execute("UPDATE prompt_presets SET is_active = 1 WHERE id = ?", (row[0],))
            print(f"  Set preset id={row[0]} as active (fallback)")

    conn.commit()
    conn.close()
    print("Migration completed")


if __name__ == "__main__":
    migrate()
