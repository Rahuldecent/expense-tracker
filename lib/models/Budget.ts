import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IBudgetDocument extends Document {
  category: string
  amount: number
  month: number
  year: number
  createdAt: Date
  updatedAt: Date
}

const BudgetSchema = new Schema<IBudgetDocument>(
  {
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

BudgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true })

const Budget: Model<IBudgetDocument> =
  mongoose.models.Budget || mongoose.model<IBudgetDocument>('Budget', BudgetSchema)

export default Budget
