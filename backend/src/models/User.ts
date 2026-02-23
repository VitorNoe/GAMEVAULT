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
  email_verified: boolean;
  email_verification_token?: string | null;
  password_reset_token?: string | null;
  password_reset_expires?: Date | null;
  notification_push: boolean;
  notification_email: boolean;
  notification_in_app: boolean;
  last_login?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

// Attributes for user creation (id is optional since it's auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatar_url' | 'bio' | 'email_verified' | 'email_verification_token' | 'password_reset_token' | 'password_reset_expires' | 'notification_push' | 'notification_email' | 'notification_in_app' | 'last_login' | 'created_at' | 'updated_at'> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public avatar_url?: string;
  public bio?: string;
  public type!: 'regular' | 'admin';
  public email_verified!: boolean;
  public email_verification_token?: string | null;
  public password_reset_token?: string | null;
  public password_reset_expires?: Date | null;
  public notification_push!: boolean;
  public notification_email!: boolean;
  public notification_in_app!: boolean;
  public last_login?: Date | null;
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

  // Check if password reset token is expired
  public isResetTokenExpired(): boolean {
    if (!this.password_reset_expires) return true;
    return new Date() > new Date(this.password_reset_expires);
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
    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notification_push: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notification_email: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notification_in_app: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
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
