import sequelize from '../config/database';
import User from './User';
import Setting, { DEFAULT_SETTINGS } from './Setting';
import Professional from './Professional';
import Video from './Video';
import DownloadLog from './DownloadLog';
import NotificationRecipient from './NotificationRecipient';
import ShareLink from './ShareLink';

// Sync database and seed default settings
const initDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ force });
    console.log('All models synchronized.');

    // Seed default settings (always ensure they exist)
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await Setting.findOne({ where: { key } });
      if (!existing || force) {
        await Setting.setValue(key, value);
      }
    }
    if (force) {
      console.log('Default settings seeded.');
    }

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { email: 'admin@pixfilmes.com' } });
    if (!adminExists) {
      await User.create({
        name: 'Administrador',
        email: 'admin@pixfilmes.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Default admin user created: admin@pixfilmes.com / admin123');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Additional Association for Video <-> ShareLink
Video.belongsToMany(ShareLink, {
  through: 'share_link_videos',
  as: 'shareLinks',
  foreignKey: 'videoId',
  otherKey: 'shareLinkId',
});

export {
  sequelize,
  User,
  Setting,
  Professional,
  Video,
  DownloadLog,
  NotificationRecipient,
  ShareLink,
  initDatabase,
  DEFAULT_SETTINGS,
};
