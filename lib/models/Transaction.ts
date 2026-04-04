import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITransactionDocument extends Document {
  amount: number
  type: 'debit' | 'credit'
  category: string
  merchant: string
  description: string
  date: Date
  source: 'email' | 'manual'
  bankName?: string
  referenceNo?: string
  rawEmail?: string
  emailId?: string
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransactionDocument>(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true,
    },
    category: {
      type: String,
      default: 'Others',
    },
    merchant: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['email', 'manual'],
      default: 'manual',
    },
    bankName: {
      type: String,
      default: '',
    },
    referenceNo: {
      type: String,
      default: '',
    },
    rawEmail: {
      type: String,
      default: '',
    },
    emailId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
)

TransactionSchema.index({ date: -1 })
TransactionSchema.index({ category: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ emailId: 1 }, { unique: true, sparse: true })

const Transaction: Model<ITransactionDocument> =
  mongoose.models.Transaction ||
  mongoose.model<ITransactionDocument>('Transaction', TransactionSchema)

export default Transaction
