"""phase_5_1_5_2_schema_updates

Revision ID: 002_phase_5_1_5_2_schema_updates
Revises: 001_create_core_tables
Create Date: 2026-09-25 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_phase_5_1_5_2_schema_updates'
down_revision: Union[str, None] = '001_create_core_tables'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Update field_observations table for Phase 5.2 Community Sentinel Network
    with op.batch_alter_table('field_observations') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.String(), nullable=True, server_default='community_sentinel_anon'))
        batch_op.add_column(sa.Column('source_type', sa.String(), nullable=True, server_default='community_sentinel'))
        batch_op.add_column(sa.Column('verification_state', sa.String(), nullable=False, server_default='PENDING'))
        batch_op.add_column(sa.Column('sentinel_tier', sa.String(), nullable=False, server_default='ACTIVE_REPORTER'))
        batch_op.alter_column('location', existing_type=sa.NullType(), nullable=True)

    # 2. Create threshold_alerts table if not exists for Phase 5.2 Field Companion Alert Layer
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'threshold_alerts' not in tables:
        op.create_table(
            'threshold_alerts',
            sa.Column('id', sa.String(), nullable=False),
            sa.Column('case_id', sa.String(), nullable=False),
            sa.Column('evidence_id', sa.String(), nullable=True),
            sa.Column('metric_name', sa.String(), nullable=False, server_default='delta_backscatter'),
            sa.Column('threshold_value', sa.Float(), nullable=False, server_default='-2.0'),
            sa.Column('comparison', sa.String(), nullable=False, server_default='less_than'),
            sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
            sa.Column('triggered_state', sa.String(), nullable=False, server_default='ARMED'),
            sa.Column('alert_state', sa.String(), nullable=False, server_default='UNAVAILABLE'),
            sa.Column('acknowledgement_status', sa.String(), nullable=False, server_default='UNREAD'),
            sa.Column('safe_message', sa.String(), nullable=True),
            sa.Column('last_evaluated_val', sa.Float(), nullable=True),
            sa.Column('last_triggered_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
            sa.ForeignKeyConstraint(['case_id'], ['cases.case_id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['evidence_id'], ['evidence.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_threshold_alerts_case_id'), 'threshold_alerts', ['case_id'], unique=False)
        op.create_index(op.f('ix_threshold_alerts_evidence_id'), 'threshold_alerts', ['evidence_id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if 'threshold_alerts' in tables:
        op.drop_index(op.f('ix_threshold_alerts_evidence_id'), table_name='threshold_alerts')
        op.drop_index(op.f('ix_threshold_alerts_case_id'), table_name='threshold_alerts')
        op.drop_table('threshold_alerts')

    with op.batch_alter_table('field_observations') as batch_op:
        batch_op.drop_column('sentinel_tier')
        batch_op.drop_column('verification_state')
        batch_op.drop_column('source_type')
        batch_op.drop_column('user_id')
        batch_op.alter_column('location', existing_type=sa.NullType(), nullable=False)
