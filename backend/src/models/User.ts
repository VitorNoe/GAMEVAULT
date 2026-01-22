import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

// User attributes interface
export interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  type: 'regular' | 'admin';
  created_at?: Date;
  updated_at?: Date;
}

// Attributes for user creation (id is optional since it's auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar_url' | 'bio' | 'created_at' | 'updated_at'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public avatar_url?: string;
  public bio?: string;
  public type!: 'regular' | 'admin';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Method to compare passwords
  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  // Method to hash password
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('regular', 'admin'),
      defaultValue: 'regular',
      allowNull: false,
      field: 'user_type'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default User;
