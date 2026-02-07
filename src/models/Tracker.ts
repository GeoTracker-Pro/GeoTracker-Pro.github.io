import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeviceInfo {
  browser: string;
  os: string;
  platform: string;
  screen: string;
  userAgent: string;
}

export interface ILocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  deviceInfo?: IDeviceInfo;
  ip?: string;
}

export interface ITracker extends Document {
  trackerId: string;
  name: string;
  locations: ILocationData[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceInfoSchema = new Schema<IDeviceInfo>(
  {
    browser: { type: String },
    os: { type: String },
    platform: { type: String },
    screen: { type: String },
    userAgent: { type: String },
  },
  { _id: false }
);

const LocationDataSchema = new Schema<ILocationData>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    deviceInfo: { type: DeviceInfoSchema },
    ip: { type: String },
  },
  { _id: true }
);

const TrackerSchema: Schema<ITracker> = new Schema(
  {
    trackerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tracker name is required'],
      trim: true,
    },
    locations: {
      type: [LocationDataSchema],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent model recompilation error
const Tracker: Model<ITracker> =
  mongoose.models.Tracker || mongoose.model<ITracker>('Tracker', TrackerSchema);

export default Tracker;
