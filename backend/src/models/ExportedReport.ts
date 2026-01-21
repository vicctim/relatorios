import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface ExportedReportAttributes {
    id: number;
    type: 'monthly' | 'dateRange';
    month: number | null;
    year: number | null;
    startDate: Date | null;
    endDate: Date | null;
    dateField: 'requestDate' | 'completionDate' | null;
    filename: string;
    filePath: string;
    fileSize: number;
    totalVideos: number;
    totalDuration: number;
    exportedBy: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ExportedReportCreationAttributes extends Optional<ExportedReportAttributes, 'id' | 'month' | 'year' | 'startDate' | 'endDate' | 'dateField' | 'createdAt' | 'updatedAt'> { }

class ExportedReport extends Model<ExportedReportAttributes, ExportedReportCreationAttributes> implements ExportedReportAttributes {
    public id!: number;
    public type!: 'monthly' | 'dateRange';
    public month!: number | null;
    public year!: number | null;
    public startDate!: Date | null;
    public endDate!: Date | null;
    public dateField!: 'requestDate' | 'completionDate' | null;
    public filename!: string;
    public filePath!: string;
    public fileSize!: number;
    public totalVideos!: number;
    public totalDuration!: number;
    public exportedBy!: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Associations
    public exporter?: User;
}

ExportedReport.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type: {
            type: DataTypes.ENUM('monthly', 'dateRange'),
            allowNull: false,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        dateField: {
            type: DataTypes.ENUM('requestDate', 'completionDate'),
            allowNull: true,
        },
        filename: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        filePath: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        fileSize: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        totalVideos: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        totalDuration: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: 0,
        },
        exportedBy: {
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
        tableName: 'exported_reports',
        timestamps: true,
        underscored: true,
    }
);

// Associations
ExportedReport.belongsTo(User, {
    foreignKey: 'exportedBy',
    as: 'exporter',
});

export default ExportedReport;
