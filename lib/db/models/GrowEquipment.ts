import mongoose, { type InferSchemaType } from 'mongoose'

const VALID_CATEGORIES = [
  'light_led', 'light_hps', 'light_cmh', 'light_cfl', 'light_t5',
  'exhaust_fan', 'circulation_fan', 'carbon_filter',
  'medium_soil', 'medium_coco', 'medium_hydro',
  'fabric_pot', 'plastic_pot', 'airpot',
  'watering_blumat', 'watering_drip', 'watering_manual',
  'nutrients_organic', 'nutrients_mineral',
  'ph_meter', 'ec_meter',
  'thermohygrometer', 'timer',
  'lst_tools', 'other',
] as const

const VALID_LIGHT_TYPES = ['led', 'hps', 'cmh', 'cfl', 't5'] as const

const GrowEquipmentSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  slug:            { type: String, required: true, unique: true, lowercase: true, trim: true },
  brand:           { type: String, default: '' },
  description:     { type: String, required: true },
  specs:           { type: mongoose.Schema.Types.Mixed, default: {} },
  imageUrl:        { type: String, default: '' },
  images:          [{ type: String }],
  prices: {
    czk:           { type: Number, required: true, min: 0 },
  },
  category:        { type: String, enum: VALID_CATEGORIES, required: true },
  lightType:       { type: String, enum: [...VALID_LIGHT_TYPES, null], default: null },
  compatibleMedia: [{ type: String }],
  sourceUrl:       { type: String, default: '' },
  isGenerated:     { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },
}, { timestamps: true })

GrowEquipmentSchema.index({ category: 1, isActive: 1 })
GrowEquipmentSchema.index({ brand: 1 })

export type IGrowEquipment = InferSchemaType<typeof GrowEquipmentSchema> & {
  _id: mongoose.Types.ObjectId
}

const GrowEquipment = (mongoose.models.GrowEquipment as mongoose.Model<IGrowEquipment>) ||
  mongoose.model<IGrowEquipment>('GrowEquipment', GrowEquipmentSchema)

export default GrowEquipment
