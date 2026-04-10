import mongoose, { type InferSchemaType } from 'mongoose'

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:      { type: String, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  price:     { type: Number, required: true },
}, { _id: false })

const ShippingAddressSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  address:    { type: String, required: true },
  city:       { type: String, required: true },
  postalCode: { type: String, required: true },
  country:    { type: String, required: true },
}, { _id: false })

const OrderSchema = new mongoose.Schema({
  items:                 { type: [OrderItemSchema], required: true },
  totalAmount:           { type: Number, required: true },
  currency:              { type: String, default: 'eur' },
  customerEmail:         { type: String, required: true, lowercase: true },
  shippingAddress:       { type: ShippingAddressSchema, required: true },
  stripePaymentIntentId: { type: String, default: '' },
  status:                { type: String, enum: ['pending', 'paid', 'shipped', 'delivered'], default: 'pending' },
  userId:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  xpAwarded:             { type: Boolean, default: false },
}, { timestamps: true })

export type IOrder = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId }

const Order = (mongoose.models.Order as mongoose.Model<IOrder>) ||
  mongoose.model<IOrder>('Order', OrderSchema)

export default Order
