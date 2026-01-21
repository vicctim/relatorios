'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Verifica se a coluna já existe
    const tableDescription = await queryInterface.describeTable('videos');
    
    if (!tableDescription.custom_duration_seconds) {
      await queryInterface.addColumn('videos', 'custom_duration_seconds', {
        type: Sequelize.FLOAT,
        allowNull: true,
        after: 'duration_seconds',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('videos');
    
    if (tableDescription.custom_duration_seconds) {
      await queryInterface.removeColumn('videos', 'custom_duration_seconds');
    }
  },
};
