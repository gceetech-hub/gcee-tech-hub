import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegistration extends Document {
  studentId: Types.ObjectId;
  eventId: Types.ObjectId;
  registeredAt?: Date;
  status?: string;
  source?: string;
}

const registrationSchema = new Schema<IRegistration>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, default: 'registered' },
  source: { type: String },
}, { timestamps: true });

export const Registration = mongoose.model<IRegistration>('Registration', registrationSchema);
