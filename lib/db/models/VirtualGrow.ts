import mongoose, { type InferSchemaType } from 'mongoose'

const AttributeSchema = new mongoose.Schema({
  value:   { type: Number, required: true },
  optimal: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  status: { type: String, enum: ['optimal', 'warning', 'critical'], default: 'optimal' },
}, { _id: false })

const WarningSchema = new mongoose.Schema({
  attribute:   { type: String, required: true },
  message:     { type: String, required: true },
  guide:       { type: String, required: true },
  severity:    { type: String, enum: ['warning', 'critical'], required: true },
  triggeredAt: { type: Date, default: () => new Date() },
  resolvedAt:  { type: Date, default: null },
}, { _id: false })

const ActionSchema = new mongoose.Schema({
  type:      { type: String, required: true },
  timestamp: { type: Date, default: () => new Date() },
  xpEarned:  { type: Number, default: 0 },
  effect:    { type: String, default: '' },
}, { _id: false })

const JournalEntrySchema = new mongoose.Schema({
  day:         { type: Number, required: true },
  date:        { type: Date, default: () => new Date() },
  stage:       { type: String, required: true },
  photoUrl:    { type: String, default: '' },
  temperature: { type: Number, default: null },
  humidity:    { type: Number, default: null },
  ph:          { type: Number, default: null },
  ec:          { type: Number, default: null },
  waterAmount: { type: Number, default: null },
  nutrients:   [{ type: String }],
  techniques:  [{ type: String }],
  notes:       { type: String, default: '', maxlength: 500 },
  mood:        { type: String, enum: ['great', 'good', 'okay', 'bad'], default: 'good' },
  xpEarned:    { type: Number, default: 0 },
}, { _id: false })

const VirtualGrowSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  strainSlug:    { type: String, required: true },
  strainName:    { type: String, required: true },
  strainType:    { type: String, enum: ['indica', 'sativa', 'hybrid'], required: true },
  floweringTime: { type: Number, required: true },

  setup: {
    tentSize:            { type: String, enum: ['60x60', '80x80', '100x100', '120x120', '150x150'], required: true },
    lightType:           { type: String, enum: ['led', 'hps', 'cmh', 'cfl'], required: true },
    lightWatts:          { type: Number, required: true },
    lightBrand:          { type: String, default: '' },
    lightImageUrl:       { type: String, default: '' },
    medium:              { type: String, enum: ['living_soil', 'coco', 'hydro'], required: true },
    potSize:             { type: String, enum: ['small', 'medium', 'large'], required: true },
    potImageUrl:         { type: String, default: '' },
    mediumImageUrl:      { type: String, default: '' },
    watering:            { type: String, enum: ['manual', 'blumat', 'drip'], required: true },
    nutrients:           { type: String, enum: ['organic', 'mineral', 'none'], required: true },
    hasExhaustFan:       { type: Boolean, default: false },
    exhaustCFM:          { type: Number, default: 0 },
    hasCirculationFan:   { type: Boolean, default: false },
    hasCarbonFilter:     { type: Boolean, default: false },
    hasPHMeter:          { type: Boolean, default: false },
    hasECMeter:          { type: Boolean, default: false },
    hasHygrometer:       { type: Boolean, default: false },
  },

  dayDurationSeconds:  { type: Number, default: 86400, min: 60, max: 86400 },
  timeMode:            { type: String, enum: ['realtime', 'accelerated'], default: 'realtime' },
  accelerationFactor:  { type: Number, default: 10 },
  manualFlipDay:       { type: Number, default: null },

  startDate:    { type: Date, default: () => new Date() },
  lastAdvanced: { type: Date, default: () => new Date() },
  currentDay:   { type: Number, default: 0 },
  stage:        { type: String, enum: ['seedling', 'veg', 'flower', 'late_flower', 'harvest', 'complete', 'failed'], default: 'seedling' },

  environment: {
    temperature:  { type: Number, default: 24 },
    humidity:     { type: Number, default: 60 },
    ph:           { type: Number, default: 6.5 },
    ec:           { type: Number, default: 1.4 },
    lightHours:       { type: Number, default: 18 },
    lightHeight:      { type: Number, default: 60 },  // cm from canopy, 20–100
    exhaustFanSpeed:  { type: Number, default: 100 }, // 0–100 %
  },

  health:           { type: Number, default: 100, min: 0, max: 100 },
  maxHealth:        { type: Number, default: 100, min: 10, max: 100 },
  yieldProjection:  { type: Number, default: 0 },

  attributes: {
    temperature:  { type: AttributeSchema, default: () => ({ value: 24, optimal: { min: 22, max: 26 }, status: 'optimal' }) },
    humidity:     { type: AttributeSchema, default: () => ({ value: 60, optimal: { min: 65, max: 75 }, status: 'optimal' }) },
    light:        { type: AttributeSchema, default: () => ({ value: 0,  optimal: { min: 100, max: 200 }, status: 'warning' }) },
    ventilation:  { type: AttributeSchema, default: () => ({ value: 5,  optimal: { min: 20, max: 30 }, status: 'critical' }) },
    nutrients:    { type: AttributeSchema, default: () => ({ value: 50, optimal: { min: 0, max: 20 }, status: 'optimal' }) },
    watering:     { type: AttributeSchema, default: () => ({ value: 70, optimal: { min: 60, max: 80 }, status: 'optimal' }) },
  },

  warnings:       { type: [WarningSchema], default: [] },
  actions:        { type: [ActionSchema], default: [] },
  journalEntries: { type: [JournalEntrySchema], default: [] },

  purchasedUpgrades: { type: [{
    type:        { type: String, required: true },
    name:        { type: String, required: true },
    creditsCost: { type: Number, default: 0 },
    purchasedAt: { type: Date, default: () => new Date() },
  }], default: [] },

  setupChangedGroups: { type: [String], default: [] },

  xpEarned:        { type: Number, default: 0 },
  creditsSpent:    { type: Number, default: 0 },
  isAccelerated:   { type: Boolean, default: false },
  isPerkEligible:  { type: Boolean, default: true },

  harvestData: {
    gramsYield:    { type: Number, default: 0 },
    qualityScore:  { type: Number, default: 0 },
    creditsEarned: { type: Number, default: 0 },
    completedAt:   { type: Date, default: null },
  },

  status: { type: String, enum: ['active', 'completed', 'failed', 'abandoned'], default: 'active' },
}, { timestamps: true })

VirtualGrowSchema.index({ userId: 1, status: 1 })
VirtualGrowSchema.index({ userId: 1, strainSlug: 1 })

export type IVirtualGrow = InferSchemaType<typeof VirtualGrowSchema> & {
  _id: mongoose.Types.ObjectId
}

const VirtualGrow = (mongoose.models.VirtualGrow as mongoose.Model<IVirtualGrow>) ||
  mongoose.model<IVirtualGrow>('VirtualGrow', VirtualGrowSchema)

export default VirtualGrow
