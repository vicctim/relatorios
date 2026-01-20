import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProfessionalAttributes {
  id: number;
  name: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProfessionalCreationAttributes extends Optional<ProfessionalAttributes, 'id' | 'active' | 'createdAt' | 'updatedAt'> {}

class Professional extends Model<ProfessionalAttributes, ProfessionalCreationAttributes> implements ProfessionalAttributes {
  public id!: number;
  public name!: string;
  public active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Professional.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
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
    tableName: 'professionals',
  }
);

export default Professional;
