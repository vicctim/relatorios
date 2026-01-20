import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Professional from './Professional';
import User from './User';

interface VideoAttributes {
  id: number;
  parentId: number | null;
  title: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  thumbnailPath: string | null;
  fileSizeBytes: number;
  durationSeconds: number;
  customDurationSeconds: number | null;
  widthPixels: number;
  heightPixels: number;
  resolutionLabel: string;
  isTv: boolean;
  tvTitle: string | null;
  requestDate: Date;
  completionDate: Date;
  professionalId: number;
  uploadedBy: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, 'id' | 'parentId' | 'isTv' | 'tvTitle' | 'thumbnailPath' | 'customDurationSeconds' | 'createdAt' | 'updatedAt'> {}

class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: number;
  public parentId!: number | null;
  public title!: string;
  public originalFilename!: string;
  public storedFilename!: string;
  public filePath!: string;
  public thumbnailPath!: string | null;
  public fileSizeBytes!: number;
  public durationSeconds!: number;
  public customDurationSeconds!: number | null;
  public widthPixels!: number;
  public heightPixels!: number;
  public resolutionLabel!: string;
  public isTv!: boolean;
  public tvTitle!: string | null;
  public requestDate!: Date;
  public completionDate!: Date;
  public professionalId!: number;
  public uploadedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public professional?: Professional;
  public uploader?: User;
  public versions?: Video[];
  public parent?: Video;

  // Calcula duração contabilizada (customDuration se definido, senão 100% para pai, 50% para versão)
  public getCalculatedDuration(): number {
    // Se tem duração customizada, usa ela
    if (this.customDurationSeconds !== null && this.customDurationSeconds !== undefined) {
      return this.customDurationSeconds;
    }
    // Se é versão (tem parentId), usa 50%
    if (this.parentId) {
      return this.durationSeconds * 0.5;
    }
    // Senão, usa 100% da duração
    return this.durationSeconds;
  }

  // Verifica se é vídeo pai (não tem parentId)
  public isParent(): boolean {
    return this.parentId === null;
  }
}

Video.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'videos',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    storedFilename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    thumbnailPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    fileSizeBytes: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    durationSeconds: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    customDurationSeconds: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: 'custom_duration_seconds',
    },
    widthPixels: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    heightPixels: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    resolutionLabel: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    isTv: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    tvTitle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    requestDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    professionalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'professionals',
        key: 'id',
      },
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'videos',
    hooks: {
      beforeCreate: (video: Video) => {
        // Título sempre em maiúsculo
        video.title = video.title.toUpperCase();
        // Gera label de resolução
        video.resolutionLabel = `${video.widthPixels}x${video.heightPixels}`;
      },
      beforeUpdate: (video: Video) => {
        if (video.changed('title')) {
          video.title = video.title.toUpperCase();
        }
        if (video.changed('widthPixels') || video.changed('heightPixels')) {
          video.resolutionLabel = `${video.widthPixels}x${video.heightPixels}`;
        }
      },
    },
  }
);

// Self-reference for versions
Video.hasMany(Video, {
  as: 'versions',
  foreignKey: 'parentId',
});

Video.belongsTo(Video, {
  as: 'parent',
  foreignKey: 'parentId',
});

// Association with Professional
Video.belongsTo(Professional, {
  as: 'professional',
  foreignKey: 'professionalId',
});

Professional.hasMany(Video, {
  as: 'videos',
  foreignKey: 'professionalId',
});

// Association with User
Video.belongsTo(User, {
  as: 'uploader',
  foreignKey: 'uploadedBy',
});

export default Video;
