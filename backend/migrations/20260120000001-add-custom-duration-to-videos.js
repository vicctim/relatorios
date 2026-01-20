'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('videos', 'custom_duration_seconds', {
      type: Sequelize.FLOAT,
      allowNull: true,
      after: 'duration_seconds',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('videos', 'custom_duration_seconds');
  },
};
