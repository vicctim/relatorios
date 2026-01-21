import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Video from './Video';
import User from './User';

interface ShareLinkAttributes {
    id: number;
    token: string;
    customSlug: string | null;
    name: string | null;
    message: string | null;
    expiresAt: Date | null;
    downloads: number;
    maxDownloads: number | null;
    active: boolean;
    createdBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ShareLinkCreationAttributes extends Optional<ShareLinkAttributes, 'id' | 'customSlug' | 'name' | 'message' | 'expiresAt' | 'downloads' | 'maxDownloads' | 'active' | 'createdAt' | 'updatedAt'> { }

class ShareLink extends Model<ShareLinkAttributes, ShareLinkCreationAttributes> implements ShareLinkAttributes {
    public id!: number;
    public token!: string;
    public customSlug!: string | null;
    public name!: string | null;
    public message!: string | null;
    public expiresAt!: Date | null;
    public downloads!: number;
    public maxDownloads!: number | null;
    public active!: boolean;
    public createdBy!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associations
    public videos?: Video[];
    public creator?: User;

    // Mixins
    public addVideo!: (video: Video | number) => Promise<void>;
    public addVideos!: (videos: Video[] | number[]) => Promise<void>;
    public getVideos!: () => Promise<Video[]>;
}

ShareLink.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        token: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        customSlug: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
            // Com underscored: true na config global, customSlug vira custom_slug automaticamente
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        downloads: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        maxDownloads: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        createdBy: {
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
        tableName: 'share_links',
        timestamps: true,
        // Usa underscored: true da config global, então customSlug -> custom_slug
    }
);

// Associations
ShareLink.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

ShareLink.belongsToMany(Video, {
    through: 'share_link_videos',
    as: 'videos',
    foreignKey: 'shareLinkId',
    otherKey: 'videoId'
});

export default ShareLink;
