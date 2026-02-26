import mongoose, { type Document, type Model } from 'mongoose';

export interface IUser extends Document {
  student_id: string;
  email: string;
  mobile: string;
  firstname: string;
  lastname: string;
  profile_pic: string | null;
  class?: string;
  segment?: string;
  address?: string;
  ruppi_token_encrypted: string;
  password?: string;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    student_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      default: '',
      trim: true,
    },
    profile_pic: {
      type: String,
      default: null,
    },
    class: {
      type: String,
      trim: true,
    },
    segment: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // CRITICAL: select: false — this field is excluded from ALL Mongoose queries by default.
    // Must explicitly use .select('+ruppi_token_encrypted') to read it.
    ruppi_token_encrypted: {
      type: String,
      required: true,
      select: false,
    },
    password: {
      type: String,
      select: false,
    },
    last_login: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// Prevent leaking ruppi_token_encrypted via JSON serialization
userSchema.methods['toJSON'] = function () {
  type SafeUser = Omit<IUser, 'ruppi_token_encrypted'> & { ruppi_token_encrypted?: string };
  const obj = this.toObject() as SafeUser;
  delete obj.ruppi_token_encrypted;
  delete obj.password;
  return obj;
};

export const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);
