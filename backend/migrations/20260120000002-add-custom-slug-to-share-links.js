'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar se a tabela existe
    const [tables] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'share_links'"
    );
    
    if (tables.length === 0) {
      // Tabela não existe, criar primeiro
      await queryInterface.createTable('share_links', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        token: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        custom_slug: {
          type: Sequelize.STRING(100),
          allowNull: true,
          unique: true,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        expires_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        downloads: {
          type: Sequelize.INTEGER,
          defaultValue: 0,
        },
        max_downloads: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        active: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id',
          },
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

      // Criar tabela de relacionamento many-to-many
      await queryInterface.createTable('share_link_videos', {
        share_link_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'share_links',
            key: 'id',
          },
          onDelete: 'CASCADE',
        },
        video_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'videos',
            key: 'id',
          },
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

      // Adicionar índice único composto
      await queryInterface.addIndex('share_link_videos', ['share_link_id', 'video_id'], {
        unique: true,
        name: 'idx_share_link_videos_unique'
      });

      // Adicionar índice para custom_slug
      await queryInterface.addIndex('share_links', ['custom_slug'], {
        name: 'idx_share_links_custom_slug',
        unique: true
      });
    } else {
      // Tabela existe, apenas adicionar a coluna se não existir
      try {
        const tableDescription = await queryInterface.describeTable('share_links');
        const hasCustomSlug = tableDescription.custom_slug || tableDescription.customSlug;
        
        if (!hasCustomSlug) {
          await queryInterface.addColumn('share_links', 'custom_slug', {
            type: Sequelize.STRING(100),
            allowNull: true,
            unique: true,
            after: 'token'
          });

          await queryInterface.addIndex('share_links', ['custom_slug'], {
            name: 'idx_share_links_custom_slug',
            unique: true
          });
        }
      } catch (error) {
        // Se der erro ao descrever a tabela, tentar adicionar a coluna mesmo assim
        console.log('Error describing table, attempting to add column anyway:', error.message);
        try {
          await queryInterface.addColumn('share_links', 'custom_slug', {
            type: Sequelize.STRING(100),
            allowNull: true,
            unique: true,
          });
        } catch (addError) {
          console.log('Column may already exist:', addError.message);
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable('share_links');
      const hasCustomSlug = tableDescription.custom_slug || tableDescription.customSlug;
      
      if (hasCustomSlug) {
        try {
          await queryInterface.removeIndex('share_links', 'idx_share_links_custom_slug');
        } catch (error) {
          console.log('Index already removed or does not exist');
        }
        const columnName = tableDescription.custom_slug ? 'custom_slug' : 'customSlug';
        await queryInterface.removeColumn('share_links', columnName);
      }
    } catch (error) {
      console.log('Table may not exist:', error.message);
    }
  }
};
