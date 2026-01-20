import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SettingAttributes {
  id: number;
  key: string;
  value: string;
  updatedBy: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SettingCreationAttributes extends Optional<SettingAttributes, 'id' | 'updatedBy' | 'createdAt' | 'updatedAt'> {}

class Setting extends Model<SettingAttributes, SettingCreationAttributes> implements SettingAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public updatedBy!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getValueParsed<T>(): T {
    try {
      return JSON.parse(this.value) as T;
    } catch {
      return this.value as unknown as T;
    }
  }

  public static async getValue<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const setting = await Setting.findOne({ where: { key } });
    if (!setting) return defaultValue;
    return setting.getValueParsed<T>();
  }

  public static async setValue(key: string, value: any, updatedBy?: number): Promise<Setting> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const [setting] = await Setting.upsert({
      key,
      value: stringValue,
      updatedBy: updatedBy || null,
    });
    return setting;
  }

  public static async getAll(): Promise<Record<string, any>> {
    const settings = await Setting.findAll();
    const result: Record<string, any> = {};
    for (const setting of settings) {
      result[setting.key] = setting.getValueParsed();
    }
    return result;
  }
}

Setting.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'settings',
  }
);

// Default settings keys
export const DEFAULT_SETTINGS = {
  company_name: 'Pix Filmes',
  company_phone: '',
  company_address: '',
  company_cnpj: '',
  company_logo_path: '',
  monthly_limit_seconds: 1100,
  rollover_months: 2,
  compression_threshold_mb: 100,
  ffmpeg_preset: {
    videoBitrate: '2000k',
    audioBitrate: '128k',
    resolution: '1280x720',
    crf: 23,
  },
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_password: '',
  smtp_from: '',
  evolution_api_url: '',
  evolution_api_token: '',
  evolution_instance: '',
};

export default Setting;
