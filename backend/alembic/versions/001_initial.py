"""initial

Revision ID: 001
Revises: 
Create Date: 2026-05-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 1. ATOMIC ENUM CREATION
    # We define both Custom Types here so the DB knows what they are.
    op.execute("""
        DO $$ 
        BEGIN 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN 
                CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'STANDARD'); 
            END IF; 
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN 
                CREATE TYPE taskstatus AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'); 
            END IF; 
        END $$;
    """)

    # 2. Users Table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=64), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', postgresql.ENUM('ADMIN', 'STANDARD', name='user_role_enum', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )

    # 3. Workspaces Table
    op.create_table('workspaces',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=128), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_workspace_user_name')
    )

    # 4. Agent Configs Table
    op.create_table('agent_configs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('workspace_id', sa.Integer(), nullable=False),
        sa.Column('model_name', sa.String(length=128), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.CheckConstraint('temperature >= 0.0 AND temperature <= 2.0', name='check_temperature_range'),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Task Queue Table
    op.create_table('task_queue',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('prompt_text', sa.Text(), nullable=False),
        # FIXED: Points to the 'taskstatus' type we created in Step 1
        sa.Column('status', postgresql.ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', name='taskstatus', create_type=False), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['agent_id'], ['agent_configs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Execution Logs Table
    op.create_table('execution_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('response_text', sa.Text(), nullable=False),
        sa.Column('execution_time_ms', sa.Integer(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['task_queue.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('task_id')
    )

def downgrade():
    op.drop_table('execution_logs')
    op.drop_table('task_queue')
    op.drop_table('agent_configs')
    op.drop_table('workspaces')
    op.drop_table('users')
    op.execute("DROP TYPE IF EXISTS user_role_enum;")
    op.execute("DROP TYPE IF EXISTS taskstatus;")