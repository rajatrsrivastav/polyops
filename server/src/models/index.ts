import { Schema, model } from 'mongoose';
const objectId = Schema.Types.ObjectId;
const integer = { validator: Number.isSafeInteger, message: 'Must be a safe integer' };
const options = { timestamps: true, strict: 'throw' as const };
const shopSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true },
    isDemo: { type: Boolean, default: false },
  },
  options,
);
export const Shop = model('Shop', shopSchema);
const userSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true },
    shopId: { type: objectId, required: true, ref: 'Shop', index: true },
    role: { type: String, enum: ['owner', 'staff'], required: true },
    email: { type: String, required: true, maxlength: 254 },
  },
  options,
);
export const User = model('User', userSchema);
const productSchema = new Schema(
  {
    shopId: { type: objectId, required: true, ref: 'Shop' },
    sku: { type: String, required: true, maxlength: 40 },
    name: { type: String, required: true, maxlength: 100 },
    pricePaise: { type: Number, required: true, min: 0, max: 100000000, validate: integer },
    stock: { type: Number, default: 0, min: 0, max: 100000000, validate: integer },
    stockVersion: { type: Number, default: 0, validate: integer },
    lowStockThreshold: { type: Number, default: 5, min: 0, max: 1000000, validate: integer },
    isActive: { type: Boolean, default: true },
  },
  options,
);
productSchema.index({ shopId: 1, sku: 1 }, { unique: true });
productSchema.index({ shopId: 1, isActive: 1, createdAt: -1 });
export const Product = model('Product', productSchema);
const orderItem = new Schema(
  {
    productId: { type: objectId, required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1, validate: integer },
    unitPricePaise: { type: Number, required: true, min: 0, validate: integer },
  },
  { _id: false, strict: 'throw' },
);
const statuses = ['pending', 'packed', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof statuses)[number];
const orderSchema = new Schema(
  {
    shopId: { type: objectId, required: true },
    code: { type: String, required: true },
    items: { type: [orderItem], required: true },
    channel: { type: String, enum: ['instagram', 'whatsapp', 'website', 'other'], required: true },
    customerName: { type: String, required: true, maxlength: 100 },
    customerPhone: { type: String, required: true, maxlength: 10 },
    subtotalPaise: { type: Number, required: true, min: 0, validate: integer },
    status: { type: String, enum: statuses, default: 'pending', required: true },
    idempotencyKey: String,
    requestHash: String,
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, enum: statuses, required: true },
            at: { type: Date, required: true },
            userId: { type: objectId, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  options,
);
orderSchema.index({ shopId: 1, code: 1 }, { unique: true });
// A compound sparse index includes documents with shopId but no key. Partial is required for optional keys.
orderSchema.index(
  { shopId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
orderSchema.index({ shopId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
export const Order = model('Order', orderSchema);
const movementSchema = new Schema(
  {
    shopId: { type: objectId, required: true },
    productId: { type: objectId, required: true },
    orderId: objectId,
    userId: { type: objectId, required: true },
    type: { type: String, enum: ['reserve', 'restock', 'receive'], required: true },
    qty: { type: Number, required: true, min: 1, validate: integer },
    balanceAfter: { type: Number, required: true, min: 0, validate: integer },
    note: { type: String, maxlength: 200 },
    idempotencyKey: String,
    requestHash: String,
  },
  options,
);
movementSchema.index({ shopId: 1, productId: 1, createdAt: -1 });
movementSchema.index(
  { shopId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
export const InventoryMovement = model('InventoryMovement', movementSchema);
const counterSchema = new Schema(
  { shopId: { type: objectId, required: true, unique: true }, seq: { type: Number, default: 0 } },
  options,
);
export const Counter = model('Counter', counterSchema);
const briefSchema = new Schema(
  {
    shopId: { type: objectId, required: true },
    week: { type: String, required: true },
    state: { type: String, enum: ['building', 'ready'], default: 'ready' },
    leaseId: String,
    leaseExpiresAt: Date,
    headline: { type: String, required: true },
    bullets: { type: [String], required: true },
    risks: { type: [String], required: true },
    source: { type: Schema.Types.Mixed, required: true },
    provider: { type: String, enum: ['gemini', 'template'], required: true },
  },
  options,
);
briefSchema.index({ shopId: 1, week: 1 }, { unique: true });
export const AiBrief = model('AiBrief', briefSchema);
