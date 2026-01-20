import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NotificationType = 'email' | 'whatsapp';

interface NotificationRecipientAttributes {
  id: number;
  type: NotificationType;
  value: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationRecipientCreationAttributes extends Optional<NotificationRecipientAttributes, 'id' | 'active' | 'createdAt' | 'updatedAt'> {}

class NotificationRecipient extends Model<NotificationRecipientAttributes, NotificationRecipientCreationAttributes> implements NotificationRecipientAttributes {
  public id!: number;
  public type!: NotificationType;
  public value!: string;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static async getActiveEmails(): Promise<string[]> {
    const recipients = await NotificationRecipient.findAll({
      where: { type: 'email', active: true },
    });
    return recipients.map(r => r.value);
  }

  public static async getActivePhones(): Promise<string[]> {
    const recipients = await NotificationRecipient.findAll({
      where: { type: 'whatsapp', active: true },
    });
    return recipients.map(r => r.value);
  }
}

NotificationRecipient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('email', 'whatsapp'),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'notification_recipients',
  }
);

export default NotificationRecipient;
