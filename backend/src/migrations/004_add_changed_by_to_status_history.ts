import { QueryInterface, DataTypes } from 'sequelize';

/**
 * Migration 004: Add `changed_by` column to game_status_history.
 *
 * Tracks which admin user performed a status change.
 * NULL means the change was made by the system (e.g. periodic auto-release job).
 */

export async function up(queryInterface: QueryInterface): Promise<void> {
  const qi = queryInterface;

  // Add changed_by column (nullable FK to users)
  await qi.addColumn('game_status_history', 'changed_by', {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    references: {
      model: 'users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  // Index for quick lookups by user
  await qi.addIndex('game_status_history', ['changed_by'], {
    name: 'idx_game_status_history_changed_by',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeIndex('game_status_history', 'idx_game_status_history_changed_by');
  await queryInterface.removeColumn('game_status_history', 'changed_by');
}
