"""add_opportunity_verification_and_guide_fields

Revision ID: eb0c505e57e9
Revises: c028c4753453
Create Date: 2026-10-27 21:58:07.627421

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = 'eb0c505e57e9'
down_revision: Union[str, Sequence[str], None] = 'c028c4753453'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)

    # 1. opportunity_sync_logs
    if not inspector.has_table('opportunity_sync_logs'):
        op.create_table('opportunity_sync_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('source_name', sa.String(length=100), nullable=False),
            sa.Column('status', sa.String(length=50), nullable=False),
            sa.Column('items_checked', sa.Integer(), nullable=False),
            sa.Column('items_updated', sa.Integer(), nullable=False),
            sa.Column('message', sa.Text(), nullable=True),
            sa.Column('checked_at', sa.DateTime(), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_opportunity_sync_logs_id'), 'opportunity_sync_logs', ['id'], unique=False)

    # 2. guide_articles columns
    guide_cols = [c['name'] for c in inspector.get_columns('guide_articles')]
    if 'target_audience' not in guide_cols:
        op.add_column('guide_articles', sa.Column('target_audience', sa.String(length=255), nullable=True))
    if 'checklist_items' not in guide_cols:
        op.add_column('guide_articles', sa.Column('checklist_items', sa.Text(), nullable=True))
    if 'template_example' not in guide_cols:
        op.add_column('guide_articles', sa.Column('template_example', sa.Text(), nullable=True))
    if 'updated_at' not in guide_cols:
        op.add_column('guide_articles', sa.Column('updated_at', sa.DateTime(), nullable=True))

    # 3. opportunities columns
    opp_cols = [c['name'] for c in inspector.get_columns('opportunities')]
    if 'source_identifier' not in opp_cols:
        op.add_column('opportunities', sa.Column('source_identifier', sa.String(length=255), nullable=True))
        op.create_index(op.f('ix_opportunities_source_identifier'), 'opportunities', ['source_identifier'], unique=True)
    if 'summary' not in opp_cols:
        op.add_column('opportunities', sa.Column('summary', sa.Text(), nullable=True))
    if 'published_date' not in opp_cols:
        op.add_column('opportunities', sa.Column('published_date', sa.DateTime(), nullable=True))
    if 'application_url' not in opp_cols:
        op.add_column('opportunities', sa.Column('application_url', sa.String(length=500), nullable=True))
    if 'last_checked_at' not in opp_cols:
        op.add_column('opportunities', sa.Column('last_checked_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    pass
