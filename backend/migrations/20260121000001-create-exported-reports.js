'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('exported_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM('monthly', 'dateRange'),
        allowNull: false,
      },
      month: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      date_field: {
        type: Sequelize.ENUM('requestDate', 'completionDate'),
        allowNull: true,
      },
      filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      total_videos: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_duration: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      exported_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Indexes
    await queryInterface.addIndex('exported_reports', ['exported_by'], {
      name: 'idx_exported_reports_exported_by',
    });
    await queryInterface.addIndex('exported_reports', ['type', 'year', 'month'], {
      name: 'idx_exported_reports_type_year_month',
    });
    await queryInterface.addIndex('exported_reports', ['created_at'], {
      name: 'idx_exported_reports_created_at',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('exported_reports');
  }
};
