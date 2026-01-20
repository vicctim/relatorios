import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Video from './Video';
import User from './User';

interface DownloadLogAttributes {
  id: number;
  videoId: number;
  userId: number;
  downloadedAt: Date;
  ipAddress: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DownloadLogCreationAttributes extends Optional<DownloadLogAttributes, 'id' | 'ipAddress' | 'createdAt' | 'updatedAt'> {}

class DownloadLog extends Model<DownloadLogAttributes, DownloadLogCreationAttributes> implements DownloadLogAttributes {
  public id!: number;
  public videoId!: number;
  public userId!: number;
  public downloadedAt!: Date;
  public ipAddress!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public video?: Video;
  public user?: User;
}

DownloadLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'videos',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    downloadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'download_logs',
  }
);

// Associations
DownloadLog.belongsTo(Video, {
  as: 'video',
  foreignKey: 'videoId',
});

DownloadLog.belongsTo(User, {
  as: 'user',
  foreignKey: 'userId',
});

Video.hasMany(DownloadLog, {
  as: 'downloads',
  foreignKey: 'videoId',
});

User.hasMany(DownloadLog, {
  as: 'downloads',
  foreignKey: 'userId',
});

export default DownloadLog;
