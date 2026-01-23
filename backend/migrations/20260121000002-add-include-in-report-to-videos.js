'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('videos', 'include_in_report', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Se true, o vídeo é incluído nos relatórios e contabiliza segundos. Se false, apenas arquivado.',
    });

    // Garantir que todos os registros existentes tenham include_in_report = true
    await queryInterface.sequelize.query(
      `UPDATE videos SET include_in_report = true WHERE include_in_report IS NULL OR include_in_report = false;`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('videos', 'include_in_report');
  },
};
