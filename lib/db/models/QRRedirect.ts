import mongoose, { Schema } from 'mongoose'

const QRRedirectSchema = new Schema({
  slug:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  targetUrl: { type: String, required: true },
  label:     { type: String, required: true },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

const QRScanSchema = new Schema({
  slug:                      { type: String, required: true, index: true },
  timestamp:                 { type: Date, default: Date.now, index: true },
  userAgent:                 { type: String, default: '' },
  ip:                        { type: String, default: '' },
  country:                   { type: String, default: '' },
  city:                      { type: String, default: '' },
  device:                    { type: String, enum: ['ios', 'android', 'desktop', 'other'], default: 'other' },
  referrer:                  { type: String, default: '' },
  convertedToRegistration:   { type: Boolean, default: false },
  convertedAt:               { type: Date },
  sessionId:                 { type: String, default: '', index: true },
})

export const QRRedirect = mongoose.models.QRRedirect ?? mongoose.model('QRRedirect', QRRedirectSchema)
export const QRScan     = mongoose.models.QRScan     ?? mongoose.model('QRScan',     QRScanSchema)
