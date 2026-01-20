'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('videos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'videos',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      original_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      stored_filename: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      thumbnail_path: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      file_size_bytes: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      duration_seconds: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      width_pixels: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      height_pixels: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      resolution_label: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      is_tv: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tv_title: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      request_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      completion_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      professional_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'professionals',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('videos', ['parent_id'], {
      name: 'videos_parent_id_idx',
    });

    await queryInterface.addIndex('videos', ['request_date'], {
      name: 'videos_request_date_idx',
    });

    await queryInterface.addIndex('videos', ['professional_id'], {
      name: 'videos_professional_id_idx',
    });

    await queryInterface.addIndex('videos', ['uploaded_by'], {
      name: 'videos_uploaded_by_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('videos');
  },
};
