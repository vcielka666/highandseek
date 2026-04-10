import mongoose, { type InferSchemaType } from 'mongoose'

const ProductSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  slug:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  category:         { type: String, enum: ['seed', 'clone', 'flower', 'merch'], required: true },
  strain: {
    type:           { type: String, enum: ['indica', 'sativa', 'hybrid', null], default: null },
    genetics:       { type: String, default: '' },
    origin:         { type: String, enum: ['usa', 'european', 'landrace', null], default: null },
    floweringTime:  { type: Number, default: null },
    yield:          { type: String, enum: ['low', 'medium', 'high', null], default: null },
    difficulty:     { type: String, enum: ['easy', 'medium', 'hard', null], default: null },
    seedType:       { type: String, enum: ['feminized', 'autoflower', 'regular', null], default: null },
    climate:        { type: String, enum: ['indoor', 'outdoor', 'both', null], default: null },
  },
  description:      { type: String, required: true },
  shortDescription: { type: String, required: true, maxlength: 100 },
  price:            { type: Number, required: true, min: 0 },
  stock:            { type: Number, required: true, default: 0 },
  images:           [{ type: String }],
  tags:             [{ type: String }],
  isAvailable:      { type: Boolean, default: true },
  isFeatured:       { type: Boolean, default: false },
}, { timestamps: true })

ProductSchema.index({ category: 1, isAvailable: 1 })

export type IProduct = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId }

const Product = (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema)

export default Product
