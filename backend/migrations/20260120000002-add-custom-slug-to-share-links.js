'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verifica se a coluna já existe (tanto camelCase quanto snake_case)
    const tableDescription = await queryInterface.describeTable('share_links');
    
    // Verificar ambos os nomes possíveis
    const hasCustomSlug = tableDescription.customSlug || tableDescription.custom_slug;
    
    if (!hasCustomSlug) {
      // MySQL usa snake_case por padrão
      await queryInterface.addColumn('share_links', 'custom_slug', {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        after: 'token'
      });

      // Adicionar índice para busca rápida
      await queryInterface.addIndex('share_links', ['custom_slug'], {
        name: 'idx_share_links_custom_slug',
        unique: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('share_links');
    
    const hasCustomSlug = tableDescription.customSlug || tableDescription.custom_slug;
    
    if (hasCustomSlug) {
      try {
        await queryInterface.removeIndex('share_links', 'idx_share_links_custom_slug');
      } catch (error) {
        // Índice pode não existir
        console.log('Index already removed or does not exist');
      }
      const columnName = tableDescription.custom_slug ? 'custom_slug' : 'customSlug';
      await queryInterface.removeColumn('share_links', columnName);
    }
  }
};
