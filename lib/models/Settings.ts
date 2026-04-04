import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IParserRuleDocument {
  bankName: string
  debitPattern: string
  creditPattern: string
  amountGroup: number
  merchantGroup?: number
  refGroup?: number
  enabled: boolean
}

export interface ISettingsDocument extends Document {
  gmailAccessToken?: string
  gmailRefreshToken?: string
  gmailTokenExpiry?: Date
  gmailEmail?: string
  lastEmailFetch?: Date
  emailParserRules: IParserRuleDocument[]
  emailIdentifiers: string[]
  createdAt: Date
  updatedAt: Date
}

const ParserRuleSchema = new Schema({
  bankName: String,
  debitPattern: String,
  creditPattern: String,
  amountGroup: { type: Number, default: 1 },
  merchantGroup: Number,
  refGroup: Number,
  enabled: { type: Boolean, default: true },
})

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    gmailAccessToken: String,
    gmailRefreshToken: String,
    gmailTokenExpiry: Date,
    gmailEmail: String,
    lastEmailFetch: Date,
    emailParserRules: [ParserRuleSchema],
    emailIdentifiers: { type: [String], default: ['alerts@hdfcbank.bank.in'] },
  },
  {
    timestamps: true,
  }
)

const Settings: Model<ISettingsDocument> =
  mongoose.models.Settings || mongoose.model<ISettingsDocument>('Settings', SettingsSchema)

export default Settings
